import { PrefixNot } from '@angular/compiler';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AboutComponent } from './views/about/about.component';
import { CompeteComponent } from './views/compete/compete.component';
import { CompetitionComponent } from './views/competition/competition.component';
import { EditorMenuComponent } from './views/editor-menu/editor-menu.component';
import { EditorComponent } from './views/editor/editor.component';
import { HomeComponent } from './views/home/home.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { RegisterComponent } from './views/register/register.component';

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
