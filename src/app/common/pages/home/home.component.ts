import { Component, OnInit } from '@angular/core';
import {
    UserInfo,
    domainName,
    environment,
    protocol,
} from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import {
    faCircleNodes,
    faRankingStar,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    homeIcon = faCircleNodes;
    isAuthenticated: boolean = false;
    prod: boolean = environment.production;
    user = {
        id: 0,
        email: '',
        name: '',
    };
    usersCount = 900;
    contestsCount = 200;

    constructor(private authService: AuthService) {
        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    scrollToBottom() {
        let elem = document.getElementById('login_tag');
        elem?.scrollIntoView();
    }

    animateInView() {
        let targets = document.getElementsByClassName('inview_slide');

        for (let target of targets) {
            const observer = new IntersectionObserver((entries) => {
                for (let entry of entries) {
                    if (entry.isIntersecting)
                        target.classList.add('inview_slide__active');
                    else target.classList.remove('inview_slide__active');
                }
            });
            observer.observe(target);
        }
    }

    ngOnInit(): void {
        this.animateInView();
        this.loadPageData();

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

    loadPageData() {
        fetch('/api/status/users')
            .then((res) => res.json())
            .then((res) => {
                let count: number = res?.status;

                if (count) {
                    this.usersCount = 10 * Math.floor(count / 10);
                }
            });

        fetch('/api/status/competitions')
            .then((res) => res.json())
            .then((res) => {
                let count = res?.status;

                if (count) {
                    this.contestsCount = 10 * Math.floor(count / 10);
                }
            });
    }
}
