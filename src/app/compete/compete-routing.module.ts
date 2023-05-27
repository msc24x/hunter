import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionComponent } from './pages/competition/competition.component';

const routes: Routes = [
{
    "path" : "p/:competition_id",
    "component": CompetitionComponent,

},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompeteRoutingModule { }
