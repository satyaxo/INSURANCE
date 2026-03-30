import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-update-claim-investigator',
  templateUrl: './update-claim-investigator.component.html',
  styleUrls: ['./update-claim-investigator.component.scss']
})

export class UpdateClaimInvestigatorComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { status: null };
  showError: boolean = false;
  errorMessage: any = '';
  claimList: any[] = [];
  assignModel: any = {};
  showMessage: any = false;
  responseMessage: any = '';
  updateId: any = null;

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      status: [this.formModel.status, Validators.required]
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

    this.httpService.getClaimsByUnderwriter(userId).subscribe({
      next: (res: any[]) => {
        this.claimList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error fetching claims.';
      }
    });
  }

  edit(val: any): void {
    this.updateId = val.id;
    this.itemForm.patchValue({
      status: val.status
    });
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;

    if (this.itemForm.invalid || !this.updateId) {
      this.showError = true;
      this.errorMessage = 'Please select a claim and status.';
      return;
    }

    this.httpService.updateClaimsStatus(this.itemForm.value.status, this.updateId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim status updated successfully!';
        this.itemForm.reset();
        this.updateId = null;
        this.getClaims();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error updating claim status.';
      }
    });
  }
}
