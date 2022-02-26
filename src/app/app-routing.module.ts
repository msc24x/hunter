import { PrefixNot } from '@angular/compiler';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CompeteComponent } from './compete/compete.component';
import { CompetitionComponent } from './competition/competition.component';
import { EditorMenuComponent } from './editor-menu/editor-menu.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';

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
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
