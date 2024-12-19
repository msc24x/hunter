import { Component, Input } from '@angular/core';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'infotip',
    templateUrl: './infotip.component.html',
    styleUrls: ['./infotip.component.scss'],
})
export class InfotipComponent {
    infoIcon = faCircleQuestion;

    @Input()
    message: string = 'Info';

    @Input()
    svgSize: SizeProp = 'sm';
}
