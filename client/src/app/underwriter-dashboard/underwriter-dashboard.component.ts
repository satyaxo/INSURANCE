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
  investigations: any[] = [];
  showError = false;
  errorMessage = '';

  constructor(private httpService: HttpService , private router: Router) {}

  ngOnInit(): void {
    this.loadClaims();
    
  }


  editClaim(claim: any) {
  this.router.navigate(['/underwriter-edit', claim.id]);
}
  loadClaims() {
  const userId = localStorage.getItem('userId');

  this.httpService.getClaimsForUnderwriter(+userId!).subscribe({
    next: (res: any[]) => {
      this.claims = res;
      this.filteredClaims = res; // important
    },
    error: () => {
      this.showError = true;
      this.errorMessage = 'No claims assigned yet.';
    }
  });
}

//   loadClaims() {
//     this.httpService.getAllClaims().subscribe({
//       next: (res: any[]) => this.claims = res,
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Unable to fetch claims.';
//       }
//     });
//   }

  loadInvestigations() {
    this.httpService.getInvestigations().subscribe({
      next: (res: any[]) => this.investigations = res,
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to fetch investigations.';
      }
    });
  }

  getInvestigationByClaim(claimId: number) {
    return this.investigations.find(inv => inv.claim?.id === claimId);
  }

  filteredClaims: any[] = [];

  filterStatus(status: string) {
    if (status === 'ALL') {
      this.filteredClaims = this.claims;
    } else {
      this.filteredClaims = this.claims.filter(c => c.status === status);
    }
  }

  selectedClaim: any = null;

// editClaim(claim: any) {
//   this.selectedClaim = claim;
// }

  updateStatus(claimId: number, status: string) {
    this.httpService.updateClaimStatus(claimId, status).subscribe({
      next: () => {
        this.loadClaims();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Failed to update claim status.';
      }
    });
  }
}