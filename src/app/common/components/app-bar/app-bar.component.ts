import { Component, Input, OnInit } from '@angular/core';
import { UserInfo, domainName, protocol } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { faCircleUser } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-bar',
    templateUrl: './app-bar.component.html',
    styleUrls: ['./app-bar.component.scss'],
})
export class AppBarComponent implements OnInit {
    userIcon = faCircleUser;
    loading = false;

    @Input()
    app_title = 'Hunter';
    @Input()
    app_title_s = 'H_';

    isAuthenticated: boolean = false;
    user: UserInfo = {
        id: 0,
        email: '',
        name: '',
    };

    @Input()
    showRegisterBtn: boolean = true;

    constructor(private authService: AuthService) {
        authService.isAuthenticated.subscribe((val) => {
            this.user = this.authService.user;
            this.isAuthenticated = val;
        });
    }

    href(link: string) {
        window.open(link, '_blank');
    }

    ngOnInit(): void {
        const navBar = document.getElementById('navBarCompact') as HTMLElement;
        navBar.style.display = 'none';

        let handleNavbarCollapse = (event: Event) => {
            let target = event.target as HTMLElement;
            if (target.id !== 'navBarBtn') this.collapseNavBar();
        };

        document.addEventListener('click', handleNavbarCollapse);
        document.addEventListener('scroll', handleNavbarCollapse);
    }

    collapseNavBar() {
        // hide if visible
        const navBar = document.getElementById('navBarCompact') as HTMLElement;
        if (navBar.style.display !== 'none') {
            this.toggleNavBar(true);
        }
    }

    toggleNavBar(hide = false) {
        const navBar = document.getElementById('navBarCompact') as HTMLElement;
        if (hide) {
            navBar.style.display = 'none';
            return;
        }
        if (navBar.style.display == 'none') {
            navBar.style.display = 'block';
        } else {
            navBar.style.display = 'none';
        }
    }

    redirectToGitHubOAuth() {
        window.open(`${protocol}://${domainName}/api/oauth/github`);
    }

    sendLogoutRequest() {
        this.loading = true;
        this.authService.logout().subscribe((res) => {
            this.authService.user = {
                id: 0,
                email: '',
                name: '',
            };
            this.authService.isAuthenticated.next(false);
            this.loading = false;
        });
    }
}
