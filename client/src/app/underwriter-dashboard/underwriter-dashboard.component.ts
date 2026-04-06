import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

type FilterTab = 'ALL' | 'READY' | 'WAITING' | 'COMPLETED';

@Component({
  selector: 'app-underwriter-dashboard',
  templateUrl: './underwriter-dashboard.component.html',
  styleUrls: ['./underwriter-dashboard.component.scss']
})
export class UnderwriterDashboardComponent implements OnInit {

  claims: any[] = [];
  filteredClaims: any[] = [];

  loading = false;
  showError = false;
  errorMessage = '';

  activeTab: FilterTab = 'ALL';
  searchText = '';

  toast = '';
  showToast = false;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  // ✅ Loads claims using your existing backend endpoint:
  // GET /api/underwriter/claims?underwriterId=...
  loadClaims(): void {
    const userIdStr = localStorage.getItem('userId');

    if (!userIdStr) {
      this.showError = true;
      this.errorMessage = 'Underwriter not logged in.';
      return;
    }

    const underwriterId = Number(userIdStr);

    this.loading = true;
    this.showError = false;
    this.errorMessage = '';

    this.httpService.getAllClaimsForUnderwriter(underwriterId).subscribe({
      next: (res: any[]) => {
        console.log('✅ Underwriter claims:', res);

        this.claims = (res || []).map(c => this.normalizeClaim(c));
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Underwriter claims error:', err);
        this.loading = false;
        this.showError = true;

        if (err?.status === 404) this.errorMessage = 'API not found (404).';
        else if (err?.status === 401) this.errorMessage = 'Unauthorized (401). Token expired/missing.';
        else if (err?.status === 403) this.errorMessage = 'Forbidden (403). Underwriter role not allowed.';
        else this.errorMessage = 'Unable to load claims. Please try again.';

        this.claims = [];
        this.filteredClaims = [];
      }
    });
  }

  // ✅ Normalize + compute readiness for decision
  private normalizeClaim(claim: any): any {
    const claimId = this.getClaimId(claim);

    const statusRaw = (claim?.status || claim?.claimStatus || '').toString().toUpperCase();

    // ✅ Final decision already done?
    const finalCompleted = statusRaw === 'APPROVED' || statusRaw === 'REJECTED';

    // ✅ Investigator completion detection (handles many possible backend keys)
    const investigationCompleted =
      claim?.investigationCompleted === true ||
      claim?.isInvestigationCompleted === true ||
      claim?.investigatorApproved === true ||
      claim?.isInvestigatorApproved === true ||
      !!claim?.investigationReport ||
      !!claim?.investigation?.report ||
      !!claim?.investigationSummary ||
      !!claim?.report ||
      (claim?.investigationStatus || '').toString().toUpperCase() === 'COMPLETED' ||
      (claim?.investigation?.status || '').toString().toUpperCase() === 'COMPLETED' ||
      // sometimes status itself indicates investigator stage
      statusRaw.includes('INVESTIG') ||
      statusRaw.includes('REPORT') ||
      statusRaw === 'INVESTIGATOR_APPROVED' ||
      statusRaw === 'INVESTIGATION_COMPLETED';

    // ✅ Ready only if investigation is completed AND underwriter hasn't decided yet
    const readyForDecision = investigationCompleted && !finalCompleted;

    const insuranceType =
      claim?.insuranceType ??
      claim?.insurance_type ??
      claim?.claimType ??
      claim?.type ??
      claim?.policy?.insuranceType ??
      claim?.policyDetails?.insuranceType ??
      '-';

    const policyNumber =
      claim?.policyNumber ??
      claim?.policy_no ??
      claim?.policyNo ??
      claim?.policy?.policyNumber ??
      claim?.policyDetails?.policyNumber ??
      '-';

    const description =
      claim?.description ??
      claim?.claimDescription ??
      claim?.details ??
      claim?.reason ??
      'No description provided.';

    return {
      ...claim,
      claimId,
      statusRaw,
      insuranceType,
      policyNumber,
      description,
      investigationCompleted,
      finalCompleted,
      readyForDecision
    };
  }

  // ✅ Resolve claim id safely (handles id OR claimId)
  private getClaimId(claim: any): number {
    const id = claim?.id ?? claim?.claimId ?? claim?.claim_id;
    return Number(id);
  }

  // ✅ Tabs
  setTab(tab: FilterTab): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // ✅ Search + filter
  applyFilters(): void {
    let list = [...this.claims];

    if (this.activeTab === 'READY') {
      list = list.filter(c => c.readyForDecision);
    } else if (this.activeTab === 'WAITING') {
      list = list.filter(c => !c.investigationCompleted && !c.finalCompleted);
    } else if (this.activeTab === 'COMPLETED') {
      list = list.filter(c => c.finalCompleted);
    }

    const q = (this.searchText || '').trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        String(c.claimId || c.id).includes(q) ||
        String(c.policyNumber || '').toLowerCase().includes(q) ||
        String(c.insuranceType || '').toLowerCase().includes(q) ||
        String(c.description || '').toLowerCase().includes(q)
      );
    }

    this.filteredClaims = list;
  }

  // ✅ Counts
  get allCount(): number { return this.claims.length; }
  get readyCount(): number { return this.claims.filter(c => c.readyForDecision).length; }
  get waitingCount(): number { return this.claims.filter(c => !c.investigationCompleted && !c.finalCompleted).length; }
  get completedCount(): number { return this.claims.filter(c => c.finalCompleted).length; }

  // ✅ Labels
  stageLabel(c: any): string {
    if (c.finalCompleted) return 'Completed';
    if (c.readyForDecision) return 'Ready for Decision';
    return 'Waiting for Investigator';
  }

  // ✅ Approve (FIXED)
  approve(claim: any): void {
    console.log('✅ Approve clicked:', claim);

    const claimId = this.getClaimId(claim);
    if (!claimId) {
      this.showSmallToast('Claim ID missing. Cannot approve.');
      return;
    }

    if (!claim.readyForDecision) {
      this.showSmallToast('Not ready. Awaiting investigator completion.');
      return;
    }

    this.httpService.updateClaimStatusUnderwriter('APPROVED', claimId).subscribe({
      next: (res) => {
        console.log('✅ Approve success:', res);

        claim.statusRaw = 'APPROVED';
        claim.finalCompleted = true;
        claim.readyForDecision = false;

        this.applyFilters();
        this.showSmallToast(`Claim #${claimId} Approved ✅`);
      },
      error: (err) => {
        console.error('❌ Approve failed:', err);
        this.showSmallToast(`Approve failed (${err?.status || 'error'})`);
      }
    });
  }

  // ✅ Reject (FIXED)
  reject(claim: any): void {
    console.log('✅ Reject clicked:', claim);

    const claimId = this.getClaimId(claim);
    if (!claimId) {
      this.showSmallToast('Claim ID missing. Cannot reject.');
      return;
    }

    if (!claim.readyForDecision) {
      this.showSmallToast('Not ready. Awaiting investigator completion.');
      return;
    }

    this.httpService.updateClaimStatusUnderwriter('REJECTED', claimId).subscribe({
      next: (res) => {
        console.log('✅ Reject success:', res);

        claim.statusRaw = 'REJECTED';
        claim.finalCompleted = true;
        claim.readyForDecision = false;

        this.applyFilters();
        this.showSmallToast(`Claim #${claimId} Rejected ❌`);
      },
      error: (err) => {
        console.error('❌ Reject failed:', err);
        this.showSmallToast(`Reject failed (${err?.status || 'error'})`);
      }
    });
  }

  // ✅ Toast
  private showSmallToast(msg: string): void {
    this.toast = msg;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2500);
  }
}
``