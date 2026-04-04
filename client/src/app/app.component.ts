import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  IsLoggin: any = false;
  roleName: string | null;

  constructor(private authService: AuthService, private router: Router) {

    // ✅ load session state
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;

    // ✅ if not logged in, always go landing
    if (!this.IsLoggin) {
      this.router.navigateByUrl('/landing');
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.reload();
  }

  // ✅ FIXED: role-based home navigation
  goToHome(): void {
    const role = (localStorage.getItem('role') || '').toUpperCase();

    if (role === 'UNDERWRITER') {
      this.router.navigateByUrl('/underwriter-dashboard');
    } else if (role === 'INVESTIGATOR') {
      this.router.navigateByUrl('/create-investigator');
    } else if (role === 'ADJUSTER') {
      this.router.navigateByUrl('/adjuster-dashboard');
    } else if (role === 'POLICYHOLDER') {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.router.navigateByUrl('/landing');
    }
  }
}