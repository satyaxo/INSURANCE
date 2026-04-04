import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-assign-claim',
  templateUrl: './assign-claim.component.html',
  styleUrls: ['./assign-claim.component.scss']
})
export class AssignClaimComponent implements OnInit {

  itemForm: FormGroup;

  claimList: any[] = [];
  investigatorList: any[] = [];
  underwriterList: any[] = [];

  showError = false;
  showMessage = false;
  errorMessage = '';
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      claimId: [null, Validators.required],
      investigatorId: [null, Validators.required],
      underwriterId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadClaims();
    this.loadInvestigators();
    this.loadUnderwriters();
  }

  // ✅ FIX: load assignable claims (UNDER_PROGRESS only)
  loadClaims(): void {
    this.httpService.getAssignableClaims().subscribe({
      next: (res: any[]) => {
        this.claimList = res || [];
        this.showError = false;
      },
      error: (err) => {
        console.error('Load claims failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading claims. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  loadInvestigators(): void {
    this.httpService.getAllInvestigators().subscribe({
      next: (res: any[]) => {
        this.investigatorList = res || [];
        this.showError = false;
      },
      error: (err) => {
        console.error('Load investigators failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading investigators. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  loadUnderwriters(): void {
    this.httpService.GetAllUnderwriter().subscribe({
      next: (res: any[]) => {
        this.underwriterList = res || [];
        this.showError = false;
      },
      error: (err) => {
        console.error('Load underwriters failed:', err);
        this.showError = true;
        this.errorMessage = `Error loading underwriters. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;
    this.errorMessage = '';
    this.responseMessage = '';

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    const { claimId, investigatorId, underwriterId } = this.itemForm.value;

    this.httpService.assignClaimToInvestigator(claimId, investigatorId).pipe(
      switchMap(() => this.httpService.AssignClaim({ claimId, underwriterId }))
    ).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Claim assigned to Investigator and Underwriter successfully.';
        this.itemForm.reset();
        this.loadClaims(); // refresh dropdown after assignment
      },
      error: (err) => {
        console.error('Assign workflow failed:', err);
        this.showError = true;
        const msg = err?.error?.message || err?.message || 'Error assigning claim.';
        this.errorMessage = `${msg} (${err?.status || 'NO_STATUS'})`;
      }
    });
  }
}