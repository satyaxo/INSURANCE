import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../../services/http.service';


@Component({
  selector: 'app-view-claim',
  templateUrl: './view-claim.component.html',
  styleUrls: ['./view-claim.component.scss']
})
export class ViewClaimComponent implements OnInit {

  claimId: any;
  claim: any;
documents: any[] = [];  
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ✅ Get ID from URL
    this.claimId = this.route.snapshot.paramMap.get('id');
    console.log("Claim ID:", this.claimId);

    // ✅ Call API
    this.loadClaim();
    this.loadDocuments();
  }

 loadClaim() {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    console.error('User not found');
    return;
  }

  this.httpService.getClaimsByPolicyholder(userId).subscribe({
    next: (res: any[]) => {
      console.log("ALL CLAIMS:", res);

      this.claim = res.find(c => c.id == this.claimId);

      console.log("SELECTED CLAIM:", this.claim);
    },
    error: (err) => {
      console.error("Error loading claim", err);
    }
  });
}
loadDocuments(): void {
  this.httpService.getClaimDocuments(this.claimId).subscribe({
    next: (docs) => {
      this.documents = docs;
    },
    error: (err) => {
      console.error('Failed to load documents', err);
    }
  });
}
goBack() {
  this.router.navigate(['/policyholder-dashboard']);
}
}