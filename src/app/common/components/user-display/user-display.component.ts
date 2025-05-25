import { Component, Input } from '@angular/core';
import { UserInfo } from 'src/environments/environment';

@Component({
    selector: 'user-display',
    templateUrl: './user-display.component.html',
    styleUrls: ['./user-display.component.scss'],
})
export class UserDisplayComponent {
    @Input()
    userInfo?: UserInfo;

    @Input()
    noClick = false;

    @Input()
    noAvatar = false;
}
