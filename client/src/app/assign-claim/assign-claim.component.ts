import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-assign-claim',
  templateUrl: './assign-claim.component.html',
  styleUrls: ['./assign-claim.component.scss']
})

export class AssignClaimComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { claimId: null, underwriterId: null };
  showError: boolean = false;
  errorMessage: any = '';
  assignModel: any = {};
  showMessage: any = false;
  responseMessage: any = '';
  claimList: any[] = [];
  underwriterList: any[] = [];

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      claimId: [this.formModel.claimId, Validators.required],
      underwriterId: [this.formModel.underwriterId, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getClaims();
    this.getUnderwriter();
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
//this.httpService.AssignClaim(this.itemForm.value).subscribe({
    this.httpService.AssignClaim(this.itemForm.value).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim successfully assigned!';
        this.itemForm.reset();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error assigning claim.';
      }
    });
  }

  getClaims(): void {
    this.httpService.getAllClaims().subscribe({
      next: (res: any[]) => {
        this.claimList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error fetching claims.';
      }
    });
  }
// this.httpService.GetAllUnderwriter().subscribe({
  getUnderwriter(): void {
    this.httpService.GetAllUnderwriter().subscribe({
      next: (res: any[]) => {
        this.underwriterList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error fetching underwriters.';
      }
    });
  }
}
