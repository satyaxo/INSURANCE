import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-update-claim-investigator',
  templateUrl: './update-claim-investigator.component.html',
  styleUrls: ['./update-claim-investigator.component.scss']
})
export class UpdateClaimInvestigatorComponent implements OnInit {

  claimList: any[] = [];
  selectedClaim: any = null;

  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    const underwriterId = localStorage.getItem('userId');

    if (!underwriterId) {
      this.showError = true;
      this.errorMessage = 'Underwriter not logged in.';
      return;
    }

    this.httpService.getClaimsForUnderwriter(+underwriterId).subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];
      },
      error: (err) => {
        console.error('Unable to load claims for underwriter:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || 'Unable to load claims for underwriter.';
      }
    });
  }

  selectClaim(claim: any): void {
    this.selectedClaim = claim;
    this.showMessage = false;
    this.showError = false;
  }

  approveClaim(): void {
    this.updateStatus('APPROVED');
  }

  rejectClaim(): void {
    this.updateStatus('REJECTED');
  }

  private updateStatus(status: string): void {
    if (!this.selectedClaim) return;

    this.httpService.updateClaimStatusUnderwriter(status, this.selectedClaim.id).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = `Claim ${status.toLowerCase()} successfully.`;
        this.selectedClaim = null;
        this.loadClaims();
      },
      error: (err) => {
        console.error('Unable to update claim status:', err);
        this.showError = true;
        this.errorMessage = err?.error?.message || 'Unable to update claim status.';
      }
    });
  }

  // ✅ Helper: report exists?
  hasReport(): boolean {
    return !!(this.selectedClaim && this.selectedClaim.investigationReport && this.selectedClaim.investigationReport.trim());
  }
}