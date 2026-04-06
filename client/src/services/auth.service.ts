import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token: string | null = null;
  private isLoggedIn: boolean = false;

  constructor() {}

  // ✅ Save token received from login
  saveToken(token: string) {
    this.token = token;
    this.isLoggedIn = true;
    localStorage.setItem('token', token);
  }

  // ✅ Save role
  SetRole(role: any) {
    localStorage.setItem('role', role);
  }

  // ✅ Get role
  get getRole(): string | null {
    return localStorage.getItem('role');
  }

  // ✅ Login status (based on token presence)
  get getLoginStatus(): boolean {
    return !!localStorage.getItem('token');
  }

  // ✅ Get token
  getToken(): string | null {
    this.token = localStorage.getItem('token');
    return this.token;
  }

  // ✅ Save userId
  saveUserId(userid: string) {
    localStorage.setItem('userId', userid);
  }

  // ✅ Get userId (optional but clean)
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // ✅ Logout: clear everything (token, role, userId)
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');   // ✅ IMPORTANT FIX

    this.token = null;
    this.isLoggedIn = false;
  }
}