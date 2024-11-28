import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'dashboard-card',
    templateUrl: './dashboard-card.component.html',
    styleUrls: ['./dashboard-card.component.scss'],
})
export class DashboardCardComponent implements OnInit {
    @Input()
    title: string | undefined;

    @Input()
    type: string | undefined;

    @Input()
    message: string | undefined;

    constructor() {}

    ngOnInit(): void {}
}
