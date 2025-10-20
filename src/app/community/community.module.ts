import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommunitiesComponent } from './pages/communities/communities.component';
import { CommunityRoutingModule } from './community-routing.module';
import { CreateCommunityComponent } from './pages/create-community/create-community.component';
import { CommunityComponent } from './pages/community/community.component';

@NgModule({
    declarations: [CommunitiesComponent, CreateCommunityComponent, CommunityComponent],
    imports: [
        CommonModule,
        HunterCommonModule,
        RouterModule,
        CommunityRoutingModule,
        MatTooltipModule,
        FontAwesomeModule,
        MatSelectModule,
        MatSlideToggleModule,
        FormsModule,
    ],
    exports: [CommunitiesComponent],
})
export class CommunityModule {}
