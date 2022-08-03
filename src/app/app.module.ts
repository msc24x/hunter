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
import { EditorComponent } from './editor/editor.component';
import { EditorMenuComponent } from './editor-menu/editor-menu.component';
import { CompetitionsListComponent } from './compete/competitions-list/competitions-list.component';
import { DatePipe } from '@angular/common';
import { QuestionsListComponent } from './editor/questions-list/questions-list.component';
import { DropDownListComponent } from './competition/drop-down-list/drop-down-list.component';
import { NotFoundComponent } from './not-found/not-found.component';

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
    CreateDialogComponent,
    EditorComponent,
    EditorMenuComponent,
    CompetitionsListComponent,
    QuestionsListComponent,
    DropDownListComponent,
    NotFoundComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
