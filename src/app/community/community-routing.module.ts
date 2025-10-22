import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommunitiesComponent } from './pages/communities/communities.component';
import { CreateCommunityComponent } from './pages/create-community/create-community.component';
import { CommunityComponent } from './pages/community/community.component';

const routes: Routes = [
    {
        'path': 'browse',
        'component': CommunitiesComponent,
    },
    {
        'path': 'browse/:community_id',
        'component': CommunityComponent,
    },
    {
        'path': 'create',
        'title': 'Create a Hunter Community',
        'component': CreateCommunityComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CommunityRoutingModule {}
