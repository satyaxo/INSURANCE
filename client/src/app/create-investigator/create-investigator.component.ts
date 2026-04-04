import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-create-investigator',
  templateUrl: './create-investigator.component.html',
  styleUrls: ['./create-investigator.component.scss']
})
export class CreateInvestigatorComponent implements OnInit {

  itemForm: FormGroup;
  assignedClaims: any[] = [];
  investigationList: any[] = [];

  updateId: number | null = null;

  // ✅ Selected claim full details
  selectedClaim: any = null;

  // ✅ Claim documents
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      claimId: ['', Validators.required],
      report: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const investigatorId = localStorage.getItem('userId');

    if (!investigatorId) {
      this.showError = true;
      this.errorMessage = 'Investigator not logged in.';
      return;
    }

    this.loadAssignedClaims(+investigatorId);
    this.getInvestigation();
  }

  loadAssignedClaims(investigatorId: number): void {
    this.httpService.getClaimsByInvestigator(investigatorId).subscribe({
      next: (res: any[]) => {
        this.assignedClaims = res || [];
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load assigned claims.';
      }
    });
  }

  getInvestigation(): void {
    this.httpService.getInvestigations().subscribe({
      next: (res: any[]) => {
        this.investigationList = res || [];
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load investigations.';
      }
    });
  }

  // ✅ Called when investigator changes claim dropdown
  onClaimChange(): void {
    const claimId = Number(this.itemForm.value.claimId);

    if (!claimId) {
      this.selectedClaim = null;
      this.claimDocuments = [];
      this.docsError = '';
      this.docsLoading = false;
      return;
    }

    // ✅ Set selected claim details
    this.selectedClaim = this.assignedClaims.find(c => c.id === claimId) || null;

    // ✅ Load documents for selected claim
    this.loadDocumentsForClaim(claimId);
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

  // ✅ Preview document in new tab (JWT-safe: blob -> url)
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

  edit(inv: any): void {
    // ✅ Block edit if already completed
    if (inv?.status === 'Completed' || inv?.status === 'COMPLETED') return;

    this.updateId = inv.id;

    this.itemForm.patchValue({
      claimId: inv.claim?.id,
      report: inv.report,
      status: inv.status
    });

    // ✅ auto-load selected claim details + docs
    setTimeout(() => this.onClaimChange(), 0);
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;
    this.errorMessage = '';
    this.responseMessage = '';

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'All fields are required.';
      return;
    }

    const payload = {
      claim: { id: this.itemForm.value.claimId },
      report: this.itemForm.value.report,
      status: this.itemForm.value.status
    };

    const investigatorId = Number(localStorage.getItem('userId'));

    // ✅ update existing investigation
    if (this.updateId) {
      this.httpService.updateInvestigation(payload, this.updateId).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation updated successfully!';

          this.itemForm.reset();
          this.updateId = null;

          this.selectedClaim = null;
          this.claimDocuments = [];
          this.docsError = '';
          this.docsLoading = false;

          this.loadAssignedClaims(investigatorId);
          this.getInvestigation();
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Failed to update investigation.';
        }
      });
    }
    // ✅ create new investigation
    else {
      this.httpService.createInvestigation(payload).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation submitted successfully and sent to Underwriter.';

          this.itemForm.reset();
          this.updateId = null;

          this.selectedClaim = null;
          this.claimDocuments = [];
          this.docsError = '';
          this.docsLoading = false;

          this.loadAssignedClaims(investigatorId);
          this.getInvestigation();
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Failed to create investigation.';
        }
      });
    }
  }
}
