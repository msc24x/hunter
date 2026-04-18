import { Component, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'sign-in-prompt',
    templateUrl: './sign-in-prompt.component.html',
    styleUrls: ['./sign-in-prompt.component.scss'],
})
export class SignInPromptComponent {
    @Input()
    minimal = false;

    getStarted() {
        window.open(`${environment.apiUrl}/oauth/github`);
    }
}
