import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-my-policies',
  templateUrl: './my-policies.component.html',
  styleUrls: ['./my-policies.component.scss']
})
export class MyPoliciesComponent implements OnInit {

  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  policyholderId = 0;
  policies: any[] = [];
  activePolicy: any = null;

  search = '';
  filter: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'PENDING' = 'ALL';

  constructor(
    public router: Router,
    private http: HttpService
  ) {}

  ngOnInit(): void {
    this.policyholderId = Number(localStorage.getItem('userId'));

    if (!this.policyholderId) {
      this.showError = true;
      this.errorMessage = 'Policyholder not logged in.';
      return;
    }

    this.loadPolicies();
  }

  loadPolicies(): void {
    this.isLoading = true;

    this.http.getActivePolicy(this.policyholderId).subscribe({
      next: res => this.activePolicy = res,
      error: () => this.activePolicy = null
    });

    this.http.getMyPolicies(this.policyholderId).subscribe({
      next: res => {
        this.policies = res || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = 'Unable to load policies.';
      }
    });
  }

  /* ✅ SAFE TEMPLATE GETTERS */

  get filteredPolicies(): any[] {
    let list = [...this.policies];

    if (this.filter === 'ACTIVE') {
      list = list.filter(p =>
        p.policyStatus === 'ACTIVE' && p.paymentStatus === 'PAID'
      );
    } else if (this.filter === 'PENDING') {
      list = list.filter(p =>
        p.paymentStatus === 'PENDING'
      );
    } else if (this.filter === 'EXPIRED') {
      list = list.filter(p =>
        p.policyStatus === 'EXPIRED'
      );
    }

    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      list = list.filter(p =>
        (p.policyNumber || '').toLowerCase().includes(q) ||
        (p.insuranceType || '').toLowerCase().includes(q) ||
        (p.planType || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  get activeCount(): number {
    return this.policies.filter(p =>
      p.policyStatus === 'ACTIVE' && p.paymentStatus === 'PAID'
    ).length;
  }

  isActiveCard(p: any): boolean {
    return (
      this.activePolicy &&
      p.policyNumber === this.activePolicy.policyNumber
    );
  }

  setFilter(f: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'PENDING'): void {
    this.filter = f;
  }

  clearSearch(): void {
    this.search = '';
  }

  typeLabel(type: string): string {
    const map: any = {
      CAR: 'Car Insurance',
      BIKE: 'Bike Insurance',
      HEALTH: 'Health Insurance',
      LIFE: 'Life Insurance',
      TERM: 'Term Insurance',
      TRAVEL: 'Travel Insurance',
      HOME: 'Home Insurance'
    };
    return map[type] || type;
  }

  formatINR(n: number): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }

  /* ✅ MISSING METHOD – NOW ADDED */
  badgeClass(p: any): string {
    const status = (p?.policyStatus || '').toUpperCase();
    const payment = (p?.paymentStatus || '').toUpperCase();

    if (status === 'ACTIVE' && payment === 'PAID') {
      return 'bp-badge active';
    }
    if (status === 'EXPIRED') {
      return 'bp-badge expired';
    }
    if (status === 'CANCELLED') {
      return 'bp-badge cancelled';
    }
    if (payment === 'FAILED') {
      return 'bp-badge failed';
    }
    if (status === 'PENDING' || payment === 'PENDING') {
      return 'bp-badge pending';
    }
    return 'bp-badge neutral';
  }
}