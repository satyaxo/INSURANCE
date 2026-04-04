import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  claimList: any[] = [];
  selectedClaim: any = null;

  showError = false;
  errorMessage = '';

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  private loadClaims(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in.';
      return;
    }

    // ✅ IMPORTANT: use tracking endpoint (not normal claims)
    this.httpService.getPolicyholderClaimsTracking(+userId).subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];
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

  // ✅ FIX: Used by dashboard HTML to show "Bike Insurance" instead of "BIKE"
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

  getBadgeClass(stage: string): string {
    switch (stage) {
      case 'SUBMITTED': return 'badge bg-secondary';
      case 'ADJUSTER_REVIEW': return 'badge bg-info';
      case 'INVESTIGATION': return 'badge bg-warning';
      case 'INVESTIGATION_COMPLETED': return 'badge bg-primary';
      case 'UNDERWRITER_REVIEW': return 'badge bg-dark';
      case 'APPROVED': return 'badge bg-success';
      case 'REJECTED': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}