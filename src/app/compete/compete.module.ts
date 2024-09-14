import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { CompetitionComponent } from './pages/competition/competition.component';
import { RouterModule } from '@angular/router';
import { EditorModule } from '../editor/editor.module';
import { CompeteRoutingModule } from './compete-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
    declarations: [ScoreboardComponent, CompetitionComponent],
    imports: [
        CommonModule,
        HunterCommonModule,
        EditorModule,
        CompeteRoutingModule,
        RouterModule,
        FontAwesomeModule,
        MatTooltipModule,
    ],
    providers: [DatePipe],
})
export class CompeteModule {}
