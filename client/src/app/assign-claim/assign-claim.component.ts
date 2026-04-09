import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-assign-claim',
  templateUrl: './assign-claim.component.html',
  styleUrls: ['./assign-claim.component.scss']
})
export class AssignClaimComponent implements OnInit {

  itemForm: FormGroup;

  claimList: any[] = [];
  investigatorList: any[] = [];
  underwriterList: any[] = [];

  // ✅ Selected claim details + docs preview
  selectedClaim: any = null;
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  // ✅ Recently assigned (read-only record)
  recentlyAssigned: any[] = [];

  showError = false;
  showMessage = false;
  errorMessage = '';
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      claimId: [null, Validators.required],
      investigatorId: [null, Validators.required],
      underwriterId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadClaims();
    this.loadInvestigators();
    this.loadUnderwriters();

    // ✅ When claim changes in dropdown, show details + documents
    this.itemForm.get('claimId')?.valueChanges.subscribe((claimId) => {
      this.onClaimSelected(claimId);
    });
  }

  // ✅ Load assignable claims
  loadClaims(): void {
    this.httpService.getAssignableClaims().subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];
        this.showError = false;

        // If selected claim no longer available, clear preview
        const currentClaimId = this.itemForm.get('claimId')?.value;
        if (currentClaimId && !this.claimList.some(c => Number(c.id) === Number(currentClaimId))) {
          this.selectedClaim = null;
          this.claimDocuments = [];
          this.docsError = '';
          this.docsLoading = false;
        }
      },
      error: (err) => {
        console.error('Load claims failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading claims. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  loadInvestigators(): void {
    this.httpService.getAllInvestigators().subscribe({
      next: (res: any[]) => {
        this.investigatorList = res || [];
        this.showError = false;
      },
      error: (err) => {
        console.error('Load investigators failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading investigators. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  loadUnderwriters(): void {
    this.httpService.GetAllUnderwriter().subscribe({
      next: (res: any[]) => {
        this.underwriterList = res || [];
        this.showError = false;
      },
      error: (err) => {
        console.error('Load underwriters failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading underwriters. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ✅ Claim selection -> show details/docs
  private onClaimSelected(claimId: any): void {
    if (!claimId) {
      this.selectedClaim = null;
      this.claimDocuments = [];
      this.docsError = '';
      this.docsLoading = false;
      return;
    }

    const id = Number(claimId);
    this.selectedClaim = (this.claimList || []).find(c => Number(c.id) === id) || null;

    if (this.selectedClaim) {
      this.loadDocumentsForClaim(this.selectedClaim.id);
    } else {
      this.claimDocuments = [];
      this.docsError = '';
      this.docsLoading = false;
    }
  }

  private loadDocumentsForClaim(claimId: number): void {
    this.docsLoading = true;
    this.docsError = '';
    this.claimDocuments = [];

    this.httpService.getClaimDocuments(claimId).subscribe({
      next: (res: any[]) => {
        this.claimDocuments = res || [];
        this.docsLoading = false;
      },
      error: (err) => {
        console.error('Docs load failed:', err);
        this.docsLoading = false;
        this.docsError = `Unable to load documents. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ✅ Preview doc in new tab
  previewDocument(doc: any): void {
    if (!doc?.id) return;

    this.docsError = '';

    this.httpService.downloadClaimDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: (err) => {
        console.error('Preview failed:', err);
        this.docsError = `Preview failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;
    this.errorMessage = '';
    this.responseMessage = '';

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    const claimId = Number(this.itemForm.value.claimId);
    const investigatorId = Number(this.itemForm.value.investigatorId);
    const underwriterId = Number(this.itemForm.value.underwriterId);

    // ✅ Snapshot claim before it disappears from dropdown
    const assignedClaimSnapshot =
      (this.claimList || []).find(c => Number(c.id) === claimId) || this.selectedClaim;

    // ✅ SINGLE API CALL: assign-all (prevents status override + partial assignment)
    this.httpService.assignClaimToBoth(claimId, investigatorId, underwriterId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim assigned to Investigator and Underwriter successfully.';

        // ✅ Move to Recently Assigned record
        if (assignedClaimSnapshot) {
          this.addToRecentlyAssigned({
            ...assignedClaimSnapshot,
            assignedInvestigatorId: investigatorId,
            assignedUnderwriterId: underwriterId
          });
        }

        // ✅ Reset UI
        this.itemForm.reset();
        this.selectedClaim = null;
        this.claimDocuments = [];
        this.docsError = '';
        this.docsLoading = false;

        // ✅ refresh dropdown so assigned claim disappears
        this.loadClaims();
      },
      error: (err) => {
        console.error('Assign-all failed:', err);
        this.showError = true;
        const msg = err?.error?.message || err?.message || 'Error assigning claim.';
        this.errorMessage = `${msg} (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private addToRecentlyAssigned(claim: any): void {
    const exists = this.recentlyAssigned.some(c => c.id === claim.id);
    if (!exists) {
      this.recentlyAssigned.unshift(claim);
    } else {
      this.recentlyAssigned = this.recentlyAssigned.map(c => c.id === claim.id ? claim : c);
    }
  }

  typeLabel(type: string): string {
    const t = (type || '').toUpperCase();
    if (t === 'CAR') return 'Car Insurance';
    if (t === 'BIKE') return 'Bike Insurance';
    if (t === 'HEALTH') return 'Health Insurance';
    if (t === 'LIFE') return 'Life Insurance';
    if (t === 'TERM') return 'Term Insurance';
    if (t === 'TRAVEL') return 'Travel Insurance';
    if (t === 'HOME') return 'Home Insurance';
    return type || 'Claim';
  }
}
