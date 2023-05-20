import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { EditorComponent } from './pages/editor/editor.component';
import { EditorMenuComponent } from './pages/editor-menu/editor-menu.component';
import { CreateDialogComponent } from './components/create-dialog/create-dialog.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';
import { QuestionsListComponent } from './components/questions-list/questions-list.component';
import { KatexModule } from 'ng-katex';
import { RouterModule } from '@angular/router';
import { EditorRoutingModule } from './editor-routing.module';



@NgModule({
  declarations: [
    EditorComponent,
    EditorMenuComponent,
    CreateDialogComponent,
    DashboardCardComponent,
    QuestionsListComponent
  ],
  imports: [
    CommonModule,
    HunterCommonModule,
    KatexModule,
    RouterModule,
    EditorRoutingModule,
  ],
  exports: [
    QuestionsListComponent
  ],
})
export class EditorModule { }
