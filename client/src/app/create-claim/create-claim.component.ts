import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-create-claim',
  templateUrl: './create-claim.component.html',
  styleUrls: ['./create-claim.component.scss']
})
export class CreateClaimComponent implements OnInit {

  itemForm: FormGroup;

  showError = false;
  errorMessage = '';

  showMessage = false;
  responseMessage = '';

  // ✅ Upload (multiple optional)
  selectedFiles: File[] = [];
  uploadInfo = '';
  isSubmitting = false;

  // ✅ for UI display
  deadlineDays: number | null = null;
  deadlineDateText: string = '';

  // ✅ Insurance types list for dropdown
  insuranceTypes = [
    { value: 'BIKE', label: 'Bike Insurance' },
    { value: 'CAR', label: 'Car Insurance' },
    { value: 'HEALTH', label: 'Health Insurance' },
    { value: 'LIFE', label: 'Life Insurance' },
    { value: 'TERM', label: 'Term Insurance' },
    { value: 'TRAVEL', label: 'Travel Insurance' },
    { value: 'HOME', label: 'Home Insurance' }
  ];

  constructor(
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      insuranceType: ['', Validators.required],

      // ✅ Read-only auto policy number
      policyNumber: ['', [Validators.required, Validators.pattern(/^#\d+$/)]],

      // ✅ accident date
      date: ['', Validators.required],

      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // ✅ Generate policy number on load
    this.setAutoPolicyNumber();

    // ✅ Recalculate deadline when insurance type changes
    this.itemForm.get('insuranceType')?.valueChanges.subscribe(() => {
      this.updateDeadlineInfo();
      this.validateAccidentDate();
    });

    // ✅ Validate when date changes
    this.itemForm.get('date')?.valueChanges.subscribe(() => {
      this.validateAccidentDate();
    });
  }

  // ---------------------------
  // Policy Number helpers
  // ---------------------------
  private generatePolicyNumber(): string {
    const num = Math.floor(10000000 + Math.random() * 90000000);
    return `#${num}`;
  }

  private setAutoPolicyNumber(): void {
    this.itemForm.patchValue({ policyNumber: this.generatePolicyNumber() });
  }

  // If user tries to type, keep only # + digits
  onPolicyNumberInput(): void {
    const ctrl = this.itemForm.get('policyNumber');
    if (!ctrl) return;

    let v = (ctrl.value || '').toString();
    if (!v.startsWith('#')) v = '#' + v;
    v = '#' + v.substring(1).replace(/\D/g, '');

    ctrl.setValue(v, { emitEvent: false });
  }

  // ---------------------------
  // Deadline logic (7/30)
  // ---------------------------
  private getDeadlineDaysByType(type: string): number {
    const t = (type || '').toUpperCase();
    if (t === 'CAR' || t === 'BIKE' || t === 'TRAVEL') return 7;
    return 30;
  }

  private updateDeadlineInfo(): void {
    const type = this.itemForm.get('insuranceType')?.value;
    if (!type) {
      this.deadlineDays = null;
      this.deadlineDateText = '';
      return;
    }

    this.deadlineDays = this.getDeadlineDaysByType(type);

    const dateStr = this.itemForm.get('date')?.value;
    if (!dateStr) {
      this.deadlineDateText = '';
      return;
    }

    const accident = new Date(dateStr);
    const deadline = new Date(accident);
    deadline.setDate(deadline.getDate() + (this.deadlineDays || 0));
    this.deadlineDateText = deadline.toISOString().slice(0, 10);
  }

  validateAccidentDate(): void {
    const dateCtrl = this.itemForm.get('date');
    const typeCtrl = this.itemForm.get('insuranceType');

    if (!dateCtrl || !typeCtrl) return;

    const dateValue = dateCtrl.value;
    const typeValue = typeCtrl.value;

    if (!dateValue || !typeValue) {
      this.updateDeadlineInfo();
      return;
    }

    const accidentDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (accidentDate.getTime() > today.getTime()) {
      dateCtrl.setErrors({ future: true });
      this.updateDeadlineInfo();
      return;
    }

    const deadlineDays = this.getDeadlineDaysByType(typeValue);

    const diffMillis = today.getTime() - accidentDate.getTime();
    const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

    if (diffDays > deadlineDays) {
      dateCtrl.setErrors({ deadline: true });
    } else {
      if (dateCtrl.errors) {
        const { deadline, future, ...rest } = dateCtrl.errors;
        dateCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }
    }

    this.updateDeadlineInfo();
  }

  // ---------------------------
  // Multiple file upload (optional)
  // ---------------------------
  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    this.selectedFiles = [];

    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files[i]);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  // ---------------------------
  // Submit claim + upload documents (optional)
  // ---------------------------
  onSubmit(): void {
    this.showError = false;
    this.showMessage = false;
    this.errorMessage = '';
    this.responseMessage = '';
    this.uploadInfo = '';

    this.validateAccidentDate();

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fill in all required fields correctly.';
      this.itemForm.markAllAsTouched();
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in.';
      return;
    }

    const payload = {
      insuranceType: this.itemForm.value.insuranceType,
      policyNumber: this.itemForm.value.policyNumber,
      date: this.itemForm.value.date,
      description: this.itemForm.value.description
    };

    this.isSubmitting = true;

    // ✅ Step 1: Create claim
    this.httpService.createClaims(payload, userId).subscribe({
      next: (createdClaim: any) => {
        const claimId = createdClaim?.id;

        // ✅ If no files selected, finish
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
          this.isSubmitting = false;
          this.showMessage = true;
          this.responseMessage = '✅ Claim created successfully!';
          this.itemForm.reset();
          this.setAutoPolicyNumber();
          this.deadlineDays = null;
          this.deadlineDateText = '';
          return;
        }

        // ✅ Need claimId from backend response
        if (!claimId) {
          this.isSubmitting = false;
          this.showError = true;
          this.errorMessage = 'Claim created, but claimId not returned from server.';
          return;
        }

        // ✅ Step 2: Upload multiple files in parallel
        this.uploadInfo = `Uploading ${this.selectedFiles.length} file(s)...`;

        const uploadCalls = this.selectedFiles.map(f =>
          this.httpService.uploadClaimDocument(claimId, f)
        );

        forkJoin(uploadCalls).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.showMessage = true;
            this.responseMessage = `✅ Claim created and ${this.selectedFiles.length} document(s) uploaded successfully!`;

            this.itemForm.reset();
            this.selectedFiles = [];
            this.uploadInfo = '';
            this.setAutoPolicyNumber();
            this.deadlineDays = null;
            this.deadlineDateText = '';
          },
          error: (err) => {
            console.error('Upload failed:', err);
            this.isSubmitting = false;
            this.showError = true;
            this.errorMessage =
              err?.error?.message ||
              `Claim created, but file upload failed. (${err?.status || 'NO_STATUS'})`;
          }
        });
      },
      error: (err) => {
        console.error('Create claim error:', err);
        this.isSubmitting = false;
        this.showError = true;
        const msg = err?.error?.message || err?.message || 'Error creating claim.';
        this.errorMessage = `${msg} (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  // helpers for template
  get policyNumberCtrl(): AbstractControl | null {
    return this.itemForm.get('policyNumber');
  }
  get dateCtrl(): AbstractControl | null {
    return this.itemForm.get('date');
  }
}