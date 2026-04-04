import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = {};
  showError: boolean = false;
  errorMessage: any = '';

  constructor(
    public router: Router,
    public httpService: HttpService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.itemForm = this.formBuilder.group({
      username: [this.formModel.username, Validators.required],
      password: [this.formModel.password, Validators.required]
    });
  }

  ngOnInit(): void {}

  onLogin(): void {
    this.showError = false;

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.httpService.Login(this.itemForm.value).subscribe({
      next: (res: any) => {

        this.authService.saveToken(res.token);
        this.authService.SetRole(res.role);
        this.authService.saveUserId(res.userId);

        // ✅ FIX: strict role-based navigation
        const role = (res.role || '').toUpperCase();

        if (role === 'UNDERWRITER') {
          this.router.navigateByUrl('/underwriter-dashboard').then(() => window.location.reload());
        } else if (role === 'INVESTIGATOR') {
          this.router.navigateByUrl('/create-investigator').then(() => window.location.reload());
        } else if (role === 'ADJUSTER') {
          this.router.navigateByUrl('/adjuster-dashboard').then(() => window.location.reload());
        } else if (role === 'POLICYHOLDER') {
          this.router.navigateByUrl('/dashboard').then(() => window.location.reload());
        } else {
          // fallback
          this.router.navigateByUrl('/landing').then(() => window.location.reload());
        }
      },
      error: () => {
        this.showError = true;
        this.errorMessage = 'Invalid username or password.';
      }
    });
  }

  registration(): void {
    this.router.navigateByUrl('/registration');
  }
}
