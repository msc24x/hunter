import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CommunitiesDataService } from 'src/app/services/communities-data/communities-data.service';
import { Community, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'create-community',
    templateUrl: './create-community.component.html',
    styleUrls: ['./create-community.component.scss'],
})
export class CreateCommunityComponent implements OnInit, OnDestroy {
    loading = 0;

    community = {} as Community;

    user = {} as UserInfo;
    errors: any = {};
    isAuthenticated = false;
    iConfirm = false;
    logo_file_base64: string = '';

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private titleService: Title,
        private snackBar: MatSnackBar,
        private communityService: CommunitiesDataService
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
                    }
                },
                (err) => {
                    this.loading--;
                }
            );
        } else {
        }
    }

    onLogoFileChange(event: any) {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            this.logo_file_base64 = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix if present
            const base64 = result.split(',')[1] || result;
            this.logo_file_base64 = base64;
        };
        reader.readAsDataURL(file);
    }

    sendRequest() {
        this.errors = {};

        if (!this.iConfirm) {
            this.errors.iConfirm = [
                'You must confirm that you represent this community before continuing, by clicking at the checkbox above.',
            ];
            return;
        }

        this.loading++;

        this.communityService
            .sendCommunityCreateRequest({
                name: this.community.name || '',
                description: this.community.description || '',
                website_link: this.community.website_link || '',
                logo_file_path: this.logo_file_base64 || '',
            })
            .subscribe(
                (res) => {
                    if (res.ok) {
                        this.snackBar.open(
                            'Request sent, thank you! Redirecting to Compete page...'
                        );

                        setTimeout(() => {
                            this.router.navigate(['/compete']);
                        }, 1000);
                    } else {
                        this.snackBar.open(
                            'There are some issues, please check the form.'
                        );
                    }
                    this.loading--;
                },
                (error) => {
                    this.loading--;

                    if (typeof error.error === 'string') {
                        this.snackBar.open(error.error);
                        return;
                    }
                    this.errors = error.error;
                }
            );
    }
}
