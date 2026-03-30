import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-update-claim',
  templateUrl: './update-claim.component.html',
  styleUrls: ['./update-claim.component.scss']
})

export class UpdateClaimComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { status: null };
  showError: boolean = false;
  errorMessage: any = '';
  claimList: any[] = [];
  assignModel: any = {};
  showMessage: any = false;
  responseMessage: any = '';
  updatedId: any = null;

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      description: ['', Validators.required],
      date: ['', Validators.required],
      status: [this.formModel.status, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getClaims();
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

  edit(val: any): void {
    this.updatedId = val.id;
    this.itemForm.patchValue({
      description: val.description,
      status: val.status,
      date: this.formatDate(val.date)
    });
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;

    if (this.itemForm.invalid || !this.updatedId) {
      this.showError = true;
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.httpService.updateClaims(this.itemForm.value, this.updatedId).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim updated successfully!';
        this.itemForm.reset();
        this.updatedId = null;
        this.getClaims();
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error updating claim.';
      }
    });
  }
}
