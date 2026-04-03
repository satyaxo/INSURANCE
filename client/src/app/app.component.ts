import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  IsLoggin = false;
  roleName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.IsLoggin = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);   // ✅ go back to Landing
  }
}


// import { Component } from '@angular/core';
// import { AuthService } from '../services/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss']
// })
// export class AppComponent {
//   IsLoggin:any=false;
//   roleName: string | null;
//   constructor(private authService: AuthService, private router:Router)
//   {
   
//     this.IsLoggin=authService.getLoginStatus;
//     this.roleName=authService.getRole;
//     if(this.IsLoggin==false)
//     {
//       this.router.navigateByUrl('/login'); 
    
//     }
//   }
//   logout()
// {
//   this.authService.logout();
//   window.location.reload();
// }

// }
