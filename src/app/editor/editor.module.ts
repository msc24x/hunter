import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { EditorComponent } from './pages/editor/editor.component';
import { EditorMenuComponent } from './pages/editor-menu/editor-menu.component';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';
import { QuestionsListComponent } from './components/questions-list/questions-list.component';
import { RouterModule } from '@angular/router';
import { EditorRoutingModule } from './editor-routing.module';
import { NgKatexComponent } from './components/ng-katex/ng-katex.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CodeTesterComponent } from './components/code-tester/code-tester.component';

@NgModule({
    declarations: [
        EditorComponent,
        EditorMenuComponent,
        CreateDialogComponent,
        DashboardCardComponent,
        QuestionsListComponent,
        NgKatexComponent,
        CodeTesterComponent,
    ],
    imports: [
        CommonModule,
        HunterCommonModule,
        RouterModule,
        EditorRoutingModule,
        MatTooltipModule,
        FontAwesomeModule,
    ],
    exports: [QuestionsListComponent, NgKatexComponent],
})
export class EditorModule {}
