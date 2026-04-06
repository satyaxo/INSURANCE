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
import { AdjusterDashboardComponent } from './dashbaord/adjusterDashboard.component';

// ✅ NEW: Add your animated Auth page component


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

    // ✅ NEW: Declare AuthComponent so Angular recognizes [formGroup]

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule
  ],
  providers: [HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}