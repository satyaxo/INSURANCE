import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { AuthService } from './auth.service';
 
@Injectable({
  providedIn: 'root'
})
export class HttpService {
  public serverName=environment.apiUrl;
  constructor(private http: HttpClient, private authService:AuthService) {
 
   }

 
  //addd
  getInvestigations():Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`)
    return this.http.get(this.serverName+`/api/investigator/investigations`,{headers:headers});
  }
//addedd
getClaimsByUnderwriter(id:any):Observable<any> {
  const authToken = this.authService.getToken();
  let headers = new HttpHeaders();
  headers = headers.set('Content-Type', 'application/json');
  headers = headers.set('Authorization', `Bearer ${authToken}`)
  return this.http.get(this.serverName+`/api/underwriter/claims?underwriterId=`+id,{headers:headers});
}
 
//added
  getClaimsByPolicyholder(policyholder:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`)
    return this.http.get(this.serverName+`/api/policyholder/claims?policyholderId=`+policyholder,{headers:headers});
  }
  //add
  getAllClaims():Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`)
    return this.http.get(this.serverName+`/api/adjuster/claims`,{headers:headers});
  }
  GetAllUnderwriter():Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`)
    return this.http.get(this.serverName+`/api/adjuster/underwriters`,{headers:headers});
  }
  ///
  updateInvestigation(details:any,investigationId:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    return this.http.put(this.serverName+'/api/investigator/investigation/'+investigationId,details,{headers:headers});
  }
///
  createInvestigation(details:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    return this.http.post(this.serverName+'/api/investigator/investigation',details,{headers:headers});
  }
 
  //added
  createClaims(details:any, policyholderId:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    return this.http.post(this.serverName+'/api/policyholder/claim?policyholderId='+policyholderId,details,{headers:headers});
  }
  //addd
  updateClaims(details:any, claimId:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    return this.http.put(this.serverName+'/api/adjuster/claim/'+claimId,details,{headers:headers});
  }
    //addd
    updateClaimsStatus(status:any, claimId:any):Observable<any> {
      const authToken = this.authService.getToken();
      let headers = new HttpHeaders();
      headers = headers.set('Content-Type', 'application/json');
      headers = headers.set('Authorization', `Bearer ${authToken}`);
      return this.http.put(this.serverName+'/api/underwriter/claim/'+claimId+'/review?status='+status,{},{headers:headers});
    }
 // ✅ Delete claim
deleteClaim(claimId: any): Observable<any> {
  const authToken = this.authService.getToken();

  let headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${authToken}`);

  return this.http.delete(
    `${this.serverName}/api/policyholder/claim/${claimId}`,
    { headers }
  );
}
 // ✅ Get single claim by ID (Policyholder)
// getClaimById(claimId: any): Observable<any> {
//   const authToken = this.authService.getToken();

//   let headers = new HttpHeaders()
//     .set('Content-Type', 'application/json')
//     .set('Authorization', `Bearer ${authToken}`);

//   return this.http.get(
//     `${this.serverName}/api/policyholder/claim/${claimId}`,
//     { headers }
//   );
// }
  AssignClaim(details:any):Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  //   return this.http.put(this.serverName+'/api/adjuster/claim/'+details.claimId+'/assign?underwriterId='+details.underwriterId,details,{headers:headers});
  // }
  return this.http.put(
`${this.serverName}/api/adjuster/claim/${details.claimId}/assign?underwriterId=${details.underwriterId}`,
    {}, // ✅ EMPTY BODY
    { headers }
  );
}

  Login(details:any):Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    return this.http.post(this.serverName+'/api/user/login',details,{headers:headers});
  }
  registerUser(details:any):Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    return this.http.post(this.serverName+'/api/user/register',details,{headers:headers});
  }

  // ✅ Get all Investigators (for Adjuster assignment)
getAllInvestigators(): Observable<any> {
  const authToken = this.authService.getToken();
  let headers = new HttpHeaders();
  headers = headers.set('Content-Type', 'application/json');
  headers = headers.set('Authorization', `Bearer ${authToken}`);

  return this.http.get(
    this.serverName + '/api/adjuster/investigators',
    { headers }
  );
}

// ✅ Assign Claim to Investigator
assignClaimToInvestigator(claimId: number, investigatorId: number): Observable<any> {
  const authToken = this.authService.getToken();
  let headers = new HttpHeaders();
  headers = headers.set('Content-Type', 'application/json');
  headers = headers.set('Authorization', `Bearer ${authToken}`);

  return this.http.put(
    `${this.serverName}/api/adjuster/claim/${claimId}/assign-investigator?investigatorId=${investigatorId}`,
    {},
    { headers }
  );
}


getClaimsByInvestigator(investigatorId: number): Observable<any> {
  const authToken = this.authService.getToken();
  let headers = new HttpHeaders()
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${authToken}`);

  return this.http.get(
    `${this.serverName}/api/investigator/claims?investigatorId=${investigatorId}`,
    { headers }
  );
}


 // ✅ Upload documents for a claim
  uploadClaimDocuments(claimId: any, files: File[]): Observable<any> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    // ⚠️ Do NOT set Content-Type — browser sets it automatically for FormData

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    return this.http.post(
      `${this.serverName}/api/policyholder/claim/${claimId}/documents`,
      formData,
      { headers }
    );
  }

  // ✅ Get documents for a claim
  getClaimDocuments(claimId: any): Observable<any[]> {
    const authToken = this.authService.getToken();
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);

    return this.http.get<any[]>(
      `${this.serverName}/api/policyholder/claim/${claimId}/documents`,
      { headers }
    );
  }
// ✅ Used by Underwriter component (alias)
getClaimsForUnderwriter(underwriterId: number): Observable<any> {
  return this.getClaimsByUnderwriter(underwriterId);
}

// ✅ Used by Underwriter component (alias)
updateClaimStatusUnderwriter(status: string, claimId: number): Observable<any> {
  return this.updateClaimsStatus(status, claimId);
}


}