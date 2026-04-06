import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

type TrackStep = {
  key: string;
  title: string;
  subtitle: string;
};

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  isLoading = false;
  showError = false;
  errorMessage = '';

  trackingList: any[] = [];
  selected: any = null;

  policySearch = '';

  steps: TrackStep[] = [
    { key: 'SUBMITTED',               title: 'Submitted',              subtitle: 'Claim received successfully' },
    { key: 'ADJUSTER_REVIEW',         title: 'Adjuster Review',         subtitle: 'Claim validation in progress' },
    { key: 'INVESTIGATION',           title: 'Investigation Assigned',  subtitle: 'Investigator assigned to case' },
    { key: 'INVESTIGATION_COMPLETED', title: 'Investigation Completed', subtitle: 'Investigation report submitted' },
    { key: 'UNDERWRITER_REVIEW',      title: 'Underwriter Review',      subtitle: 'Final decision under review' },
    { key: 'APPROVED',                title: 'Approved',               subtitle: 'Claim approved for settlement' },
    { key: 'REJECTED',                title: 'Rejected',               subtitle: 'Claim rejected after review' }
  ];

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadTracking();
  }

  loadTracking(): void {
    this.isLoading = true;
    this.showError = false;
    this.errorMessage = '';

    const policyholderId = Number(localStorage.getItem('userId'));
    if (!policyholderId) {
      this.isLoading = false;
      this.showError = true;
      this.errorMessage = 'Policyholder not logged in.';
      return;
    }

    this.httpService.getPolicyholderClaimsTracking(policyholderId).subscribe({
      next: (res: any[]) => {
        this.trackingList = res || [];
        this.isLoading = false;

        if (!this.selected && this.trackingList.length > 0) {
          this.selectClaim(this.trackingList[0]);
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = `Unable to load claim tracking. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  selectClaim(item: any): void {
    this.selected = item;
  }

  clearSearch(): void {
    this.policySearch = '';
  }

  filteredList(): any[] {
    const q = (this.policySearch || '').trim().toLowerCase().replace('#', '');
    if (!q) return this.trackingList;

    return (this.trackingList || []).filter(c =>
      ((c?.policyNumber || '').toString().toLowerCase().replace('#','')).includes(q)
    );
  }

  activeIndex(item: any): number {
    const stage = (item?.stage || item?.status || '').toString().trim().toUpperCase();

    if (stage === 'REJECTED') return this.steps.findIndex(s => s.key === 'REJECTED');

    const idx = this.steps.findIndex(s => s.key === stage);
    return idx >= 0 ? idx : 0;
  }

  isDone(item: any, stepIndex: number): boolean {
    const ai = this.activeIndex(item);
    const stage = (item?.stage || item?.status || '').toString().trim().toUpperCase();

    if (stage === 'REJECTED') return stepIndex < ai;
    return stepIndex < ai;
  }

  isActive(item: any, stepIndex: number): boolean {
    return this.activeIndex(item) === stepIndex;
  }

  isRejected(item: any): boolean {
    const stage = (item?.stage || item?.status || '').toString().trim().toUpperCase();
    return stage === 'REJECTED' || (item?.status || '').toString().trim().toUpperCase() === 'REJECTED';
  }

  badgeClass(item: any): string {
    const st = (item?.status || '').toString().trim().toUpperCase();
    if (st === 'APPROVED') return 'ic-badge approved';
    if (st === 'REJECTED') return 'ic-badge rejected';
    if (st === 'UNDER_REVIEW') return 'ic-badge review';
    if (st.includes('INVESTIGATION')) return 'ic-badge invest';
    if (st === 'SUBMITTED') return 'ic-badge submitted';
    return 'ic-badge progress';
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

  progressPercent(item: any): number {
    const ai = this.activeIndex(item);
    const total = this.steps.length - 1;
    return total <= 0 ? 0 : Math.round((ai / total) * 100);
  }
}