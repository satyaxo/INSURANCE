import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-adjuster-dashboard',
  templateUrl: './adjusterDashboard.component.html',
  styleUrls: ['./adjusterDashboard.component.scss']
})
export class AdjusterDashboardComponent implements OnInit, OnDestroy {

  // Queues
  inboxClaims: any[] = [];        // SUBMITTED claims
  assignableClaims: any[] = [];   // UNDER_PROGRESS claims

  // Dropdown lists
  investigators: any[] = [];
  underwriters: any[] = [];

  // Draft selections per claim
  statusDraft: { [claimId: number]: string } = {};
  investigatorDraft: { [claimId: number]: number } = {};
  underwriterDraft: { [claimId: number]: number } = {};

  // UI state
  selectedClaim: any = null;
  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  // ✅ Documents state (NEW)
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  // Realtime polling
  private timer: any = null;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadAll(true);

    // ✅ realtime feel (optional): refresh every 15 sec
    this.timer = setInterval(() => this.loadQueuesOnly(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // Load everything (queues + dropdown lists)
  loadAll(showLoader: boolean): void {
    this.resetAlerts();
    this.isLoading = showLoader;

    forkJoin({
      inbox: this.httpService.getAllClaims(),
      assignable: this.httpService.getAssignableClaims(),
      investigators: this.httpService.getAllInvestigators(),
      underwriters: this.httpService.GetAllUnderwriter()
    }).subscribe({
      next: (res: any) => {
        this.inboxClaims = res.inbox || [];
        this.assignableClaims = res.assignable || [];
        this.investigators = res.investigators || [];
        this.underwriters = res.underwriters || [];
        this.isLoading = false;

        this.initDrafts(this.inboxClaims);
        this.initDrafts(this.assignableClaims);

        // ✅ If claim details already open, keep it consistent after refresh
        if (this.selectedClaim) {
          const id = this.selectedClaim.id;
          const updated =
            this.inboxClaims.find(c => c.id === id) ||
            this.assignableClaims.find(c => c.id === id) ||
            null;

          this.selectedClaim = updated;

          // reload docs again if still exists
          if (this.selectedClaim) {
            this.loadDocumentsForClaim(this.selectedClaim.id);
          } else {
            this.claimDocuments = [];
            this.docsError = '';
            this.docsLoading = false;
          }
        }
      },
      error: (err) => {
        console.error('Adjuster dashboard load failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to load adjuster dashboard. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // Load only queues (fast refresh)
  loadQueuesOnly(showLoader: boolean): void {
    if (showLoader) this.isLoading = true;
    this.resetAlerts();

    forkJoin({
      inbox: this.httpService.getAllClaims(),
      assignable: this.httpService.getAssignableClaims()
    }).subscribe({
      next: (res: any) => {
        this.inboxClaims = res.inbox || [];
        this.assignableClaims = res.assignable || [];
        this.isLoading = false;

        this.initDrafts(this.inboxClaims);
        this.initDrafts(this.assignableClaims);

        // Keep selection consistent
        if (this.selectedClaim) {
          const id = this.selectedClaim.id;
          const updated =
            this.inboxClaims.find(c => c.id === id) ||
            this.assignableClaims.find(c => c.id === id) ||
            null;

          this.selectedClaim = updated;

          // reload docs if claim still exists
          if (this.selectedClaim) {
            this.loadDocumentsForClaim(this.selectedClaim.id);
          } else {
            this.claimDocuments = [];
            this.docsError = '';
            this.docsLoading = false;
          }
        }
      },
      error: (err) => {
        console.error('Queue refresh failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to refresh claims. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // Initialize draft values if not set
  private initDrafts(list: any[]): void {
    list.forEach(c => {
      if (!this.statusDraft[c.id]) this.statusDraft[c.id] = c.status || 'SUBMITTED';
    });
  }

  // ✅ When clicking Details, load documents too
  selectClaim(claim: any): void {
    this.selectedClaim = claim;
    this.resetAlerts();

    this.claimDocuments = [];
    this.docsError = '';
    this.docsLoading = true;

    this.loadDocumentsForClaim(claim.id);
  }

  closeDetails(): void {
    this.selectedClaim = null;
    this.claimDocuments = [];
    this.docsError = '';
    this.docsLoading = false;
  }

  refreshNow(): void {
    this.loadAll(true);
  }

  resetAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
    // docsError kept separate
  }

  // ===========================
  // DOCUMENTS (NEW)
  // ===========================
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
        console.error('Load documents failed:', err);
        this.docsLoading = false;
        this.docsError = `Unable to load documents. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ✅ Preview in next tab (JWT-safe)
  previewDocument(doc: any): void {
    if (!doc?.id) return;

    this.docsError = '';

    this.httpService.downloadClaimDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        // ✅ open in next tab
        window.open(url, '_blank');

        // cleanup after 1 minute
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: (err) => {
        console.error('Preview failed:', err);
        this.docsError = `Preview failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ===========================
  // INLINE STATUS UPDATE
  // ===========================
  updateStatus(claim: any): void {
    this.resetAlerts();

    const newStatus = this.statusDraft[claim.id];
    if (!newStatus) {
      this.showError = true;
      this.errorMessage = 'Please select a status.';
      return;
    }

    const payload = {
      description: claim.description,
      date: claim.date,
      status: newStatus
    };

    this.httpService.updateClaims(payload, claim.id).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = `Status updated to ${newStatus}.`;
        this.loadQueuesOnly(false);
      },
      error: (err) => {
        console.error('Update status failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to update status. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ===========================
  // INLINE ASSIGNMENT
  // (only for UNDER_PROGRESS)
  // ===========================
  canAssign(claim: any): boolean {
    const st = (claim.status || '').toUpperCase();
    return st === 'UNDER_PROGRESS';
  }

  assignInvestigator(claim: any): void {
    this.resetAlerts();

    if (!this.canAssign(claim)) {
      this.showError = true;
      this.errorMessage = 'Only UNDER_PROGRESS claims can be assigned.';
      return;
    }

    const investigatorId = this.investigatorDraft[claim.id];
    if (!investigatorId) {
      this.showError = true;
      this.errorMessage = 'Please select an investigator.';
      return;
    }

    this.httpService.assignClaimToInvestigator(claim.id, investigatorId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Investigator assigned successfully.';
        this.loadQueuesOnly(false);
      },
      error: (err) => {
        console.error('Assign investigator failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to assign investigator. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  assignUnderwriter(claim: any): void {
    this.resetAlerts();

    if (!this.canAssign(claim)) {
      this.showError = true;
      this.errorMessage = 'Only UNDER_PROGRESS claims can be assigned.';
      return;
    }

    const underwriterId = this.underwriterDraft[claim.id];
    if (!underwriterId) {
      this.showError = true;
      this.errorMessage = 'Please select an underwriter.';
      return;
    }

    this.httpService.AssignClaim({ claimId: claim.id, underwriterId }).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Underwriter assigned successfully.';
        this.loadQueuesOnly(false);
      },
      error: (err) => {
        console.error('Assign underwriter failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to assign underwriter. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  assignBoth(claim: any): void {
    this.resetAlerts();

    if (!this.canAssign(claim)) {
      this.showError = true;
      this.errorMessage = 'Only UNDER_PROGRESS claims can be assigned.';
      return;
    }

    const investigatorId = this.investigatorDraft[claim.id];
    const underwriterId = this.underwriterDraft[claim.id];

    if (!investigatorId || !underwriterId) {
      this.showError = true;
      this.errorMessage = 'Select BOTH investigator and underwriter.';
      return;
    }

    this.httpService.assignClaimToInvestigator(claim.id, investigatorId).subscribe({
      next: () => {
        this.httpService.AssignClaim({ claimId: claim.id, underwriterId }).subscribe({
          next: () => {
            this.showMessage = true;
            this.responseMessage = 'Investigator & Underwriter assigned successfully.';
            this.loadQueuesOnly(false);
          },
          error: (err) => {
            console.error('Assign underwriter failed:', err);
            this.showError = true;
            this.errorMessage = err?.error?.message || `Failed to assign underwriter. (${err?.status || 'NO_STATUS'})`;
          }
        });
      },
      error: (err) => {
        console.error('Assign investigator failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to assign investigator. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  badgeClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'SUBMITTED') return 'badge bg-secondary';
    if (s === 'IN_PROGRESS') return 'badge bg-info';
    if (s === 'UNDER_PROGRESS') return 'badge bg-warning text-dark';
    if (s === 'INVESTIGATION_IN_PROGRESS') return 'badge bg-warning';
    if (s === 'INVESTIGATION_COMPLETED') return 'badge bg-primary';
    if (s === 'UNDER_REVIEW') return 'badge bg-dark';
    if (s === 'APPROVED') return 'badge bg-success';
    if (s === 'REJECTED') return 'badge bg-danger';
    return 'badge bg-secondary';
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