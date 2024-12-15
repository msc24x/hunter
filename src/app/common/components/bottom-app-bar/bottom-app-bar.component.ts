import { Component, OnInit } from '@angular/core';
import { faCopyright } from '@fortawesome/free-regular-svg-icons';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { showPopup } from 'src/app/utils/utils';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'bottom-app-bar',
    templateUrl: './bottom-app-bar.component.html',
    styleUrls: ['./bottom-app-bar.component.scss'],
})
export class BottomAppBarComponent implements OnInit {
    version: string = environment.version;
    heartIcon = faHeart;
    copyIcon = faCopyright;

    constructor() {}

    ngOnInit(): void {}

    getYear() {
        const date = new Date();
        return date.getFullYear();
    }

    showPrivacyPolicy(f: boolean) {
        showPopup(f, 'privacy_policy');
    }

    openGithub() {
        window.open('https://github.com/msc24x/hunter', '_blank');
    }

    href(link: string) {
        window.open(link, '_blank');
    }
}
