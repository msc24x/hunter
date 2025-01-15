import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorMenuComponent } from './pages/editor-menu/editor-menu.component';
import { EditorComponent } from './pages/editor/editor.component';
import { InsightsComponent } from './pages/insights/insights.component';
import { ScoreboardComponent } from '../common/components/scoreboard/scoreboard.component';

const routes: Routes = [
    {
        'path': 'workbench',
        'component': EditorMenuComponent,
    },
    {
        'path': ':competition_id',
        'component': EditorComponent,
    },
    {
        'path': ':competition_id/insights',
        'component': InsightsComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class EditorRoutingModule {}
