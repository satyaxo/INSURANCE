import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  IsLoggin:any=false;
  roleName: string | null;
  constructor(private authService: AuthService, private router:Router)
  {
   
    this.IsLoggin=authService.getLoginStatus;
    this.roleName=authService.getRole;
    if(this.IsLoggin==false)
    {
      // this.router.navigateByUrl('/login'); 
      this.router.navigateByUrl('/landing')

    
    }
  }
  logout()
{
  this.authService.logout();
  window.location.reload();
}



goToHome() {
  const role = localStorage.getItem('role');

  if (role === 'UNDERWRITER') {
    this.router.navigate(['/underwriter-dashboard']);
  } else if (role === 'INVESTIGATOR') {
    this.router.navigate(['/create-investigator']);
  } else {
    this.router.navigate(['/dashboard']);
  }
}


}
