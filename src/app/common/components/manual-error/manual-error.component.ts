import { Component, Input } from '@angular/core';
import {
    faBan,
    faRibbon,
    faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'manual-error',
    templateUrl: './manual-error.component.html',
    styleUrls: ['./manual-error.component.scss'],
})
export class ManualErrorComponent {
    errorIcon = faTriangleExclamation;
    blockerIcon = faBan;

    @Input()
    message: string = '';

    @Input()
    blocker = false;
}
