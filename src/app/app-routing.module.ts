import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './common/pages/not-found/not-found.component';

const routes: Routes = [
    {
        'path': '',
        'loadChildren': () =>
            import('./common/common.module').then((m) => m.CommonModule),
    },
    {
        'path': 'editor',
        'loadChildren': () =>
            import('./editor/editor.module').then((m) => m.EditorModule),
    },
    {
        'path': 'compete',
        'loadChildren': () =>
            import('./compete/compete.module').then((m) => m.CompeteModule),
    },
    {
        'path': 'communities',
        'loadChildren': () =>
            import('./community/community.module').then(
                (m) => m.CommunityModule
            ),
    },
    {
        'path': '404',
        'component': NotFoundComponent,
    },
    {
        'path': '**',
        'component': NotFoundComponent,
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
