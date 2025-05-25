import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionComponent } from './pages/competition/competition.component';
import { InviteComponent } from './pages/invite/invite.component';

const routes: Routes = [
    {
        'path': 'p/:competition_id',
        'component': CompetitionComponent,
    },
    {
        'path': 'p/:competition_id/:ques_id',
        'component': CompetitionComponent,
    },
    {
        'path': 'i/:invite_id',
        'component': InviteComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CompeteRoutingModule {}
