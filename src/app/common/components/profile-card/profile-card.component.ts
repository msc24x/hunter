import { Component, Input } from '@angular/core';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faGlobe, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { UserInfo } from 'src/environments/environment';

@Component({
    selector: 'profile-card',
    templateUrl: './profile-card.component.html',
    styleUrls: ['./profile-card.component.scss'],
})
export class ProfileCardComponent {
    githubIcon = faGithub;
    linkedinIcon = faLinkedin;
    webIcon = faGlobe;
    pointsIcon = faTrophy;

    @Input()
    user!: UserInfo;

    @Input()
    controls = false;

    getUrl(url?: string) {
        if (!url?.startsWith('http')) {
            url = 'https://' + url;
        }

        return url;
    }

    openUrl(url?: string) {
        window.open(this.getUrl(url), '_blank');
    }
}
