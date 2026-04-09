import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

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

/* ✅ IMPORT POLICY COMPONENTS */


import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { HttpService } from '../services/http.service';
import { BuyPolicyComponent } from './policy/buy-policy.component';
import { MyPoliciesComponent } from './policy/my-policies.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    DashbaordComponent,
    CreateClaimComponent,
    UpdateClaimComponent,
    AssignClaimComponent,
    CreateInvestigatorComponent,
    UpdateClaimInvestigatorComponent,
    UnderwriterDashboardComponent,
    LandingComponent,
    AdjusterDashboardComponent,

    /* ✅ DECLARE POLICY COMPONENTS */
    BuyPolicyComponent,
    MyPoliciesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,            // ✅ required for ngModel
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}
