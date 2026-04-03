import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-claim',
  templateUrl: './create-claim.component.html',
  styleUrls: ['./create-claim.component.scss']
})
export class CreateClaimComponent {

   selectedFiles: File[] = [];
  itemForm: FormGroup;

  showError = false;
  errorMessage = '';

  showMessage = false;
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      description: ['', Validators.required],
      date: ['', Validators.required] // ✅ keep date
    });
  }
// ✅ 2. Add these two methods INSIDE the class (before or after onSubmit)
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.push(...Array.from(input.files));
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }
  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in.';
      return;
    }

    const payload = {
      description: this.itemForm.value.description,
      date: this.itemForm.value.date // ✅ send date to backend
    };

    this.httpService.createClaims(payload, userId).subscribe({
      next: (res:any) => {
          // ✅ ADD THIS BLOCK
  const claimId = res.id;
  if (this.selectedFiles.length > 0 && claimId) {
    this.httpService.uploadClaimDocuments(claimId, this.selectedFiles).subscribe({
      next: () => console.log('Files uploaded'),
      error: (err) => console.error('Upload failed', err)
    });
  }
  this.selectedFiles = []; // ✅ clear files after submit
  // ✅ END OF ADDED BLOCK

  // your existing code continues below...
  this.responseMessage = '✅ Claim created successfully!';
        this.responseMessage = '✅ Claim created successfully!';
        this.showMessage = true;
        this.itemForm.reset();

        // ✅ auto‑hide popup
        setTimeout(() => {
          this.showMessage = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Create claim error:', err);
        this.showError = true;
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          'Error creating claim.';
      }
    });
  }
}







// import { Component, OnInit } from '@angular/core';
// import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { HttpService } from '../../services/http.service';
// import { AuthService } from '../../services/auth.service';

// @Component({
//   selector: 'app-create-claim',
//   templateUrl: './create-claim.component.html',
//   styleUrls: ['./create-claim.component.scss']
// })
// export class CreateClaimComponent implements OnInit {


//   itemForm: FormGroup;

//   formModel: any = {
//     description: '',
//     date: '',
//    status: ''
//   };

//   showError = false;
//   errorMessage: any = '';
//   claimList: any[] = [];
//   assignModel: any = {};
//   showMessage = false;
//   responseMessage: any = '';

//   constructor(
//     public router: Router,
//     public httpService: HttpService,
//     private formBuilder: FormBuilder,
//     private authService: AuthService
//   ) {

//     this.itemForm = this.formBuilder.group({
//       description: ['', Validators.required],
//       // date: ['', Validators.required],
//       // status: ['',[Validators.required]]
//     });
//   }
// //   dateValidator(control:AbstractControl):ValidationErrors|null{
// // let dateValue=control.value;
// // let regex=/^\d{4}-\d{2}-\d{2}$/;
// // if(!regex.test(dateValue))
// //   return {invalidDate:true};
// // else
// //   return null;

// //   }

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

//     this.httpService.getClaimsByPolicyholder(userId).subscribe({
//       next: (res: any[]) => this.claimList = res,
//       error: () => {
//         this.showError = true;
//         this.errorMessage = 'Error fetching claims.';
//       }
//     });
//   }

//   onSubmit(): void {
//     this.showError = false;
//     this.showMessage = false;

//     if (this.itemForm.invalid) {
//       this.showError = true;
//       this.errorMessage = 'Please fill in all required fields.';
//       return;
//     }

//     const userId = localStorage.getItem('userId');
//     if (!userId) {
//       this.showError = true;
//       this.errorMessage = 'User not logged in.';
//       return;
//     }
// const payload = {
//   description: this.itemForm.value.description,
//   // date: new Date(this.itemForm.value.date).toISOString().split('T')[0], // YYYY-MM-DD
//   // status: this.itemForm.value.status || 'Pending'
// };
//     // const payload = {
//     //   description: this.itemForm.value.description,
//     //   date: this.itemForm.value.date,
//     //   status: this.itemForm.value.status || 'Pending'
//     // };

//     this.httpService.createClaims(payload, userId).subscribe({
//       next: () => {
//         this.showMessage = true;
//         this.responseMessage = 'Claim created successfully!';
//         this.itemForm.reset();
//         this.getClaims();
//       },
//       // error: () => {
//       //   this.showError = true;
//       //   this.errorMessage = 'Error creating claim.';
//       // }
      
// error: (err) => {
//   console.error('Create claim error:', err);
//   this.showError = true;
//   this.errorMessage =
//     err?.error?.message ||
//     err?.message ||
//     'Error creating claim.';
// }

//     });
//   }
// }
