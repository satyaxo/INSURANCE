import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-underwriter-dashboard',
  templateUrl: './underwriter-dashboard.component.html',
  styleUrls: ['./underwriter-dashboard.component.scss']
})
export class UnderwriterDashboardComponent implements OnInit {

  claims: any[] = [];
  filteredClaims: any[] = [];

  showError = false;
  errorMessage = '';

  constructor(private httpService: HttpService, private router: Router) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      this.showError = true;
      this.errorMessage = 'Underwriter not logged in.';
      return;
    }

    this.httpService.getClaimsForUnderwriter(+userId).subscribe({
      next: (res: any[]) => {
        this.claims = res || [];
        this.filteredClaims = res || [];
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'No claims assigned yet.';
      }
    });
  }

  filterStatus(status: string): void {
    if (status === 'ALL') {
      this.filteredClaims = this.claims;
    } else {
      this.filteredClaims = this.claims.filter(c => c.status === status);
    }
  }

  // ✅ FIX: Edit should go to Underwriter Update page (final decision page)
  editClaim(claim: any): void {
    this.router.navigate(['/update-claim-investigator'], {
      queryParams: { claimId: claim.id }
    });
  }
}