import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'drop-down-list',
    templateUrl: './drop-down-list.component.html',
    styleUrls: ['./drop-down-list.component.scss'],
})
export class DropDownListComponent implements OnInit {
    @Input()
    items: string[] = [];

    @Input()
    listType: string = '';

    @Output()
    itemSelectedChange = new EventEmitter<string>();
    @Input()
    itemSelected = '';

    hover = false;

    constructor() {}

    selectItem({ target }: any) {
        this.itemSelectedChange.emit(target.innerText);
        this.itemSelected = target.innerText;
    }

    ngOnInit(): void {
        this.itemSelected = this.items[0];
    }

    expandList() {
        this.hover = !this.hover;
    }
}
