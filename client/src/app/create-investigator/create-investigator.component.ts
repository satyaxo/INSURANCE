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

  // ✅ Dropdown list (hide completed only)
  pendingAssignedClaims: any[] = [];

  // ✅ Selected claim + docs
  selectedClaim: any = null;
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  updateId: number | null = null;

  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  // ✅ record search
  recordSearch = '';

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

    this.loadAll(+investigatorId);

    // ✅ When claim dropdown changes -> show details/docs
    this.itemForm.get('claimId')?.valueChanges.subscribe(() => {
      this.onClaimChange();
    });
  }

  private loadAll(investigatorId: number): void {
    this.loadInvestigations(() => {
      this.loadAssignedClaims(investigatorId);
    });
  }

  private loadAssignedClaims(investigatorId: number): void {
    this.httpService.getClaimsByInvestigator(investigatorId).subscribe({
      next: (res: any[]) => {
        this.assignedClaims = res || [];
        this.applyDropdownFilter();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load assigned claims.';
      }
    });
  }

  private loadInvestigations(after?: () => void): void {
    this.httpService.getInvestigations().subscribe({
      next: (res: any[]) => {
        this.investigationList = res || [];
        this.applyDropdownFilter();
        if (after) after();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load investigations.';
        if (after) after();
      }
    });
  }

  // ✅ Status check (robust)
  private isCompletedStatus(status: any): boolean {
    const st = (status || '').toString().trim().toUpperCase();
    return st.includes('COMPLETED'); // matches Completed / INVESTIGATION_COMPLETED / COMPLETED_REPORT etc.
  }

  // ✅ Hide completed from dropdown only
  private applyDropdownFilter(): void {
    const completedClaimIds = new Set<number>();

    (this.investigationList || []).forEach(inv => {
      const claimId = inv?.claim?.id;
      if (claimId && this.isCompletedStatus(inv?.status)) {
        completedClaimIds.add(Number(claimId));
      }
    });

    this.pendingAssignedClaims = (this.assignedClaims || []).filter(c => {
      const id = Number(c?.id);
      return id && !completedClaimIds.has(id);
    });

    // if selected claim becomes completed -> clear selection
    const selectedId = Number(this.itemForm.get('claimId')?.value);
    if (selectedId && completedClaimIds.has(selectedId)) {
      this.itemForm.patchValue({ claimId: '' });
      this.clearSelection();
    }
  }

  // ✅ FIXED: always sets selectedClaim correctly (handles string/number)
  onClaimChange(): void {
    const raw = this.itemForm.get('claimId')?.value;
    const claimId = Number(raw);

    if (!claimId) {
      this.clearSelection();
      return;
    }

    // ✅ IMPORTANT FIX: compare numeric id to numeric id
    this.selectedClaim = (this.assignedClaims || []).find(c => Number(c.id) === claimId) || null;

    if (this.selectedClaim) {
      this.loadDocumentsForClaim(claimId);
    } else {
      this.clearDocs();
    }
  }

  private clearSelection(): void {
    this.selectedClaim = null;
    this.clearDocs();
  }

  private clearDocs(): void {
    this.claimDocuments = [];
    this.docsError = '';
    this.docsLoading = false;
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
    if (this.isCompletedStatus(inv?.status)) return;

    this.updateId = inv.id;
    this.itemForm.patchValue({
      claimId: inv.claim?.id,
      report: inv.report,
      status: inv.status
    });

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
      this.itemForm.markAllAsTouched();
      return;
    }

    const payload = {
      claim: { id: this.itemForm.value.claimId },
      report: this.itemForm.value.report,
      status: this.itemForm.value.status
    };

    const investigatorId = Number(localStorage.getItem('userId'));

    if (this.updateId) {
      this.httpService.updateInvestigation(payload, this.updateId).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation updated successfully!';
          this.updateId = null;
          this.resetAfterSubmit(investigatorId);
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Failed to update investigation.';
        }
      });
    } else {
      this.httpService.createInvestigation(payload).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation submitted successfully!';
          this.updateId = null;
          this.resetAfterSubmit(investigatorId);
        },
        error: (err) => {
          this.showError = true;
          this.errorMessage = err?.error?.message || 'Failed to create investigation.';
        }
      });
    }
  }

  // ✅ FIX: clean method name + correct calls with this.resetAfterSubmit(...)
  private resetAfterSubmit(investigatorId: number): void {
    const st = (this.itemForm.value.status || '').toString();

    // clear report/status
    this.itemForm.patchValue({ report: '', status: '' });

    // reload lists
    this.loadAll(investigatorId);

    // if completed -> remove only from dropdown by clearing selection
    if (this.isCompletedStatus(st)) {
      this.itemForm.patchValue({ claimId: '' });
      this.clearSelection();
    }
  }

  filteredInvestigations(): any[] {
    const q = (this.recordSearch || '').trim().toLowerCase();
    if (!q) return this.investigationList || [];

    return (this.investigationList || []).filter(inv => {
      const pn = (inv?.claim?.policyNumber || '').toString().toLowerCase();
      const desc = (inv?.claim?.description || '').toString().toLowerCase();
      const st = (inv?.status || '').toString().toLowerCase();
      return pn.includes(q) || desc.includes(q) || st.includes(q);
    });
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
    return type || '-';
  }
}
