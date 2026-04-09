import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-update-claim',
  templateUrl: './update-claim.component.html',
  styleUrls: ['./update-claim.component.scss']
})
export class UpdateClaimComponent implements OnInit {

  itemForm: FormGroup;
  claimList: any[] = [];
  updatedId: number | null = null;

  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
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
    this.showError = false;
    this.errorMessage = '';

    // This loads claims from /api/adjuster/claims
    this.httpService.getAllClaims().subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];
      },
      error: (err) => {
        console.error('Fetch claims failed:', err);
        this.showError = true;
        const msg = err?.error?.message || err?.message || 'Error fetching claims.';
        this.errorMessage = `${msg} (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  edit(claim: any): void {
    this.updatedId = claim.id;

    // ✅ REQUIRED CHANGE:
    // Default SUBMITTED -> IN_PROGRESS (so it stays in update page)
    // UNDER_PROGRESS should be selected manually when ready to assign.
    const status = claim.status === 'SUBMITTED' ? 'IN_PROGRESS' : claim.status;

    this.itemForm.patchValue({
      description: claim.description,
      date: this.formatDate(claim.date),
      status
    });
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;
    this.errorMessage = '';
    this.responseMessage = '';

    if (this.itemForm.invalid || !this.updatedId) {
      this.showError = true;
      this.errorMessage = 'Please select a claim and fill all fields.';
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
      error: (err) => {
        console.error('Update claim failed:', err);
        this.showError = true;
        const msg = err?.error?.message || err?.message || 'Error updating claim.';
        this.errorMessage = `${msg} (${err?.status || 'NO_STATUS'})`;
      }
    });
  }
}