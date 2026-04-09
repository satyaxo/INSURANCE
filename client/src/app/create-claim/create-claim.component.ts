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

  // ✅ Active policy details (for UI/debug)
  activePolicyNumber: string = '';
  activeInsuranceType: string = '';

  // ✅ Insurance types list for dropdown (kept for UI display)
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
      // ✅ We'll auto-fill & lock these from active policy
      insuranceType: [{ value: '', disabled: false }, Validators.required],

      // ✅ Policy number must match your PolicyService generator: POL-YYYYMMDD-XXXXXX
      // Example: POL-20260408-834921
      policyNumber: [{ value: '', disabled: false }, [Validators.required, Validators.pattern(/^POL-\d{8}-\d{6}$/)]],

      // ✅ accident date
      date: ['', Validators.required],

      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // ✅ Load active policy and lock fields (this fixes mismatch)
    this.loadActivePolicyAndLockFields();

    // ✅ Recalculate deadline when insurance type changes
    // (insuranceType will be auto-set; still okay to keep this logic)
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
  // ✅ Load Active Policy from backend and lock fields
  // ---------------------------
  private loadActivePolicyAndLockFields(): void {
    const userId = Number(localStorage.getItem('userId'));

    if (!userId) {
      this.showError = true;
      this.errorMessage = 'User not logged in.';
      return;
    }

    this.httpService.getActivePolicy(userId).subscribe({
      next: (policy: any) => {
        const pn = (policy?.policyNumber || '').toString().trim();
        const it = (policy?.insuranceType || '').toString().trim().toUpperCase();

        if (!pn || !it) {
          this.showError = true;
          this.errorMessage = 'Active policy data is incomplete. Please buy policy again.';
          return;
        }

        this.activePolicyNumber = pn;
        this.activeInsuranceType = it;

        // ✅ Auto-fill from active policy
        this.itemForm.patchValue({
          policyNumber: pn,
          insuranceType: it
        });

        // ✅ Lock them so user cannot mismatch
        this.itemForm.get('policyNumber')?.disable({ emitEvent: false });
        this.itemForm.get('insuranceType')?.disable({ emitEvent: false });

        // ✅ Update deadline display if date exists
        this.updateDeadlineInfo();
      },
      error: () => {
        // No active policy => policyholder must buy policy first
        this.showError = true;
        this.errorMessage = 'No active policy found. Please buy a policy first.';
      }
    });
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
    // insuranceType is disabled; getRawValue needed sometimes
    const raw = this.itemForm.getRawValue();
    const type = raw.insuranceType;

    if (!type) {
      this.deadlineDays = null;
      this.deadlineDateText = '';
      return;
    }

    this.deadlineDays = this.getDeadlineDaysByType(type);

    const dateStr = raw.date;
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
    if (!dateCtrl) return;

    const raw = this.itemForm.getRawValue();
    const dateValue = raw.date;
    const typeValue = raw.insuranceType;

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
        const { deadline, future, ...rest } = dateCtrl.errors as any;
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

    // ✅ IMPORTANT: insuranceType & policyNumber are disabled, so use getRawValue()
    const raw = this.itemForm.getRawValue();

    const payload = {
      insuranceType: raw.insuranceType,
      policyNumber: raw.policyNumber,
      date: raw.date,
      description: raw.description
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

          // Reset only editable fields
          this.itemForm.patchValue({ date: '', description: '' });
          this.selectedFiles = [];
          this.uploadInfo = '';
          this.deadlineDays = null;
          this.deadlineDateText = '';

          // Reload active policy values (keeps locked values consistent)
          this.loadActivePolicyAndLockFields();
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

            // Reset only editable fields
            this.itemForm.patchValue({ date: '', description: '' });
            this.selectedFiles = [];
            this.uploadInfo = '';
            this.deadlineDays = null;
            this.deadlineDateText = '';

            // Reload active policy values (keeps locked values consistent)
            this.loadActivePolicyAndLockFields();
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