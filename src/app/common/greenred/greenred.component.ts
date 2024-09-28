import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
    selector: 'greenred',
    templateUrl: './greenred.component.html',
    styleUrls: ['./greenred.component.scss'],
})
export class GreenredComponent implements OnChanges {
    @Input()
    green_number: number = 50;

    @Input()
    red_number: number = 50;

    @Input()
    green_label: string = 'Green';

    @Input()
    red_label: string = 'Red';

    green_ratio: number = 50;

    ngOnChanges(): void {
        this.green_ratio = Math.round(
            (this.green_number * 100) / (this.green_number + this.red_number)
        );
        console.log(this.green_ratio, 'sdf');
        console.log(this.green_number);
        console.log(this.red_number);
    }
}
