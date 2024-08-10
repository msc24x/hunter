import { Component, Input } from '@angular/core';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'infotip',
    templateUrl: './infotip.component.html',
    styleUrls: ['./infotip.component.scss'],
})
export class InfotipComponent {
    infoIcon = faCircleInfo;

    @Input()
    message: string = 'Info';
}
