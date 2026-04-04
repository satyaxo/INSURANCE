import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { CreateClaimComponent } from './create-claim/create-claim.component';
import { UpdateClaimComponent } from './update-claim/update-claim.component';
import { AssignClaimComponent } from './assign-claim/assign-claim.component';
import { CreateInvestigatorComponent } from './create-investigator/create-investigator.component';
import { UpdateClaimInvestigatorComponent } from './update-claim-investigator/update-claim-investigator.component';
import { UnderwriterDashboardComponent } from './underwriter-dashboard/underwriter-dashboard.component';
import { LandingComponent } from './landing-component/landing.component';
import { AdjusterDashboardComponent } from './dashbaord/adjusterDashboard.component';

const routes: Routes = [
  // ✅ Default route
  { path: '', redirectTo: '/landing', pathMatch: 'full' },

  // ✅ Public pages
  { path: 'landing', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },

  // ✅ Dashboards
  { path: 'dashboard', component: DashbaordComponent },
  { path: 'adjuster-dashboard', component: AdjusterDashboardComponent },
  { path: 'underwriter-dashboard', component: UnderwriterDashboardComponent },

  // ✅ Policyholder
  { path: 'create-claim', component: CreateClaimComponent },

  // ✅ Adjuster workflow
  { path: 'update-claim', component: UpdateClaimComponent },
  { path: 'assign-claim', component: AssignClaimComponent },

  // ✅ Investigator workflow
  { path: 'create-investigator', component: CreateInvestigatorComponent },
  { path: 'update-claim-investigator', component: UpdateClaimInvestigatorComponent },

  // ✅ Wildcard must ALWAYS be last
  { path: '**', redirectTo: '/landing', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}