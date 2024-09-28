import { NgModule } from '@angular/core';
import { CommonModule as AngularCommonModule, DatePipe } from '@angular/common';
import { AppBarComponent } from './components/app-bar/app-bar.component';
import { BottomAppBarComponent } from './components/bottom-app-bar/bottom-app-bar.component';
import { CompetitionsListComponent } from './components/competitions-list/competitions-list.component';
import { InfoCardComponent } from './components/info-card/info-card.component';
import { LoadingComponent } from './components/loading/loading.component';
import { LoginDialogComponent } from './components/login-dialog/login-dialog.component';
import { PopupComponent } from './components/popup/popup.component';
import { SigninDialogComponent } from './components/signin-dialog/signin-dialog.component';
import { TextInputComponent } from './components/text-input/text-input.component';
import { AboutComponent } from './pages/about/about.component';
import { CompeteComponent } from './pages/compete/compete.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { IsLiveStatusPipe, UserInfoPipe } from './pipes/userInfoPipe';
import { RouterModule } from '@angular/router';
import { CommonRoutingModule } from './common-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InfotipComponent } from './components/infotip/infotip.component';
import { DropDownListComponent } from './components/drop-down-list/drop-down-list.component';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { PrettyMetaComponent } from './components/pretty-meta/pretty-meta.component';
import { GreenredComponent } from './greenred/greenred.component';

@NgModule({
    declarations: [
        AppBarComponent,
        BottomAppBarComponent,
        CompetitionsListComponent,
        InfoCardComponent,
        LoadingComponent,
        LoginDialogComponent,
        PopupComponent,
        SigninDialogComponent,
        TextInputComponent,
        AboutComponent,
        CompeteComponent,
        HomeComponent,
        RegisterComponent,
        UserInfoPipe,
        IsLiveStatusPipe,
        InfotipComponent,
        DropDownListComponent,
        CodeEditorComponent,
        PrettyMetaComponent,
        GreenredComponent,
    ],
    imports: [
        AngularCommonModule,
        RouterModule,
        CommonRoutingModule,
        FontAwesomeModule,
        MatTooltipModule,
    ],
    exports: [
        AppBarComponent,
        BottomAppBarComponent,
        CompetitionsListComponent,
        InfoCardComponent,
        LoadingComponent,
        LoginDialogComponent,
        PopupComponent,
        SigninDialogComponent,
        TextInputComponent,
        AboutComponent,
        CompeteComponent,
        HomeComponent,
        RegisterComponent,
        UserInfoPipe,
        IsLiveStatusPipe,
        InfotipComponent,
        DropDownListComponent,
        CodeEditorComponent,
        PrettyMetaComponent,
        GreenredComponent,
    ],
    providers: [DatePipe],
})
export class CommonModule {}
