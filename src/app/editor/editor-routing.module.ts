import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorMenuComponent } from './pages/editor-menu/editor-menu.component';
import { EditorComponent } from './pages/editor/editor.component';

const routes: Routes = [
{
    "path" : "",
        "component": EditorMenuComponent,
    "pathMatch" : "full"
  
},{
    "path" : ":competition_id",
    "component": EditorComponent,
},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorRoutingModule { }
