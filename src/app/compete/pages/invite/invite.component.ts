import { LocationStrategy } from '@angular/common';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import {
    CompetitionInfo,
    CompetitionInvite,
    UserInfo,
} from 'src/environments/environment';

@Component({
    selector: 'invite',
    templateUrl: './invite.component.html',
    styleUrls: ['./invite.component.scss'],
})
export class InviteComponent {
    loading = 0;
    c_id = -1;
    invite_id = '';

    inviteIcon = faEnvelopeOpenText;

    isAuthenticated: boolean = false;
    user = {} as UserInfo;
    invite: CompetitionInvite | null = null;

    routerSubsc: Subscription | null = null;
    subscriptions: Subscription[] = [];

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private router: Router,
        private competitionsService: CompetitionsDataService,
        private scoresDataService: ScoresDataService,
        private titleService: Title,
        private snackBar: MatSnackBar,
        private location: LocationStrategy
    ) {
        const inviteId = this.route.snapshot.paramMap.get('invite_id') || '';

        if (inviteId) {
            this.invite_id = inviteId;
        } else {
            this.router.navigate(['/404']);
        }

        titleService.setTitle('Invitation - Hunter');

        this.user = this.authService.user;
        this.isAuthenticated = this.authService.isAuthenticated.value;
    }

    ngOnInit(): void {
        if (this.isAuthenticated) {
            this.fetchInvite();

            return;
        }

        this.loading++;
        this.subscriptions.push(
            this.authService.authenticate_credentials().subscribe({
                next: (res) => {
                    this.loading--;

                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.isAuthenticated = true;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);

                        this.fetchInvite();
                    }
                },
                error: (err) => {
                    this.loading--;
                },
            })
        );
    }

    ngOnDestroy() {
        this.unsubscribeAll();
        this.routerSubsc?.unsubscribe();
    }

    acceptInvite() {
        this.loading++;
        this.competitionsService
            .acceptInvite({ invite: this.invite_id })
            .subscribe({
                next: (res) => {
                    this.router.navigate([
                        `/compete/p/${this.invite!.competition_id}`,
                    ]);
                },
                error: (err) => {
                    this.loading--;
                    this.snackBar.open('Something went wrong');
                },
            });
    }

    fetchInvite() {
        this.loading++;
        this.competitionsService
            .getInvite({ invite: this.invite_id })
            .subscribe({
                next: (res) => {
                    this.invite = res.body!;
                    this.loading--;
                },
                error: (err) => {
                    this.router.navigate(['/404']);
                },
            });
    }

    unsubscribeAll() {
        this.routerSubsc?.unsubscribe();
        this.routerSubsc = this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                let sub = this.subscriptions.pop();
                while (sub) {
                    sub.unsubscribe();
                    sub = this.subscriptions.pop();
                }
            }
        });
    }
}
