import { Component, Input } from '@angular/core';
import { CompetitionInfo } from 'src/environments/environment';

@Component({
    selector: 'insights',
    templateUrl: './insights.component.html',
    styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent {
    @Input()
    competitionInfo = {} as CompetitionInfo;
}
