import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppBarComponent } from './app-bar/app-bar.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { LoginDialogComponent } from './home/login-dialog/login-dialog.component';
import { SigninDialogComponent } from './register/signin-dialog/signin-dialog.component';
import { CompeteComponent } from './compete/compete.component';
import { CompetitionComponent } from './competition/competition.component';
import { HttpClientModule } from '@angular/common/http';
import { CreateDialogComponent } from './compete/create-dialog/create-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    AppBarComponent,
    RegisterComponent,
    HomeComponent,
    LoginDialogComponent,
    SigninDialogComponent,
    CompeteComponent,
    CompetitionComponent,
    CreateDialogComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
