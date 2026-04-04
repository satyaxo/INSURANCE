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

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { HttpService } from '../services/http.service';

// ✅ ADD THIS IMPORT
import { AdjusterDashboardComponent } from './dashbaord/adjusterDashboard.component';

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

    // ✅ ADD THIS
    AdjusterDashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  // ✅ FIX THIS (remove HttpClientModule from providers)
  providers: [HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}
