import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  IsLoggin: boolean = false;
  roleName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // ✅ Load session state on startup
    this.syncAuthState();

    // ✅ Update navbar state whenever route changes (login/logout/navigation)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.syncAuthState());
  }

  private syncAuthState(): void {
    // ✅ Your AuthService exposes getters
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;
  }

  logout(): void {
    this.authService.logout();

    // ✅ Immediately update navbar
    this.IsLoggin = false;
    this.roleName = null;

    // ✅ Reverted: go back to normal login page
    this.router.navigateByUrl('/login');
  }

  // ✅ Role-based home navigation
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
      // ✅ Not logged in
      this.router.navigateByUrl('/landing');
    }
  }
}