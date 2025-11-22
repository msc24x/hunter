import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    Community,
    CompetitionInfo,
    UserInfo,
} from 'src/environments/environment';

import { Router } from '@angular/router';
import { CommunitiesDataService } from 'src/app/services/communities-data/communities-data.service';

@Component({
    selector: 'communities',
    templateUrl: './communities.component.html',
    styleUrls: ['./communities.component.scss'],
})
export class CommunitiesComponent implements OnInit, OnDestroy {
    loading = 0;
    communities: Array<Community> = [];

    user = {} as UserInfo;
    isAuthenticated = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private titleService: Title,
        private snackBar: MatSnackBar,
        private communitiesService: CommunitiesDataService
    ) {
        titleService.setTitle('Communities - Hunter');

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    ngOnDestroy(): void {}

    ngOnInit(): void {
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
                        this.fetchPageData();
                    }
                },
                (err) => {
                    this.loading--;
                }
            );
        } else {
            this.fetchPageData();
        }
    }

    fetchPageData() {
        this.communitiesService.fetchCommunities({}).subscribe({
            next: (communitiesResponse) => {
                this.communities = communitiesResponse.body as Array<Community>;
            },
            error: (err) => {
                this.snackBar.open('Something went wrong');
            },
        });
    }
}
