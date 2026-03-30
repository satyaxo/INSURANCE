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

  ngOnInit(): void {
    // No initialization logic yet
  }

  onLogin(): void {
    this.showError = false;

    if (this.itemForm.invalid) {
      this.showError = true;
      this.errorMessage = 'Please enter both username and password.';
      return;
    }
//changes made here L
    this.httpService.Login(this.itemForm.value).subscribe({
      next: (res: any) => {
        // Use AuthService methods
        this.authService.saveToken(res.token);
        this.authService.SetRole(res.role);
        this.authService.saveUserId(res.userId);

        // Navigate to dashboard and refresh
        this.router.navigateByUrl('/dashboard').then(() => {
          window.location.reload();
        });
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
