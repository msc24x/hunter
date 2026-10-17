import { NgModule } from '@angular/core';
import { CommonModule as AngularCommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppBarComponent } from './components/app-bar/app-bar.component';
import { BottomAppBarComponent } from './components/bottom-app-bar/bottom-app-bar.component';
import { PopupComponent } from './components/popup/popup.component';
import { LoadingComponent } from './components/loading/loading.component';
import { InfoCardComponent } from './components/info-card/info-card.component';

const COMPONENTS = [
    AppBarComponent,
    BottomAppBarComponent,
    PopupComponent,
    LoadingComponent,
    InfoCardComponent,
];

@NgModule({
    declarations: [...COMPONENTS],
    imports: [
        AngularCommonModule,
        RouterModule,
        FontAwesomeModule,
        MatTooltipModule,
    ],
    exports: [...COMPONENTS],
})
export class ShellModule {}
