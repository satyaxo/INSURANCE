import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']   // ✅ IMPORTANT: enables your card + background CSS
})
export class RegistrationComponent implements OnInit, OnDestroy {

  itemForm: FormGroup;

  // UI messages
  showMessage = false;
  responseMessage = '';
  showError = false;
  errorMessage = '';

  // OTP UI state
  otpSent = false;
  otpVerified = false;
  otpSending = false;
  otpVerifying = false;
  otpResendCooldown = 0; // seconds
  private timer: any = null;

  constructor(
    public router: Router,
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],

      // ✅ Username: min 3, alphabets only (spaces allowed)
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[A-Za-z ]+$/)
      ]],

      // ✅ Password: min 8, 1 uppercase, 1 lowercase, 1 digit, 1 special
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(64),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_+\-])[A-Za-z\d@$!%*?&.#_+\-]{8,64}$/)
      ]],

      role: ['', Validators.required],

      // ✅ OTP field (only required after OTP sent)
      otp: ['']
    });
  }

  ngOnInit(): void {
    // When email changes, reset OTP state (email must be verified again)
    this.itemForm.get('email')?.valueChanges.subscribe(() => {
      this.resetOtpState();
    });
  }

  ngOnDestroy(): void {
    // ✅ prevent memory leak
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // -------------------------------
  // OTP Actions
  // -------------------------------

  sendOtp(): void {
    this.clearAlerts();

    const emailCtrl = this.itemForm.get('email');
    if (!emailCtrl || emailCtrl.invalid) {
      this.showError = true;
      this.errorMessage = 'Please enter a valid email first.';
      emailCtrl?.markAsTouched();
      return;
    }

    if (this.otpResendCooldown > 0) {
      this.showError = true;
      this.errorMessage = `Please wait ${this.otpResendCooldown} seconds before resending OTP.`;
      return;
    }

    this.otpSending = true;
    const email = String(emailCtrl.value).trim();

    this.httpService.sendOtp(email).subscribe({
      next: (res: any) => {
        this.otpSending = false;
        this.otpSent = true;
        this.otpVerified = false;

        // Make OTP required now
        this.itemForm.get('otp')?.setValidators([
          Validators.required,
          Validators.pattern(/^\d{6}$/)
        ]);
        this.itemForm.get('otp')?.updateValueAndValidity();

        this.showMessage = true;
        this.responseMessage = res?.message || 'OTP sent to email successfully.';

        // start cooldown 30s (matches backend)
        this.startCooldown(30);
      },
      error: (err) => {
        this.otpSending = false;
        this.showError = true;
        this.errorMessage = err?.error?.message || `Failed to send OTP. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  verifyOtp(): void {
    this.clearAlerts();

    const email = String(this.itemForm.get('email')?.value || '').trim();
    const otp = String(this.itemForm.get('otp')?.value || '').trim();

    if (!email) {
      this.showError = true;
      this.errorMessage = 'Email is required.';
      return;
    }

    if (!otp.match(/^\d{6}$/)) {
      this.showError = true;
      this.errorMessage = 'OTP must be exactly 6 digits.';
      this.itemForm.get('otp')?.markAsTouched();
      return;
    }

    this.otpVerifying = true;

    this.httpService.verifyOtp(email, otp).subscribe({
      next: (res: any) => {
        this.otpVerifying = false;
        this.otpVerified = true;

        this.showMessage = true;
        this.responseMessage = res?.message || 'Email verified successfully!';
      },
      error: (err) => {
        this.otpVerifying = false;
        this.otpVerified = false;

        this.showError = true;
        this.errorMessage = err?.error?.message || `OTP verification failed. (${err?.status || 'NO_STATUS'})`;
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.otpResendCooldown = seconds;

    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.otpResendCooldown--;
      if (this.otpResendCooldown <= 0) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, 1000);
  }

  private resetOtpState(): void {
    this.otpSent = false;
    this.otpVerified = false;
    this.otpResendCooldown = 0;

    // Remove OTP validators until OTP is sent
    this.itemForm.get('otp')?.clearValidators();
    this.itemForm.get('otp')?.setValue('');
    this.itemForm.get('otp')?.updateValueAndValidity();

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // -------------------------------
  // Registration
  // -------------------------------
  onRegister(): void {
    this.clearAlerts();

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please fix the validation errors.';
      this.itemForm.markAllAsTouched();
      return;
    }

    // ✅ Enforce OTP verified before allowing register
    if (!this.otpVerified) {
      this.showError = true;
      this.errorMessage = 'Please verify your email using OTP before registering.';
      return;
    }

    const payload = {
      email: this.itemForm.value.email,
      username: this.itemForm.value.username,
      password: this.itemForm.value.password,
      role: this.itemForm.value.role
    };

    this.httpService.registerUser(payload).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Registration successful! Please login.';
        this.itemForm.reset();
        this.resetOtpState();
      },
      error: (err) => {
        this.showError = true;
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  // Helpers
  get f(): { [key: string]: AbstractControl } {
    return this.itemForm.controls;
  }

  private clearAlerts(): void {
    this.showMessage = false;
    this.responseMessage = '';
    this.showError = false;
    this.errorMessage = '';
  }
}