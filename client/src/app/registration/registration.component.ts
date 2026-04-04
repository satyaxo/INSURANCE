import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {

  itemForm: FormGroup;
  showMessage = false;
  responseMessage = '';

  constructor(
    public router: Router,
    private bookService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      username: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Za-z]{5,}$/)
        ]
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
          )
        ]
        
      ],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onRegister(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.bookService.registerUser(this.itemForm.value).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Registration successful! Redirecting to Login...';
        this.itemForm.reset();
        setTimeout(() => {
          this.router.navigate(['/login'])
        }, 1000);
        


      },
      error: () => {
        this.showMessage = true;
        this.responseMessage = 'Registration failed. Please try again.';
      }
    });
  }

  // ✅ Easy access in template
  get f() {
    return this.itemForm.controls;
  }
}


// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { HttpService } from '../../services/http.service';

// @Component({
//   selector: 'app-registration',
//   templateUrl: './registration.component.html',
//   styleUrls: ['./registration.component.scss']   // ✅ IMPORTANT so your theme CSS works
// })
// export class RegistrationComponent implements OnInit {

//   itemForm!: FormGroup;

//   showMessage: boolean = false;
//   responseMessage: string = '';

//   constructor(
//     private router: Router,
//     private httpService: HttpService,
//     private fb: FormBuilder
//   ) {}

//   ngOnInit(): void {
//     // ✅ Build reactive form
//     this.itemForm = this.fb.group({
//       username: ['', Validators.required],
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', Validators.required],
//       role: ['', Validators.required]
//     });
//   }

//   onRegister(): void {
//     this.showMessage = false;
//     this.responseMessage = '';

//     if (this.itemForm.invalid) {
//       this.itemForm.markAllAsTouched();
//       return;
//     }

//     this.httpService.registerUser(this.itemForm.value).subscribe({
//       next: () => {
//         this.showMessage = true;
//         this.responseMessage = 'Registration successful!';
//         this.itemForm.reset();

//         // ✅ Optional: redirect to login after success
//         // setTimeout(() => this.router.navigate(['/login']), 800);
//         this.router.navigate(['/login']);
//       },
//       error: (err) => {
//         this.showMessage = true;

//         // ✅ If backend sends message, show it; else default
//         this.responseMessage =
//           err?.error?.message || 'Registration failed. Please try again.';
//       }
//     });
//   }

//   // ✅ Only needed if you change footer link from routerLink to click
//   goToLogin(): void {
//     this.router.navigate(['/login']);
//   }
// }