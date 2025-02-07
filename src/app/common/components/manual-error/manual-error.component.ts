import { Component, Input } from '@angular/core';
import {
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

    @Input()
    message: string = '';
}
