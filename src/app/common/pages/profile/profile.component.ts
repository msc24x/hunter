import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserDataService } from 'src/app/services/user-data/user-data.service';
import { UserInfo } from 'src/environments/environment';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    linkIcon = faArrowUpRightFromSquare;

    user: UserInfo = {} as UserInfo;
    loading: number = 0;
    editable = false;
    isAuthenticated = false;
    user_profile: UserInfo = {} as UserInfo;
    user_profile_id: number = -1;

    constructor(
        private routeService: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private userService: UserDataService
    ) {}

    fetchUserDetails() {
        this.loading++;
        this.user_profile_id = parseInt(
            this.activatedRoute.snapshot.paramMap.get('user_id') || ''
        );
        this.userService.getUser(this.user_profile_id).subscribe({
            next: (data) => {
                this.user_profile = data.body!;
                this.loading--;
            },
            error: (err) => {
                this.loading--;

                this.routeService.navigate(['/compete']);
            },
        });
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(() => {
            this.fetchUserDetails();
        });

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

                        if (this.user.id === this.user_profile_id) {
                            this.editable = true;
                        }
                    }
                },
                (err) => {
                    this.loading--;
                }
            );
        } else {
            this.user = this.authService.user;
        }

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    openUrl(url: string) {
        window.open(url, '_blank');
    }

    updateUserInfo() {
        const getElemVal = (key: string) => {
            const elem = document.getElementById(key) as HTMLInputElement;

            return elem.value;
        };

        this.user.name = getElemVal('user_name_input');
        this.user.blog_url = getElemVal('user_blog_input');
        this.user.linkedin_url = getElemVal('user_linkedin_input');

        this.loading++;

        this.userService
            .updateUserInfo({
                id: this.user.id,
                name: this.user.name,
                blog_url: this.user.blog_url,
                linkedin_url: this.user.linkedin_url,
                email: this.user.email,
            })
            .subscribe((res) => {
                this.loading--;
            });
    }
}
