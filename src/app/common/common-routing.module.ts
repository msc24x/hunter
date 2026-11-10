import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { DocsMcpComponent } from './pages/docs-mcp/docs-mcp.component';
import { DesignSystemComponent } from './pages/design-system/design-system.component';
import { environment } from 'src/environments/environment';
import { CompeteComponent } from '../compete/pages/compete/compete.component';
const routes: Routes = [
    {
        'path': '',
        'component': HomeComponent,
        'pathMatch': 'full',
    },
    {
        'path': 'home',
        'component': HomeComponent,
    },
    {
        'path': 'compete',
        'title': 'Public Competitions - Hunter',
        'component': CompeteComponent,
    },
    {
        'path': 'u/:user_id',
        'title': 'Anonymous user - Hunter',

        'component': ProfileComponent,
    },
    // {
    //     'path': 'communities/:community_id',
    //     'title': 'Hunter',
    //     'component': CommunityComponent,
    // },
    {
        'path': 'about',
        'title':
            'Hunter - Open Source platform built for simplicity, speed, and control',
        'component': AboutComponent,
    },
    {
        'path': 'docs/mcp',
        'title': 'Hunter MCP Server - AI assistants for contest hosting',
        'component': DocsMcpComponent,
    },
    ...(environment.production
        ? []
        : [
              {
                  'path': '_design',
                  'title': 'Design System - Hunter (dev)',
                  'component': DesignSystemComponent,
              },
          ]),
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CommonRoutingModule {}
