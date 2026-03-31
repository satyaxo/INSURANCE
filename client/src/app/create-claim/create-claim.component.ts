import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-claim',
  templateUrl: './create-claim.component.html',
  styleUrls: ['./create-claim.component.scss']
})
export class CreateClaimComponent implements OnInit {


  itemForm: FormGroup;

  formModel: any = {
    description: '',
    date: '',
   status: ''
  };

  showError = false;
  errorMessage: any = '';
  claimList: any[] = [];
  assignModel: any = {};
  showMessage = false;
  responseMessage: any = '';

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {

    this.itemForm = this.formBuilder.group({
      description: ['', Validators.required],
      // date: ['', Validators.required],
      // status: ['',[Validators.required]]
    });
  }
//   dateValidator(control:AbstractControl):ValidationErrors|null{
// let dateValue=control.value;
// let regex=/^\d{4}-\d{2}-\d{2}$/;
// if(!regex.test(dateValue))
//   return {invalidDate:true};
// else
//   return null;

//   }

  ngOnInit(): void {
    this.getClaims();
  }

  getClaims(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in.';
      return;
    }

    this.httpService.getClaimsByPolicyholder(userId).subscribe({
      next: (res: any[]) => this.claimList = res,
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error fetching claims.';
      }
    });
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
  // date: new Date(this.itemForm.value.date).toISOString().split('T')[0], // YYYY-MM-DD
  // status: this.itemForm.value.status || 'Pending'
};
    // const payload = {
    //   description: this.itemForm.value.description,
    //   date: this.itemForm.value.date,
    //   status: this.itemForm.value.status || 'Pending'
    // };

    this.httpService.createClaims(payload, userId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim created successfully!';
        this.itemForm.reset();
        this.getClaims();
      },
      // error: () => {
      //   this.showError = true;
      //   this.errorMessage = 'Error creating claim.';
      // }
      
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
