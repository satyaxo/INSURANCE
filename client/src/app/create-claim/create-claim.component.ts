import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      date: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

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
      date: this.itemForm.value.date,
      status: this.itemForm.value.status || 'Pending'
    };

    this.httpService.createClaims(payload, userId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim created successfully!';
        this.itemForm.reset();
        this.getClaims();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error creating claim.';
      }
    });
  }
}
