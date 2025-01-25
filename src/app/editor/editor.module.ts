import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonModule as HunterCommonModule } from 'src/app/common/common.module';
import { EditorComponent } from './pages/editor/editor.component';
import { EditorMenuComponent } from './pages/editor-menu/editor-menu.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';
import { RouterModule } from '@angular/router';
import { EditorRoutingModule } from './editor-routing.module';
import { NgKatexComponent } from '../common/components/ng-katex/ng-katex.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CodeTesterComponent } from './components/code-tester/code-tester.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { InsightsComponent } from './pages/insights/insights.component';

@NgModule({
    declarations: [
        EditorComponent,
        EditorMenuComponent,
        DashboardCardComponent,
        CodeTesterComponent,
        InsightsComponent,
    ],
    imports: [
        CommonModule,
        HunterCommonModule,
        RouterModule,
        EditorRoutingModule,
        MatTooltipModule,
        FontAwesomeModule,
        MatSelectModule,
        MatSlideToggleModule,
        FormsModule,
    ],
    exports: [NgKatexComponent],
})
export class EditorModule {}
