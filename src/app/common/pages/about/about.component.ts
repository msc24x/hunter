import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserInfo } from 'src/environments/environment';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
    isAuthenticated: boolean = false;
    user = {} as UserInfo;

    constructor(private authService: AuthService) {
        authService.isAuthenticated.subscribe((val) => {
            this.user = this.authService.user;
            this.isAuthenticated = val;
        });
    }

    ngOnInit(): void {
        window.scroll(0, 0);

        if (this.isAuthenticated) {
            return;
        }

        this.authService.authenticate_credentials().subscribe((res) => {
            if (res.status == 202) {
                this.user = res.body as UserInfo;
                this.authService.user = this.user;
                this.isAuthenticated = true;
                this.authService.isAuthenticated.next(true);
            }
        });
    }
}
