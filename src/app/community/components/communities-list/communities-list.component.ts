import { Component, Input } from '@angular/core';
import { Community } from 'src/environments/environment';

@Component({
    selector: 'communities-list',
    templateUrl: './communities-list.component.html',
    styleUrls: ['./communities-list.component.scss'],
})
export class CommunitiesListComponent {
    @Input({ required: true })
    communities: Array<Community> = [];
}
