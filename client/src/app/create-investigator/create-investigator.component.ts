import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-create-investigator',
  templateUrl: './create-investigator.component.html',
  styleUrls: ['./create-investigator.component.scss']
})
export class CreateInvestigatorComponent implements OnInit {

  itemForm: FormGroup;
  assignedClaims: any[] = [];
  investigationList: any[] = [];
  updateId: number | null = null;

  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      claimId: ['', Validators.required],
      report: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const investigatorId = localStorage.getItem('userId');

    if (!investigatorId) {
      this.showError = true;
      this.errorMessage = 'Investigator not logged in.';
      return;
    }

    this.httpService.getClaimsByInvestigator(+investigatorId).subscribe({
      next: (res: any[]) => {
        this.assignedClaims = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Unable to load assigned claims.';
      }
    });

    this.getInvestigation();
  }

  getInvestigation(): void {
    this.httpService.getInvestigations().subscribe({
      next: (res: any[]) => {
        this.investigationList = res;
      }
    });
  }

  edit(inv: any): void {
    this.updateId = inv.id;
    this.itemForm.patchValue({
      claimId: inv.claim?.id,
      report: inv.report,
      status: inv.status
    });
  }

  // ✅ ✅ THIS IS THE IMPORTANT FIX
  onSubmit(): void {
    console.log('SUBMIT CLICKED');

    this.showError = false;
    this.showMessage = false;

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'All fields are required.';
      return;
    }

    const payload = {
      claim: { id: this.itemForm.value.claimId },
      report: this.itemForm.value.report,
      status: this.itemForm.value.status
    };

    console.log('Payload →', payload);

    this.httpService.createInvestigation(payload).subscribe({
      next: (res) => {
        console.log('✅ Investigation created:', res);

        this.showMessage = true;
        this.responseMessage =
          'Investigation submitted successfully and sent to Underwriter.';

        this.itemForm.reset();

        // Refresh assigned claims so completed ones disappear
        const investigatorId = localStorage.getItem('userId');
        if (investigatorId) {
          this.httpService
            .getClaimsByInvestigator(+investigatorId)
            .subscribe(r => this.assignedClaims = r);
        }

        this.getInvestigation();
      },
      error: (err) => {
        console.error('❌ Investigation failed', err);

        this.showError = true;
        this.errorMessage =
          err?.error?.message || 'Failed to create investigation.';
      }
    });
  }
}