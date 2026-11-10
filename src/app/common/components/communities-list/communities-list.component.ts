import { Component, Input } from '@angular/core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { Community } from 'src/environments/environment';

@Component({
    selector: 'communities-list',
    templateUrl: './communities-list.component.html',
    styleUrls: ['./communities-list.component.scss'],
})
export class CommunitiesListComponent {
    starIcon = faStar;

    @Input({ required: true })
    communities: Array<Community> = [];

    getUrl(url?: string) {
        if (!url?.startsWith('http')) {
            url = 'https://' + url;
        }

        return url;
    }

    openUrl(url?: string) {
        window.open(this.getUrl(url), '_blank');
    }

    getStatusTooltip(community: Community) {
        if (community.status === 'DISABLED') {
            return 'This community has been disabled and is no longer active on Hunter.';
        }

        if (community.status == 'NOT_APPROVED') {
            return 'The community creation request was not approved.';
        }

        if (community.status === 'PENDING_APPROVAL') {
            return 'The community creation request is under review and awaiting approval.';
        }

        return '';
    }
}
