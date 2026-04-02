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
        this.claimList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load claims for underwriter.';
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
        this.showError = true;
        this.errorMessage =
          err?.error?.message || 'Unable to update claim status.';
      }
    });
  }
}








// import { Component, OnInit } from '@angular/core';
// import { FormGroup, FormBuilder, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { AuthService } from '../../services/auth.service';
// import { HttpService } from '../../services/http.service';

// @Component({
//   selector: 'app-update-claim-investigator',
//   templateUrl: './update-claim-investigator.component.html',
//   styleUrls: ['./update-claim-investigator.component.scss']
// })

// export class UpdateClaimInvestigatorComponent implements OnInit {

//   itemForm: FormGroup;
//   formModel: any = { status: null };
//   showError: boolean = false;
//   errorMessage: any = '';
//   claimList: any[] = [];
//   assignModel: any = {};
//   showMessage: any = false;
//   responseMessage: any = '';
//   updateId: any = null;

//   constructor(
//     public router: Router,
//     public httpService: HttpService,
//     private formBuilder: FormBuilder,
//     private authService: AuthService
//   ) {
//     this.itemForm = this.formBuilder.group({
//       status: [this.formModel.status, Validators.required]
//     });
//   }

//   ngOnInit(): void {
//     this.getClaims();
//   }

//   getClaims(): void {
//     const userId = localStorage.getItem('userId');
//     if (!userId) {
//       this.showError = true;
//       this.errorMessage = 'User not logged in.';
//       return;
//     }

//     this.httpService.getClaimsByUnderwriter(userId).subscribe({
//       next: (res: any[]) => {
//         this.claimList = res;
//       },
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Error fetching claims.';
//       }
//     });
//   }

//   edit(val: any): void {
//     this.updateId = val.id;
//     this.itemForm.patchValue({
//       status: val.status
//     });
//   }

//   onSubmit(): void {
//     this.showError = false;
//     this.showMessage = false;

//     if (this.itemForm.invalid || !this.updateId) {
//       this.showError = true;
//       this.errorMessage = 'Please select a claim and status.';
//       return;
//     }

//     this.httpService.updateClaimsStatus(this.itemForm.value.status, this.updateId).subscribe({
//       next: () => {
//         this.showMessage = true;
//         this.responseMessage = 'Claim status updated successfully!';
//         this.itemForm.reset();
//         this.updateId = null;
//         this.getClaims();
//       },
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Error updating claim status.';
//       }
//     });
//   }
// }
