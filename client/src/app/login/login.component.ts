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

    this.httpService.Login(this.itemForm.value).subscribe({
      next: (res: any) => {
        console.log("FULL RESPONSE:", res);
        console.log("ROLE:", res.role);

        this.authService.saveToken(res.token);
        this.authService.SetRole(res.role);

        this.authService.saveUserId(res.userId);
        localStorage.setItem('username', this.itemForm.value.username);

        const role = res.role?.toUpperCase();

        console.log("ROLE:", role);

        if (role && role.includes('POLICYHOLDER')) {
          console.log("Navigating to policyholder dashboard");
          this.router.navigate(['/policyholder-dashboard']);

        } else {
          console.log("Navigating to default dashboard");
          this.router.navigate(['/dashboard']);
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
