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
import { CompeteComponent } from '../compete/pages/compete/compete.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import {
    IsLiveStatusPipe,
    PrettyDate,
    PrettyDuration,
    TimeAgo,
    UserInfoPipe,
} from './pipes/userInfoPipe';
import { RouterModule } from '@angular/router';
import { CommonRoutingModule } from './common-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { InfotipComponent } from './components/infotip/infotip.component';
import { DropDownListComponent } from './components/drop-down-list/drop-down-list.component';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { PrettyMetaComponent } from './components/pretty-meta/pretty-meta.component';
import { GreenredComponent } from './greenred/greenred.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { QuestionsListComponent } from './questions-list/questions-list.component';
import { QuestionEvaluationComponent } from './components/question-evaluation/question-evaluation.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { SignInPromptComponent } from './components/sign-in-prompt/sign-in-prompt.component';
import { MatSelectModule } from '@angular/material/select';
import { QuesTypeLabelComponent } from './components/ques-type-label/ques-type-label.component';
import { ManualErrorComponent } from './components/manual-error/manual-error.component';
import { SubmissionViewComponent } from './components/submission-view/submission-view.component';
import { UserDisplayComponent } from './components/user-display/user-display.component';
import { QuestionDisplayComponent } from './components/question-display/question-display.component';
import { NgKatexComponent } from './components/ng-katex/ng-katex.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { FormsModule } from '@angular/forms';
import {
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';
import { CompetitionCardComponent } from './components/competition-card/competition-card.component';
import { CommunitiesListComponent } from './components/communities-list/communities-list.component';

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
        PrettyDate,
        TimeAgo,
        PrettyDuration,
        InfotipComponent,
        DropDownListComponent,
        CodeEditorComponent,
        PrettyMetaComponent,
        GreenredComponent,
        ScoreboardComponent,
        QuestionsListComponent,
        QuestionEvaluationComponent,
        ProfileComponent,
        ProfileCardComponent,
        CreateDialogComponent,
        SignInPromptComponent,
        QuesTypeLabelComponent,
        ManualErrorComponent,
        SubmissionViewComponent,
        UserDisplayComponent,
        QuestionDisplayComponent,
        NgKatexComponent,
        SpinnerComponent,
        CompetitionCardComponent,
        CommunitiesListComponent,
    ],
    imports: [
        AngularCommonModule,
        RouterModule,
        CommonRoutingModule,
        FontAwesomeModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatSelectModule,
        FormsModule,
        CdkDropList,
        CdkDrag,
        CdkDragPlaceholder,
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
        PrettyDate,
        IsLiveStatusPipe,
        InfotipComponent,
        DropDownListComponent,
        CodeEditorComponent,
        PrettyMetaComponent,
        GreenredComponent,
        ScoreboardComponent,
        QuestionsListComponent,
        QuestionEvaluationComponent,
        ProfileCardComponent,
        SignInPromptComponent,
        QuesTypeLabelComponent,
        ManualErrorComponent,
        SubmissionViewComponent,
        UserDisplayComponent,
        QuestionDisplayComponent,
        NgKatexComponent,
        SpinnerComponent,
        TimeAgo,
        PrettyDuration,
        CommunitiesListComponent,
    ],
    providers: [DatePipe],
})
export class CommonModule {}
