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

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        window.scroll(0, 0);

        if (this.isAuthenticated) {
            return;
        }

        this.authService.authenticate_credentials().subscribe((res) => {
            if (res.status == 202) {
                const body = res.body as UserInfo;
                this.user = {
                    id: body.id,
                    email: body.email,
                    name: body.name,
                };
                this.authService.user = this.user;
                this.isAuthenticated = true;
                this.authService.isAuthenticated.next(true);
            }
        });
    }
}
