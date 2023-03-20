import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppBarComponent } from './components/app-bar/app-bar.component';
import { RegisterComponent } from './views/register/register.component';
import { HomeComponent } from './views/home/home.component';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { SigninDialogComponent } from './components/signin-dialog/signin-dialog.component';
import { CompeteComponent } from './views/compete/compete.component';
import { CompetitionComponent } from './views/competition/competition.component';
import { HttpClientModule } from '@angular/common/http';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { EditorComponent } from './views/editor/editor.component';
import { EditorMenuComponent } from './views/editor-menu/editor-menu.component';
import { CompetitionsListComponent } from './components/competitions-list/competitions-list.component';
import { DatePipe } from '@angular/common';
import { QuestionsListComponent } from './components/questions-list/questions-list.component';
import { DropDownListComponent } from './components/drop-down-list/drop-down-list.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { UserInfoPipe } from './pipes/userInfoPipe';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { KatexModule } from 'ng-katex';
import { PopupComponent } from './components/popup/popup.component';
import { AboutComponent } from './views/about/about.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { BottomAppBarComponent } from './components/bottom-app-bar/bottom-app-bar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { InfoCardComponent } from './components/info-card/info-card.component' 

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
    NotFoundComponent,
    UserInfoPipe,
    ScoreboardComponent,
    PopupComponent,
    AboutComponent,
    TextInputComponent,
    BottomAppBarComponent,
    LoadingComponent,
    InfoCardComponent    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    KatexModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
