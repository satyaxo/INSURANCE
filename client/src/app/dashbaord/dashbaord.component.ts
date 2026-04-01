import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-dashbaord',
  templateUrl: './dashbaord.component.html',
  styleUrls: ['./dashbaord.component.scss']
})
export class DashbaordComponent implements OnInit {

  claimList: any[] = [];
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

    this.httpService.getClaimsByPolicyholder(userId).subscribe({
      next: (res: any[]) => {
        this.claimList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to fetch claim status.';
      }
    });
  }
}






// import { Component, OnInit } from '@angular/core';
// import { HttpService } from '../../services/http.service';

// @Component({
//   selector: 'app-dashbaord',
//   templateUrl: './dashbaord.component.html',
//   styleUrls: ['./dashbaord.component.scss']
// })
// export class DashbaordComponent implements OnInit {

//   roleName: string | null = '';
//   claimList: any[] = [];

//   showError = false;
//   errorMessage = '';

//   constructor(private httpService: HttpService) {}

//   ngOnInit(): void {
//     this.roleName = localStorage.getItem('role');

//     if (this.roleName === 'POLICYHOLDER') {
//       this.loadPolicyholderClaims();
//     } else if (this.roleName === 'ADJUSTER') {
//       this.loadAllClaims();
//     }
//   }

//   private loadPolicyholderClaims(): void {
//     const userId = localStorage.getItem('userId');

//     if (!userId) {
//       this.showError = true;
//       this.errorMessage = 'User not logged in.';
//       return;
//     }

//     this.httpService.getClaimsByPolicyholder(userId).subscribe({
//       next: (res: any[]) => this.claimList = res,
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Unable to fetch claim status.';
//       }
//     });
//   }

//   private loadAllClaims(): void {
//     this.httpService.getAllClaims().subscribe({
//       next: (res: any[]) => this.claimList = res,
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Unable to fetch claims.';
//       }
//     });
//   }

//   editClaim(claimId: number): void {
//     // Navigate to Update Claim page
//     window.location.href = `/update-claim`;
//   }
// }


















// import { Component, OnInit } from '@angular/core';
// import { HttpService } from '../../services/http.service';


// @Component({
//   selector: 'app-dashbaord',
//   templateUrl: './dashbaord.component.html',
//   styleUrls: ['./dashbaord.component.scss']
// })
// export class DashbaordComponent implements OnInit {

//   claimList: any[] = [];
//   showError = false;
//   errorMessage = '';

//   constructor(private httpService: HttpService) {}

//   ngOnInit(): void {
//     this.loadPolicyholderClaims();
//   }

//   private loadPolicyholderClaims(): void {
//     const userId = localStorage.getItem('userId');

//     if (!userId) {
//       this.showError = true;
//       this.errorMessage = 'User not logged in.';
//       return;
//     }

//     this.httpService.getClaimsByPolicyholder(userId).subscribe({
//       next: (res: any[]) => {
//         this.claimList = res;
//       },
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Unable to fetch claim status.';
//       }
//     });
//   }
// }





// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-dashbaord',
//   templateUrl: './dashbaord.component.html',
//   styleUrls: ['./dashbaord.component.scss']
// })
// export class DashbaordComponent {

// }
