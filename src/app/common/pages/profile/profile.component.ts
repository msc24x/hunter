import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    faArrowUpRightFromSquare,
    faCopy,
    faDatabase,
    faTrash,
    faTrophy,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import {
    ApiToken,
    ApiTokensService,
} from 'src/app/services/api-tokens/api-tokens.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserDataService } from 'src/app/services/user-data/user-data.service';
import { apiEndpoints, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    linkIcon = faArrowUpRightFromSquare;
    pointsIcon = faTrophy;
    contestsIcon = faDatabase;
    participatedIcon = faUser;
    copyIcon = faCopy;
    trashIcon = faTrash;

    user: UserInfo = {} as UserInfo;
    loading: number = 0;
    editable = false;
    selectedTabIndex = 0;
    isAuthenticated = false;
    user_profile: UserInfo = {} as UserInfo;
    user_profile_id: number = -1;

    readonly mcpEndpoint = apiEndpoints.mcp;
    readonly mcpConfigExample = `{
    "mcpServers": {
        "hunter": {
            "url": "${apiEndpoints.mcp}",
            "headers": {
                "Authorization": "Bearer <your-token>"
            }
        }
    }
}`;

    apiTokens: Array<ApiToken> = [];
    tokensFetched = false;
    tokenName = '';
    tokenExpiryDays: number | null = null;
    createdToken = '';
    popups = {
        revokeToken: { show: false, token: null as ApiToken | null },
    };

    constructor(
        private routeService: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private userService: UserDataService,
        private apiTokensService: ApiTokensService,
        private snackBar: MatSnackBar,
        private titleService: Title
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

                this.titleService.setTitle(
                    `${
                        (this.user_profile.name || 'Anonymous') +
                        '#' +
                        this.user_profile_id +
                        ' on Hunter'
                    }`
                );

                this.editable = this.user.id === this.user_profile_id;
            },
            error: (err) => {
                this.loading--;
            },
        });
    }

    getTotalSubmissions(questions: any) {
        let totalSub = 0;

        questions?.forEach((ques: any) => {
            totalSub = totalSub + ques._count.results;
        });

        return totalSub;
    }

    ngOnInit(): void {
        if (window.location.hash === '#settings') {
            this.selectedTabIndex = 1;
        }

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
                        this.editable = this.user.id === this.user_profile_id;
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

    onTabChange(event: MatTabChangeEvent) {
        // Settings tab. Tokens are fetched lazily, only for the owner.
        if (event.index === 1) {
            this.fetchTokens();
        }
        history.replaceState(
            null,
            '',
            window.location.pathname +
                window.location.search +
                (event.index === 1 ? '#settings' : ''),
        );
    }

    fetchTokens(force = false) {
        if (this.tokensFetched && !force) {
            return;
        }

        this.loading++;
        this.apiTokensService.fetchTokens().subscribe({
            next: (res) => {
                this.apiTokens = res.body || [];
                this.tokensFetched = true;
                this.loading--;
            },
            error: () => {
                this.loading--;
            },
        });
    }

    createToken() {
        const name = this.tokenName.trim();

        if (!name) {
            return;
        }

        this.loading++;
        this.apiTokensService
            .createToken({
                name,
                expires_in_days: this.tokenExpiryDays || undefined,
            })
            .subscribe({
                next: (res) => {
                    this.loading--;
                    this.createdToken = res.body?.token || '';
                    this.tokenName = '';
                    this.tokenExpiryDays = null;
                    this.fetchTokens(true);
                    this.snackBar.open(
                        'Token created. Copy it now, it is shown only once'
                    );
                },
                error: () => {
                    this.loading--;
                    this.snackBar.open('Could not create the token');
                },
            });
    }

    askRevokeToken(token: ApiToken) {
        this.popups.revokeToken = { show: true, token };
    }

    revokeToken(token: ApiToken) {
        this.loading++;
        this.apiTokensService.revokeToken(token.id).subscribe({
            next: () => {
                this.loading--;
                token.revoked_at = new Date().toISOString();
                this.snackBar.open('Token revoked');
            },
            error: () => {
                this.loading--;
                this.snackBar.open('Could not revoke the token');
            },
        });
    }

    copyToken() {
        navigator.clipboard
            .writeText(this.createdToken)
            .then(() => this.snackBar.open('Token copied'));
    }

    copyMcpConfig() {
        navigator.clipboard
            .writeText(this.mcpConfigExample)
            .then(() => this.snackBar.open('Config copied'));
    }

    isTokenExpired(token: ApiToken) {
        return !!token.expires_at && new Date(token.expires_at) < new Date();
    }

    updateEmailPref(enabled: boolean) {
        if (enabled) {
            this.user.email_updates_disabled_at = null;
        } else {
            this.user.email_updates_disabled_at = new Date();
        }
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
                email_updates_disabled_at: this.user.email_updates_disabled_at,
            })
            .subscribe((res) => {
                this.loading--;
                this.snackBar.open('Profile updated');
            });
    }
}
