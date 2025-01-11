import { Component, Input } from '@angular/core';

@Component({
    selector: 'pretty-meta',
    templateUrl: './pretty-meta.component.html',
    styleUrls: ['./pretty-meta.component.scss'],
})
export class PrettyMetaComponent {
    @Input()
    meta: string = '';

    @Input()
    success: boolean = false;

    getPrettyRuntimeInfo(info: string): any[] {
        const prettyArr: any[] = [];
        const msgMap: any = {
            'RE': 'Runtime error',
            'SG': 'Died on signal',
            'TO': 'Timed out',
            'XX': 'Internal error',
        };

        info.split('\n').forEach((infoKey) => {
            const [itemName, itemVal] = infoKey.split(':');

            switch (itemName) {
                case 'cg-mem':
                    prettyArr.push(['Memory', itemVal + ' kb']);
                    break;
                case 'status':
                    prettyArr.push([
                        'Message',
                        itemVal + ': ' + (msgMap[itemVal] || ''),
                    ]);
                    break;
                case 'time':
                    prettyArr.push(['CPU', itemVal + ' sec']);
                    break;
                case 'time-wall':
                    prettyArr.push(['Total', itemVal + ' sec']);
            }
        });

        return prettyArr;
    }
}
