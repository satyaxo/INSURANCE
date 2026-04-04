import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

  // ✅ From backend
  allClaims: any[] = [];

  // ✅ What we show on UI (allClaims + search filter)
  displayClaims: any[] = [];

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

  // ✅ We will use stats.inbox as "SHOWING CLAIMS"
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
      claims: this.httpService.getAllClaims(),
      investigators: this.httpService.getAllInvestigators(),
      underwriters: this.httpService.GetAllUnderwriter()
    }).subscribe({
      next: (res: any) => {
        this.allClaims = Array.isArray(res.claims) ? res.claims : [];
        this.investigators = res.investigators || [];
        this.underwriters = res.underwriters || [];

        this.buildDisplayFromAllClaims();
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

  // ✅ IMPORTANT: Show ALL claims (no status-based filtering)
  private buildDisplayFromAllClaims(): void {
    const claims = this.applySearch(this.allClaims);

    // ✅ Optional: show latest first (by id desc)
    this.displayClaims = (claims || []).slice().sort((a: any, b: any) => (b?.id || 0) - (a?.id || 0));
  }

  onSearchChange(): void {
    this.buildDisplayFromAllClaims();
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

  // ✅ Drafts must reflect backend status after update (so it doesn't show old selection)
  private initDrafts(): void {
    (this.displayClaims || []).forEach(c => {
      // ✅ always sync status dropdown with backend status
      this.statusDraft[c.id] = c.status || this.statusDraft[c.id] || 'SUBMITTED';

      // ✅ keep selected investigator/underwriter if already chosen
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

  // ✅ Update status + assign investigator + assign underwriter (ONE CLICK)
  updateStatusAndAssign(claim: any): void {
    this.resetAlerts();

    const claimId = claim?.id;
    if (!claimId) {
      this.showError = true;
      this.errorMessage = 'Invalid claim id.';
      return;
    }

    const newStatus = this.statusDraft[claimId];
    const investigatorId = this.investigatorDraft[claimId];
    const underwriterId = this.underwriterDraft[claimId];

    if (!newStatus) {
      this.showError = true;
      this.errorMessage = 'Please select a status.';
      return;
    }
    if (!investigatorId) {
      this.showError = true;
      this.errorMessage = 'Please select an investigator.';
      return;
    }
    if (!underwriterId) {
      this.showError = true;
      this.errorMessage = 'Please select an underwriter.';
      return;
    }

    this.isLoading = true;

    const payload = {
      description: claim.description,
      date: claim.date,
      status: newStatus
    };

    // ✅ First update status, then assign both (safer)
    this.httpService.updateClaims(payload, claimId).pipe(
      switchMap(() => forkJoin([
        this.httpService.assignClaimToInvestigator(claimId, investigatorId),
        this.httpService.AssignClaim({ claimId, underwriterId })
      ]))
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.showMessage = true;
        this.responseMessage = 'Submitted successfully. Claim remains on dashboard with updated status.';
        this.loadAll(false);
      },
      error: (err) => {
        console.error('Update + Assign failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = err?.error?.message || `Submit failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  resetAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
  }

  // ✅ Stats always correct
  private computeStats(): void {
    const total = this.allClaims.length;
    const showing = this.displayClaims.length;

    const closed = this.allClaims.filter(c => {
      const s = (c?.status || '').toUpperCase();
      return s === 'APPROVED' || s === 'REJECTED';
    }).length;

    this.stats = {
      total,
      inbox: showing,  // USED AS "SHOWING CLAIMS"
      ready: 0,        // NOT USED
      closed
    };
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