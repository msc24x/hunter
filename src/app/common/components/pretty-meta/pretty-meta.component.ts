import { Component, Input } from '@angular/core';
import {
    faCircleCheck,
    faCircleInfo,
    faCircleXmark,
    faClock,
    faMemory,
    faMicrochip,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'pretty-meta',
    templateUrl: './pretty-meta.component.html',
    styleUrls: ['./pretty-meta.component.scss'],
})
export class PrettyMetaComponent {
    successIcon = faCircleCheck;
    failureIcon = faCircleXmark;

    @Input()
    meta: string = '';

    @Input()
    success: boolean = false;

    getPrettyRuntimeInfo(info: string): any[] {
        const prettyArr: any[] = [];
        const msgMap: any = {
            'RE': 'Error',
            'SG': 'Died on signal',
            'TO': 'Timed out',
            'XX': 'Internal error',
        };

        info.split('\n').forEach((infoKey) => {
            const [itemName, itemVal] = infoKey.split(':');

            switch (itemName) {
                case 'cg-mem':
                    prettyArr.push(['Memory', itemVal + ' kb', faMemory]);
                    break;
                case 'status':
                    prettyArr.push([
                        'Message',
                        itemVal + ': ' + (msgMap[itemVal] || ''),
                        faCircleInfo,
                    ]);
                    break;
                case 'time':
                    prettyArr.push(['CPU', itemVal + ' sec', faMicrochip]);
                    break;
                case 'time-wall':
                    prettyArr.push(['Total', itemVal + ' sec', faClock]);
            }
        });

        return prettyArr;
    }
}
