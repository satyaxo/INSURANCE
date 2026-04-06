import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-adjuster-dashboard',
  templateUrl: './adjusterDashboard.component.html',
  styleUrls: ['./adjusterDashboard.component.scss']
})
export class AdjusterDashboardComponent implements OnInit, OnDestroy {

  // ✅ Dashboard shows ONLY Inbox (SUBMITTED)
  inboxClaims: any[] = [];

  // ✅ Stored record list (read-only)
  processedClaims: any[] = [];

  // Draft status selection per claim
  statusDraft: { [claimId: number]: string } = {};

  // UI state
  selectedClaim: any = null;
  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  // Documents preview state
  claimDocuments: any[] = [];
  docsLoading = false;
  docsError = '';

  // ✅ Search by policy number
  policySearch: string = '';

  // ✅ localStorage key
  private readonly STORAGE_KEY = 'adjuster_processed_claims';

  // Realtime polling
  private timer: any = null;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    // ✅ Load stored records first (so they never disappear)
    this.loadProcessedFromStorage();

    this.loadInbox(true);

    // Optional refresh every 15 seconds
    this.timer = setInterval(() => this.loadInbox(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  refreshNow(): void {
    this.loadInbox(true);
  }

  // ✅ Load ONLY inbox claims (SUBMITTED)
  private loadInbox(showLoader: boolean): void {
    this.resetAlerts();
    this.isLoading = showLoader;

    this.httpService.getAllClaims().subscribe({
      next: (res: any[]) => {
        this.inboxClaims = res || [];
        this.isLoading = false;

        this.initDrafts(this.inboxClaims);

        // keep selected claim stable
        if (this.selectedClaim) {
          const id = this.selectedClaim.id;

          const updatedInInbox = this.inboxClaims.find(c => c.id === id);
          const updatedInProcessed = this.processedClaims.find(c => c.id === id);

          this.selectedClaim = updatedInInbox || updatedInProcessed || this.selectedClaim;

          if (this.selectedClaim?.id) {
            this.loadDocumentsForClaim(this.selectedClaim.id);
          }
        }
      },
      error: (err) => {
        console.error('Inbox load failed:', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to load inbox claims. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private initDrafts(list: any[]): void {
    list.forEach(c => {
      if (!this.statusDraft[c.id]) this.statusDraft[c.id] = c.status || 'SUBMITTED';
    });
  }

  // ✅ Search filter for Inbox claims
  filteredInboxClaims(): any[] {
    const q = this.normalizePolicySearch(this.policySearch);
    if (!q) return this.inboxClaims;

    return (this.inboxClaims || []).filter(c =>
      this.normalizePolicySearch(c?.policyNumber).includes(q)
    );
  }

  // ✅ Search filter for Processed claims
  filteredProcessedClaims(): any[] {
    const q = this.normalizePolicySearch(this.policySearch);
    if (!q) return this.processedClaims;

    return (this.processedClaims || []).filter(c =>
      this.normalizePolicySearch(c?.policyNumber).includes(q)
    );
  }

  clearSearch(): void {
    this.policySearch = '';
  }

  private normalizePolicySearch(value: any): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace('#', '');
  }

  // ✅ Open details panel + load documents
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
        console.error('Load documents failed:', err);
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

  // ✅ Update status (Inbox claim disappears by design, but we store it as record)
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

        // ✅ Save record in processed list
        const processedItem = { ...claim, status: newStatus };
        this.addToProcessed(processedItem);

        // ✅ Remove from inbox list (because status changed from SUBMITTED)
        this.inboxClaims = this.inboxClaims.filter(c => c.id !== claim.id);

        // keep details open
        if (this.selectedClaim?.id === claim.id) {
          this.selectedClaim = processedItem;
        }
      },
      error: (err) => {
        console.error('Update status failed:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to update status. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private addToProcessed(claim: any): void {
    const exists = this.processedClaims.some(c => c.id === claim.id);

    if (!exists) {
      this.processedClaims.unshift(claim);
    } else {
      this.processedClaims = this.processedClaims.map(c => c.id === claim.id ? claim : c);
    }

    // ✅ Persist as record (so it never disappears)
    this.saveProcessedToStorage();
  }

  private loadProcessedFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.processedClaims = raw ? JSON.parse(raw) : [];
    } catch {
      this.processedClaims = [];
    }
  }

  private saveProcessedToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.processedClaims || []));
  }

  resetAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
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