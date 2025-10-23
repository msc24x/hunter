import { Component, Input } from '@angular/core';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { Community } from 'src/environments/environment';

@Component({
    selector: 'community-display',
    templateUrl: './community-display.component.html',
    styleUrls: ['./community-display.component.scss'],
})
export class CommunityDisplayComponent {
    @Input({ required: true })
    community: Community | null = null;

    groupIcon = faPeopleGroup;
}
