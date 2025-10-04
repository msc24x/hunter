import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';

import { Router } from '@angular/router';

@Component({
    selector: 'communities',
    templateUrl: './communities.component.html',
    styleUrls: ['./communities.component.scss'],
})
export class CommunitiesComponent implements OnInit, OnDestroy {
    loading = 0;

    user = {} as UserInfo;
    isAuthenticated = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private titleService: Title,
        private snackBar: MatSnackBar
    ) {
        titleService.setTitle('Communities - Hunter');

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    ngOnDestroy(): void {}

    ngOnInit(): void {
        console.log('hi');

        if (!this.isAuthenticated) {
            this.loading++;
            this.authService.authenticate_credentials().subscribe(
                (res) => {
                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);
                        this.loading--;
                    }
                },
                (err) => {
                    this.loading--;
                }
            );
        } else {
        }
    }
}
