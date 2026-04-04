import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { forkJoin } from 'rxjs';

type ClaimStatus =
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'UNDER_PROGRESS'
  | 'INVESTIGATION_IN_PROGRESS'
  | 'INVESTIGATION_COMPLETED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | string;

@Component({
  selector: 'app-adjuster-dashboard',
  templateUrl: './adjusterDashboard.component.html',
  styleUrls: ['./adjusterDashboard.component.scss']
})
export class AdjusterDashboardComponent implements OnInit, OnDestroy {

  allClaims: any[] = [];
  inboxClaims: any[] = [];
  assignableClaims: any[] = [];

  investigators: any[] = [];
  underwriters: any[] = [];

  statusDraft: { [claimId: number]: ClaimStatus } = {};
  investigatorDraft: { [claimId: number]: number | null } = {};
  underwriterDraft: { [claimId: number]: number | null } = {};

  selectedClaim: any = null;

  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  searchText: string = '';

  stats = { total: 0, inbox: 0, ready: 0, closed: 0 };

  private timer: any = null;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadAll(true);
    this.timer = setInterval(() => this.loadAll(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  refreshNow(): void {
    this.loadAll(true);
  }

  loadAll(showLoader: boolean): void {
    this.resetAlerts();
    this.isLoading = showLoader;

    forkJoin({
      claims: this.httpService.getAllClaims(),            // ✅ MUST be /claims endpoint
      investigators: this.httpService.getAllInvestigators(),
      underwriters: this.httpService.GetAllUnderwriter()
    }).subscribe({
      next: (res: any) => {
        this.allClaims = Array.isArray(res.claims) ? res.claims : [];
        this.investigators = res.investigators || [];
        this.underwriters = res.underwriters || [];

        this.buildQueuesFromAllClaims();
        this.initDrafts();
        this.computeStats();

        // keep details consistent
        if (this.selectedClaim?.id) {
          this.selectedClaim = this.allClaims.find(c => c.id === this.selectedClaim.id) || null;
          if (this.selectedClaim) this.loadDocumentsForClaim(this.selectedClaim.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Adjuster dashboard load failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to load adjuster dashboard. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private buildQueuesFromAllClaims(): void {
    const claims = this.applySearch(this.allClaims);

    this.inboxClaims = claims.filter(c => (c?.status || '').toUpperCase() === 'SUBMITTED');

    this.assignableClaims = claims.filter(c => {
      const s = (c?.status || '').toUpperCase();
      return s === 'UNDER_PROGRESS' || s === 'IN_PROGRESS' || s === 'UNDER_REVIEW' || s === 'INVESTIGATION_IN_PROGRESS';
    });
  }

  onSearchChange(): void {
    this.buildQueuesFromAllClaims();
    this.computeStats();
  }

  private applySearch(list: any[]): any[] {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) return list || [];

    return (list || []).filter(c => {
      const policy = (c?.policyNumber || '').toLowerCase();
      const type = this.typeLabel(c?.insuranceType || '').toLowerCase();
      const status = (c?.status || '').toLowerCase();
      const desc = (c?.description || '').toLowerCase();
      return policy.includes(q) || type.includes(q) || status.includes(q) || desc.includes(q);
    });
  }

  private initDrafts(): void {
    [...this.inboxClaims, ...this.assignableClaims].forEach(c => {
      if (!this.statusDraft[c.id]) this.statusDraft[c.id] = c.status || 'SUBMITTED';
      if (this.investigatorDraft[c.id] === undefined) this.investigatorDraft[c.id] = null;
      if (this.underwriterDraft[c.id] === undefined) this.underwriterDraft[c.id] = null;
    });
  }

  selectClaim(claim: any): void {
    this.selectedClaim = claim;
    this.claimDocuments = [];
    this.docsError = '';
    this.loadDocumentsForClaim(claim.id);
  }

  closeDetails(): void {
    this.selectedClaim = null;
    this.claimDocuments = [];
    this.docsError = '';
    this.docsLoading = false;
  }

  private loadDocumentsForClaim(claimId: number): void {
    this.docsLoading = true;
    this.docsError = '';
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

  previewDocument(doc: any): void {
    if (!doc?.id) return;

    this.httpService.downloadClaimDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: (err) => {
        console.error('Preview failed:', err);
        this.docsError = `Preview failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  updateStatus(claim: any): void {
    this.resetAlerts();

    const newStatus = this.statusDraft[claim.id];
    if (!newStatus) {
      this.showError = true;
      this.errorMessage = 'Please select a status.';
      return;
    }

    const payload = { description: claim.description, date: claim.date, status: newStatus };

    this.httpService.updateClaims(payload, claim.id).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = `Status updated to ${newStatus}.`;
        this.loadAll(false);
      },
      error: (err) => {
        console.error('Update status failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to update status. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  assignInvestigator(claim: any): void {
    this.resetAlerts();

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
        this.loadAll(false);
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
        this.loadAll(false);
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

    const investigatorId = this.investigatorDraft[claim.id];
    const underwriterId = this.underwriterDraft[claim.id];

    if (!investigatorId || !underwriterId) {
      this.showError = true;
      this.errorMessage = 'Select BOTH investigator and underwriter.';
      return;
    }

    forkJoin([
      this.httpService.assignClaimToInvestigator(claim.id, investigatorId),
      this.httpService.AssignClaim({ claimId: claim.id, underwriterId })
    ]).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Investigator & Underwriter assigned successfully.';
        this.loadAll(false);
      },
      error: (err) => {
        console.error('Assign both failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Assign both failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  resetAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
  }

  private computeStats(): void {
    const total = this.allClaims.length;
    const inbox = this.inboxClaims.length;
    const ready = this.assignableClaims.length;
    const closed = this.allClaims.filter(c => {
      const s = (c?.status || '').toUpperCase();
      return s === 'APPROVED' || s === 'REJECTED';
    }).length;

    this.stats = { total, inbox, ready, closed };
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