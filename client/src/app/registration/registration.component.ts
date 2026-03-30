import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';


@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
 
})
export class RegistrationComponent implements OnInit {

  itemForm: FormGroup;
  formModel: any = { role: null, email: '', password: '', username: '' };
  showMessage: boolean = false;
  responseMessage: any = '';

  constructor(
    public router: Router,
    private bookService: HttpService,
    private formBuilder: FormBuilder
  ) {
    this.itemForm = this.formBuilder.group({
      email: [this.formModel.email, [Validators.required, Validators.email]],
      password: [this.formModel.password, Validators.required],
      role: [this.formModel.role, Validators.required],
      username: [this.formModel.username, Validators.required]
    });
  }

  ngOnInit(): void {
    // No initialization logic yet
  }

  onRegister(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.bookService.registerUser(this.itemForm.value).subscribe({
      next: () => {
        this.showMessage = true;
        this.responseMessage = 'Registration successful!';
        this.itemForm.reset();
      },
      error: () => {
        this.showMessage = true;
        this.responseMessage = 'Registration failed. Please try again.';
      }
    });
  }
}
