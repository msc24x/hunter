import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { faClose } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
})
export class PopupComponent implements OnInit {
    closeIcon = faClose;

    @Output()
    closeEvent = new EventEmitter<'cancel' | 'continue'>();

    @Input()
    heading = 'Message';

    @Input()
    destructive = false;

    @Input()
    visible = false;

    @Input()
    showControls = true;

    @Input()
    continueOnly = false;

    @Input()
    noContainer = false;

    @Input()
    continueMessage = 'Continue';

    constructor(private el: ElementRef) {}

    bgClicked(event: any) {
        if (
            event.target.classList.contains('bg') ||
            event.target.closest('.close-icon')
        ) {
            event.stopPropagation();
            this.closeEvent.emit('cancel');
        }
    }

    ngOnInit(): void {
        if (!this.visible) this.closeEvent.emit('cancel');
    }
}
