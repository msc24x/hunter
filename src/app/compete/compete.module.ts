import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { DropDownListComponent } from './components/drop-down-list/drop-down-list.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { CompetitionComponent } from './pages/competition/competition.component';
import { KatexModule } from 'ng-katex';
import { RouterModule } from '@angular/router';
import { EditorModule } from '../editor/editor.module';



@NgModule({
  declarations: [
    DropDownListComponent,
    ScoreboardComponent,
    CompetitionComponent
  ],
  imports: [
    CommonModule,
    HunterCommonModule,
    EditorModule,
    KatexModule,
    RouterModule
  ],
})
export class CompeteModule { }
