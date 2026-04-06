import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-underwriter-dashboard',
  templateUrl: './underwriter-dashboard.component.html',
  styleUrls: ['./underwriter-dashboard.component.scss']
})
export class UnderwriterDashboardComponent implements OnInit, OnDestroy {

  // Raw claims for this underwriter
  allClaims: any[] = [];

  // Workbench split lists
  pendingReview: any[] = [];   // UNDER_REVIEW
  decisions: any[] = [];       // APPROVED / REJECTED

  // Selected claim for review panel
  selectedClaim: any = null;

  // Search by policy number
  policySearch = '';

  // Documents
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  // UI
  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  // Optional auto-refresh
  private timer: any = null;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadClaims(true);

    // Optional: auto-refresh every 20 seconds
    this.timer = setInterval(() => this.loadClaims(false), 20000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  refreshNow(): void {
    this.loadClaims(true);
  }

  // ---------------------------
  // Load claims
  // ---------------------------
  private loadClaims(showLoader: boolean): void {
    this.resetAlerts();
    this.isLoading = showLoader;

    const underwriterId = Number(localStorage.getItem('userId'));
    if (!underwriterId) {
      this.isLoading = false;
      this.showError = true;
      this.errorMessage = 'Underwriter not logged in.';
      return;
    }

    this.httpService.getClaimsForUnderwriter(underwriterId).subscribe({
      next: (res: any[]) => {
        this.allClaims = res || [];
        this.splitLists();
        this.isLoading = false;

        // keep selection consistent
        if (this.selectedClaim) {
          const updated = this.allClaims.find(c => c.id === this.selectedClaim.id);
          this.selectedClaim = updated || this.selectedClaim;

          if (this.selectedClaim?.id) {
            this.loadDocumentsForClaim(this.selectedClaim.id);
          }
        }
      },
      error: (err) => {
        console.error('Underwriter claims load failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to load claims. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private splitLists(): void {
    const list = this.allClaims || [];

    this.pendingReview = list.filter(c => (c?.status || '').toUpperCase() === 'UNDER_REVIEW');

    this.decisions = list.filter(c => {
      const st = (c?.status || '').toUpperCase();
      return st === 'APPROVED' || st === 'REJECTED';
    });
  }

  // ---------------------------
  // Search filter
  // ---------------------------
  filteredPending(): any[] {
    const q = this.normalize(this.policySearch);
    if (!q) return this.pendingReview;

    return (this.pendingReview || []).filter(c => this.normalize(c?.policyNumber).includes(q));
  }

  filteredDecisions(): any[] {
    const q = this.normalize(this.policySearch);
    if (!q) return this.decisions;

    return (this.decisions || []).filter(c => this.normalize(c?.policyNumber).includes(q));
  }

  clearSearch(): void {
    this.policySearch = '';
  }

  private normalize(v: any): string {
    return (v || '').toString().trim().toLowerCase().replace('#', '');
  }

  // ---------------------------
  // Select claim + docs
  // ---------------------------
  selectClaim(claim: any): void {
    this.selectedClaim = claim;
    this.resetAlerts();
    this.loadDocumentsForClaim(claim.id);
  }

  closeDetails(): void {
    this.selectedClaim = null;
    this.claimDocuments = [];
    this.docsLoading = false;
    this.docsError = '';
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

  // Preview doc in new tab (JWT safe)
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

  // ---------------------------
  // Investigation report getters (supports BOTH shapes)
  // Some APIs return claim.investigation.report
  // Some APIs return investigationReport/investigationStatus fields in DTO
  // ---------------------------
  getInvestigationStatus(claim: any): string {
    return claim?.investigation?.status || claim?.investigationStatus || 'Not Available';
  }

  getInvestigationReport(claim: any): string {
    return claim?.investigation?.report || claim?.investigationReport || '';
  }

  hasInvestigation(claim: any): boolean {
    const status = this.getInvestigationStatus(claim);
    const report = this.getInvestigationReport(claim);
    return !!(status && status !== 'Not Available') || !!report;
  }

  // ---------------------------
  // Approve / Reject
  // ---------------------------
  approve(): void {
    this.reviewSelected('APPROVED');
  }

  reject(): void {
    this.reviewSelected('REJECTED');
  }

  private reviewSelected(status: 'APPROVED' | 'REJECTED'): void {
    this.resetAlerts();

    if (!this.selectedClaim) return;

    if (!this.hasInvestigation(this.selectedClaim)) {
      this.showError = true;
      this.errorMessage = 'Investigation report not completed yet.';
      return;
    }

    const claimId = this.selectedClaim.id;

    this.httpService.updateClaimStatusUnderwriter(status, claimId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = `Claim ${status.toLowerCase()} successfully.`;

        // Update local view immediately
        this.selectedClaim = { ...this.selectedClaim, status };
        this.allClaims = this.allClaims.map(c => c.id === claimId ? this.selectedClaim : c);

        this.splitLists();
      },
      error: (err) => {
        console.error('Review failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Review failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // ---------------------------
  // UI helpers
  // ---------------------------
  resetAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
  }

  badgeClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'UNDER_REVIEW') return 'badge bg-dark';
    if (s === 'APPROVED') return 'badge bg-success';
    if (s === 'REJECTED') return 'badge bg-danger';
    if (s.includes('COMPLETED')) return 'badge bg-primary';
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
    return type || '-';
  }
}