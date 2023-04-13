import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompetitionComponent } from './compete/pages/competition/competition.component';
import { EditorMenuComponent } from './editor/pages/editor-menu/editor-menu.component';
import { HomeComponent } from './common/pages/home/home.component';
import { AboutComponent } from './common/pages/about/about.component';
import { CompeteComponent } from './common/pages/compete/compete.component';
import { NotFoundComponent } from './common/pages/not-found/not-found.component';
import { RegisterComponent } from './common/pages/register/register.component';
import { EditorComponent } from './editor/pages/editor/editor.component';

const routes: Routes = [{
  "path" : "",
  component : HomeComponent
},{
  "path" : "home",
  "component" : HomeComponent
},{
  "path" : "register",
  "component" : RegisterComponent
},{
  "path" : "compete",
  "component" : CompeteComponent
},{
  "path" : "hunt/:competition_id",
  "component" : CompetitionComponent
},{
  "path" : "editor/:competition_id",
  "component" : EditorComponent
},
{
  "path" : "editor",
  "component" : EditorMenuComponent
},
{
  "path" : "404",
  "component" : NotFoundComponent
},
{
  "path" : "about",
  "component" : AboutComponent
},
{
    "path"        : '**',
    "pathMatch"   : 'full',
    "component"   : NotFoundComponent
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
