import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-policyholder-dashboard',
  templateUrl: './policyholder-dashboard.component.html',
  styleUrls: ['./policyholder-dashboard.component.scss']
})
export class PolicyholderDashboardComponent implements OnInit {

  claims: any[] = [];
  username: any;
  constructor(private httpService: HttpService, private router: Router) { }

  ngOnInit(): void {
    this.username = localStorage.getItem("username")

    this.loadClaims();
  }
// loadClaims(){
//   this.httpService.getAllClaims().subscribe((res:any)=>{
//     this.claims =res;
//   });

loadClaims() {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    console.error('User ID not found');
    return;
  }

  this.httpService.getClaimsByPolicyholder(userId).subscribe({
    next: (res:any) => this.claims = res,
    error: err => console.error('Claim load error', err)
  });
}


createClaim(){
  this.router.navigate(['/create-claim']);
}
deleteClaim(claimId: any) {
  if (confirm("Are you sure you want to delete this claim?")) {
    this.httpService.deleteClaim(claimId).subscribe({
      next: () => {
        alert("Claim deleted successfully");
        this.loadClaims(); // 🔁 refresh list
      },
      error: (err) => {
        console.error("Delete failed", err);
      }
    });
  }
}
viewClaim(claimId:any){
  this.router.navigate(['/view-claim',claimId]);
}
logout(){
  localStorage.clear();
  this.router.navigate(['/login']);
}
goBack() {
  window.history.back();
}
}