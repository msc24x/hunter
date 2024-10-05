import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

@Component({
    selector: 'popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
})
export class PopupComponent implements OnInit {
    @Output()
    closeEvent = new EventEmitter<string>();

    @Input()
    title = 'Message';

    @Input()
    destructive = false;

    @Input()
    visible = false;

    @Input()
    showControls = true;

    constructor(private el: ElementRef) {}

    bgClicked(event: any) {
        if (event.target.classList.contains('bg')) {
            event.stopPropagation();
            this.closeEvent.emit('cancel');
        }
    }

    ngOnInit(): void {
        if (!this.visible) this.closeEvent.emit('cancel');

        // document.addEventListener('keydown', (event) => {
        //     if (event.key.startsWith('Esc')) {
        //         document.querySelectorAll('popup').forEach((pelem) => {
        //             const haveAnotherPopup =
        //                 pelem.querySelectorAll('popup').length;

        //             if (haveAnotherPopup) {
        //                 return;
        //             }

        //             if (
        //                 pelem.id === (this.el.nativeElement as HTMLElement).id
        //             ) {

        //                 console.log('esc on popup', pelem);
        //                 this.closeEvent.emit('cancel');
        //             }
        //         });
        //     }
        // });
    }
}
