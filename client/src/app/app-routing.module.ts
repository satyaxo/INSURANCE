import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';

import { AppComponent } from './app.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';


import { CreateClaimComponent } from './create-claim/create-claim.component';

import { UpdateClaimComponent } from './update-claim/update-claim.component';
import { AssignClaimComponent } from './assign-claim/assign-claim.component';
import { CreateInvestigatorComponent } from './create-investigator/create-investigator.component';
import { UpdateClaimInvestigatorComponent } from './update-claim-investigator/update-claim-investigator.component';
import { PolicyholderDashboardComponent } from './policyholder-dashboard/policyholder-dashboard.component';
import { ViewClaimComponent } from './view-claim/view-claim.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'dashboard', component: DashbaordComponent },
  { path: 'create-claim', component: CreateClaimComponent },
  { path: 'update-claim', component: UpdateClaimComponent },
  { path: 'assign-claim', component: AssignClaimComponent },
  { path: 'create-investigator', component: CreateInvestigatorComponent },
  { path: 'update-claim-investigator', component: UpdateClaimInvestigatorComponent },
  { path: 'policyholder-dashboard', component: PolicyholderDashboardComponent},
{ path: 'view-claim/:id', component: ViewClaimComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  { path: '**', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
