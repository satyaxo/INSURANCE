// import { Component, OnInit } from '@angular/core';
// import { HttpService } from '../../services/http.service';

// @Component({
//   selector: 'app-dashbaord',
//   templateUrl: './dashbaord.component.html',
//   styleUrls: ['./dashbaord.component.scss']
// })
// export class DashbaordComponent implements OnInit {

//   claimList: any[] = [];
//   selectedClaim: any = null;

//   showError = false;
//   errorMessage = '';

//   constructor(private httpService: HttpService) {}

//   ngOnInit(): void {
//     this.loadClaims();
//   }

//   private loadClaims(): void {
//     const userId = localStorage.getItem('userId');

//     if (!userId) {
//       this.showError = true;
//       this.errorMessage = 'User not logged in.';
//       return;
//     }

//     // ✅ IMPORTANT: use tracking endpoint (not normal claims)
//     this.httpService.getPolicyholderClaimsTracking(+userId).subscribe({
//       next: (res: any[]) => {
//         this.claimList = res || [];
//       },
//       error: (err) => {
//         console.error('Tracking API error:', err);
//         this.showError = true;
//         this.errorMessage = `Unable to fetch claim tracking details. (${err?.status || 'NO_STATUS'})`;
//       }
//     });
//   }

//   selectClaim(claim: any): void {
//     this.selectedClaim = claim;
//   }

//   // ✅ FIX: Used by dashboard HTML to show "Bike Insurance" instead of "BIKE"
//   typeLabel(type: string): string {
//     const t = (type || '').toUpperCase();
//     if (t === 'CAR') return 'Car Insurance';
//     if (t === 'BIKE') return 'Bike Insurance';
//     if (t === 'HEALTH') return 'Health Insurance';
//     if (t === 'LIFE') return 'Life Insurance';
//     if (t === 'TERM') return 'Term Insurance';
//     if (t === 'TRAVEL') return 'Travel Insurance';
//     if (t === 'HOME') return 'Home Insurance';
//     return type || '-';
//   }

//   getBadgeClass(stage: string): string {
//     switch (stage) {
//       case 'SUBMITTED': return 'badge bg-secondary';
//       case 'ADJUSTER_REVIEW': return 'badge bg-info';
//       case 'INVESTIGATION': return 'badge bg-warning';
//       case 'INVESTIGATION_COMPLETED': return 'badge bg-primary';
//       case 'UNDERWRITER_REVIEW': return 'badge bg-dark';
//       case 'APPROVED': return 'badge bg-success';
//       case 'REJECTED': return 'badge bg-danger';
//       default: return 'badge bg-secondary';
//     }
//   }
// }
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

type StageFilter = 'ALL' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  claimList: any[] = [];
  filteredClaims: any[] = [];
  selectedClaim: any = null;

  showError = false;
  errorMessage = '';

  // Role + user info
  userId: string | null = null;
  roleName: string | null = null;
  displayRole: string = 'User';

  // Search + filters
  searchText: string = '';
  stageFilter: StageFilter = 'ALL';

  // KPI stats
  stats = {
    total: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0
  };

  // Timeline steps (fixed workflow)
  steps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'ADJUSTER_REVIEW', label: 'Adjuster Review' },
    { key: 'INVESTIGATION', label: 'Investigation Assigned' },
    { key: 'INVESTIGATION_COMPLETED', label: 'Investigation Completed' },
    { key: 'UNDERWRITER_REVIEW', label: 'Underwriter Review' },
    { key: 'APPROVED', label: 'Approved' }
  ];

  constructor(
    private httpService: HttpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');

    // Try multiple keys because projects store role differently
    this.roleName = localStorage.getItem('role') || localStorage.getItem('roleName') || localStorage.getItem('userRole');
    this.displayRole = this.prettyRole(this.roleName);

    this.loadClaims();
  }

  refresh(): void {
    this.loadClaims();
  }

  clearSelection(): void {
    this.selectedClaim = null;
  }

  logout(): void {
    // Clear auth/session keys
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('roleName');
    localStorage.removeItem('userRole');

    this.router.navigate(['/login']);
  }

  private loadClaims(): void {
    this.showError = false;
    this.errorMessage = '';

    if (!this.userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in. Please login again.';
      return;
    }

    // ✅ Your tracking endpoint
    this.httpService.getPolicyholderClaimsTracking(+this.userId).subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];

        // If list empty, still safe
        this.applyFilters();
        this.computeStats();
      },
      error: (err) => {
        console.error('Tracking API error:', err);
        this.showError = true;
        this.errorMessage = `Unable to fetch claim tracking details. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  selectClaim(claim: any): void {
    this.selectedClaim = claim;
  }

  applyFilters(): void {
    const q = (this.searchText || '').trim().toLowerCase();

    let data = [...this.claimList];

    // Stage filter
    if (this.stageFilter === 'APPROVED') {
      data = data.filter(c => (c?.stage || '').toUpperCase() === 'APPROVED');
    } else if (this.stageFilter === 'REJECTED') {
      data = data.filter(c => (c?.stage || '').toUpperCase() === 'REJECTED');
    } else if (this.stageFilter === 'IN_PROGRESS') {
      data = data.filter(c => {
        const s = (c?.stage || '').toUpperCase();
        return s !== 'APPROVED' && s !== 'REJECTED';
      });
    }

    // Search
    if (q) {
      data = data.filter(c => {
        const policy = (c?.policyNumber || '').toLowerCase();
        const type = this.typeLabel(c?.insuranceType || '').toLowerCase();
        const stage = (c?.stage || '').toLowerCase();
        return policy.includes(q) || type.includes(q) || stage.includes(q);
      });
    }

    // Sort: newest first if date exists
    data.sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    this.filteredClaims = data;
  }

  setStageFilter(f: StageFilter): void {
    this.stageFilter = f;
    this.applyFilters();
  }

  private computeStats(): void {
    const list = this.claimList || [];
    const total = list.length;

    const approved = list.filter(c => (c?.stage || '').toUpperCase() === 'APPROVED').length;
    const rejected = list.filter(c => (c?.stage || '').toUpperCase() === 'REJECTED').length;
    const inProgress = total - approved - rejected;

    this.stats = { total, approved, rejected, inProgress };
  }

  // ===================== Helpers =====================

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

  stagePillClass(stage: string): string {
    const s = (stage || '').toUpperCase();
    if (s === 'SUBMITTED') return 'stage-submitted';
    if (s === 'ADJUSTER_REVIEW') return 'stage-review';
    if (s === 'INVESTIGATION') return 'stage-warning';
    if (s === 'INVESTIGATION_COMPLETED') return 'stage-review';
    if (s === 'UNDERWRITER_REVIEW') return 'stage-underwriter';
    if (s === 'APPROVED') return 'stage-approved';
    if (s === 'REJECTED') return 'stage-rejected';
    return 'stage-submitted';
  }

  stagePercent(stage: string): number {
    const s = (stage || '').toUpperCase();
    switch (s) {
      case 'SUBMITTED': return 15;
      case 'ADJUSTER_REVIEW': return 30;
      case 'INVESTIGATION': return 45;
      case 'INVESTIGATION_COMPLETED': return 60;
      case 'UNDERWRITER_REVIEW': return 80;
      case 'APPROVED': return 100;
      case 'REJECTED': return 100;
      default: return 10;
    }
  }

  isStepDone(currentStage: string, stepKey: string): boolean {
    const order = this.stepOrderIndex(currentStage);
    const stepIndex = this.stepOrderIndex(stepKey);
    return order > stepIndex || (currentStage || '').toUpperCase() === 'APPROVED';
  }

  isStepActive(currentStage: string, stepKey: string): boolean {
    return (currentStage || '').toUpperCase() === (stepKey || '').toUpperCase();
  }

  private stepOrderIndex(stage: string): number {
    const s = (stage || '').toUpperCase();
    const map: any = {
      SUBMITTED: 1,
      ADJUSTER_REVIEW: 2,
      INVESTIGATION: 3,
      INVESTIGATION_COMPLETED: 4,
      UNDERWRITER_REVIEW: 5,
      APPROVED: 6,
      REJECTED: 6
    };
    return map[s] || 0;
  }

  private prettyRole(role: string | null): string {
    const r = (role || '').toUpperCase();
    if (!r) return 'User';
    if (r === 'POLICYHOLDER') return 'Policyholder';
    if (r === 'ADJUSTER') return 'Adjuster';
    if (r === 'INVESTIGATOR') return 'Investigator';
    if (r === 'UNDERWRITER') return 'Underwriter';
    return role || 'User';
  }
}