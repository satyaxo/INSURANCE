import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from '../../services/http.service';


@Injectable({
  providedIn: 'root'
})
export class PolicyGuard implements CanActivate {

  constructor(
    private http: HttpService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {

    const role = (localStorage.getItem('role') || '').toUpperCase();
    const userId = Number(localStorage.getItem('userId'));

    // ✅ If not policyholder → allow access
    if (role !== 'POLICYHOLDER') {
      return of(true);
    }

    // ✅ If policyholder but not logged in properly → go login
    if (!userId) {
      return of(this.router.createUrlTree(['/login']));
    }

    // ✅ Check if active policy exists
    return this.http.getActivePolicy(userId).pipe(
      map(() => {
        // active policy found
        return true;
      }),
      catchError(() => {
        // no active policy → redirect to buy-policy
        return of(this.router.createUrlTree(['/buy-policy']));
      })
    );
  }
}