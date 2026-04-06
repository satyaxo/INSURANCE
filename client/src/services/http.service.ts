import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  public serverName = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ✅ Common helper: creates auth headers
  private getAuthHeaders(): HttpHeaders {
    const authToken = this.authService.getToken();
    return new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${authToken}`);
  }

  // ================= Investigator =================
  getInvestigations(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/investigator/investigations`, { headers });
  }

  // ================= Underwriter =================
  getClaimsByUnderwriter(id: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/underwriter/claims?underwriterId=` + id, { headers });
  }

  /**
   * ✅ Frontend-only "All claims for underwriter dashboard"
   * This uses the existing endpoint (no backend changes):
   * GET /api/underwriter/claims?underwriterId=...
   */
  getAllClaimsForUnderwriter(underwriterId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(
      `${this.serverName}/api/underwriter/claims?underwriterId=${underwriterId}`,
      { headers }
    );
  }

  // ================= Policyholder =================
  getClaimsByPolicyholder(policyholder: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/policyholder/claims?policyholderId=` + policyholder, { headers });
  }

  createClaims(details: any, policyholderId: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      this.serverName + `/api/policyholder/claim?policyholderId=` + policyholderId,
      details,
      { headers }
    );
  }

  // ================= Adjuster =================

  // ✅ Update page should use this
  getAllClaims(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/adjuster/claims`, { headers });
  }

  // ✅ Assign page dropdown should use this
  getAssignableClaims(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/adjuster/claims/assignable`, { headers });
  }

  GetAllUnderwriter(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/adjuster/underwriters`, { headers });
  }

  getAllInvestigators(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.serverName + `/api/adjuster/investigators`, { headers });
  }

  updateClaims(details: any, claimId: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(this.serverName + `/api/adjuster/claim/` + claimId, details, { headers });
  }

  AssignClaim(details: any): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put(
      `${this.serverName}/api/adjuster/claim/${details.claimId}/assign?underwriterId=${details.underwriterId}`,
      {},
      { headers }
    );
  }

  assignClaimToInvestigator(claimId: number, investigatorId: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put(
      `${this.serverName}/api/adjuster/claim/${claimId}/assign-investigator?investigatorId=${investigatorId}`,
      {},
      { headers }
    );
  }

  /**
   * ✅ FIXED: Approve/Reject now return Observable (no more throw error)
   * These use your existing endpoint:
   * PUT /api/adjuster/claim/{claimId}
   *
   * If your backend expects a different field name than "status"
   * (example "claimStatus"), just change it here.
   */
  approveClaim(claimId: number): Observable<any> {
    return this.updateClaims({ status: 'APPROVED' }, claimId);
  }

  rejectClaim(claimId: number): Observable<any> {
    return this.updateClaims({ status: 'REJECTED' }, claimId);
  }

  // ================= Investigator ops =================
  updateInvestigation(details: any, investigationId: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(this.serverName + `/api/investigator/investigation/` + investigationId, details, { headers });
  }

  createInvestigation(details: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.serverName + `/api/investigator/investigation`, details, { headers });
  }

  getClaimsByInvestigator(investigatorId: number): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.get(
      `${this.serverName}/api/investigator/claims?investigatorId=${investigatorId}`,
      { headers }
    );
  }

  // ================= Underwriter review =================
  updateClaimsStatus(status: any, claimId: any): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.put(
      `${this.serverName}/api/underwriter/claim/${claimId}/review?status=${status}`,
      {},
      { headers }
    );
  }

  updateClaimStatus(id: number, status: string): Observable<any> {
    return this.updateClaimsStatus(status, id);
  }

  getClaimsForUnderwriter(underwriterId: number): Observable<any> {
    return this.getClaimsByUnderwriter(underwriterId);
  }

  updateClaimStatusUnderwriter(status: string, claimId: number): Observable<any> {
    return this.updateClaimsStatus(status, claimId);
  }

  // ================= Auth =================
  Login(details: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(this.serverName + `/api/user/login`, details, { headers });
  }

  registerUser(details: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(this.serverName + `/api/user/register`, details, { headers });
  }

  // ================= Policyholder tracking =================
  getPolicyholderClaimsTracking(policyholderId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(
      `${this.serverName}/api/policyholder/claims/tracking?policyholderId=${policyholderId}`,
      { headers }
    );
  }

  // ================= Documents =================

  // ✅ Upload ONE document for a claim (multipart)
  uploadClaimDocument(claimId: number, file: File): Observable<any> {
    const authToken = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${authToken}`);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(
      `${this.serverName}/api/policyholder/claim/${claimId}/documents`,
      formData,
      { headers }
    );
  }

  // ✅ List documents for a claim
  getClaimDocuments(claimId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(
      `${this.serverName}/api/claim/${claimId}/documents`,
      { headers }
    );
  }

  // ✅ Download document (Blob)
  downloadClaimDocument(docId: number): Observable<Blob> {
    const authToken = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${authToken}`);

    return this.http.get(
      `${this.serverName}/api/documents/${docId}/download`,
      { headers, responseType: 'blob' }
    );
  }
}
``