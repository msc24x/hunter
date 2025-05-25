import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { CompetitionComponent } from './pages/competition/competition.component';
import { RouterModule } from '@angular/router';
import { EditorModule } from '../editor/editor.module';
import { CompeteRoutingModule } from './compete-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { InviteComponent } from './pages/invite/invite.component';

@NgModule({
    declarations: [CompetitionComponent, InviteComponent],
    imports: [
        CommonModule,
        HunterCommonModule,
        EditorModule,
        CompeteRoutingModule,
        RouterModule,
        FontAwesomeModule,
        MatTooltipModule,
        FormsModule,
    ],
    providers: [DatePipe],
})
export class CompeteModule {}
