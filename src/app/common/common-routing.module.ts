import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { CompeteComponent } from './pages/compete/compete.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';

const routes: Routes = [{
  "path" : "",
  "component": HomeComponent,
  "pathMatch" : "full",
},{
  "path" : "home",
  "component" : HomeComponent
},{
  "path" : "register",
  "component" : RegisterComponent
},{
  "path" : "compete",
  "component" : CompeteComponent
},
{
  "path" : "about",
  "component" : AboutComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommonRoutingModule { }
