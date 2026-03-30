import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-create-investigator',
  templateUrl: './create-investigator.component.html',
  styleUrls: ['./create-investigator.component.scss']
})

export class CreateInvestigatorComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { report: '', status: '' };
  showError: boolean = false;
  errorMessage: any = '';
  assignModel: any = {};
  showMessage: any = false;
  responseMessage: any = '';
  investigationList: any[] = [];
  updateId: any = null;

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      report: [this.formModel.report, Validators.required],
      status: [this.formModel.status, Validators.required]
    });
  }

  ngOnInit(): void {
    this.getInvestigation();
  }

  getInvestigation(): void {
    this.httpService.getInvestigations().subscribe({
      next: (res: any[]) => {
        this.investigationList = res;
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Error fetching investigations.';
      }
    });
  }

  edit(val: any): void {
    this.updateId = val.id;
    this.itemForm.patchValue({
      report: val.report,
      status: val.status
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

    if (this.updateId == null) {
      this.httpService.createInvestigation(this.itemForm.value).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation created successfully!';
          this.itemForm.reset();
          this.getInvestigation();
        },
        error: () => {
          this.showError = true;
          this.errorMessage = 'Error creating investigation.';
        }
      });
    } else {
      this.httpService.updateInvestigation(this.updateId, this.itemForm.value).subscribe({
        next: () => {
          this.showMessage = true;
          this.responseMessage = 'Investigation updated successfully!';
          this.itemForm.reset();
          this.updateId = null;
          this.getInvestigation();
        },
        error: () => {
          this.showError = true;
          this.errorMessage = 'Error updating investigation.';
        }
      });
    }
  }
}

