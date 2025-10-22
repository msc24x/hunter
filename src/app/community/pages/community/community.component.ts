import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CommunitiesDataService } from 'src/app/services/communities-data/communities-data.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import {
    Community,
    CommunityMember,
    UserInfo,
} from 'src/environments/environment';

@Component({
    selector: 'community',
    templateUrl: './community.component.html',
    styleUrls: ['./community.component.scss'],
})
export class CommunityComponent implements OnInit, OnDestroy {
    isAuthenticated = false;
    user: UserInfo | null = null;
    loading = 0;

    community: Community | null = null;
    memberships: Array<CommunityMember> = [];
    pendingRequests: Array<CommunityMember> = [];

    constructor(
        private authService: AuthService,
        private communityService: CommunitiesDataService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private datePipe: DatePipe,
        private titleService: Title,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loading--;

        this.authService.authenticate_credentials().subscribe({
            next: (res) => {
                if (res.status == 202) {
                    this.user = res.body as UserInfo;
                    this.loading++;

                    this.authService.user = this.user;
                    this.isAuthenticated = true;
                    this.authService.isAuthenticated.next(true);
                    this.loadPageData();
                }
            },
        });
    }

    ngOnDestroy(): void {}

    loadPageData() {
        let id =
            this.activatedRoute.snapshot.paramMap.get('community_id') || '';

        if (!id) {
            this.router.navigate(['/compete']);
            return;
        }
        this.loading--;
        this.communityService.fetchCommunity({ id: id }).subscribe((res) => {
            this.community = res.body as Community;
            this.loading++;

            if (this.community.admin_user_id === this.user?.id) {
                this.loading--;
                this.communityService
                    .fetchPendingMembershipRequests({
                        community_id: this.community.id,
                    })
                    .subscribe({
                        next: (res) => {
                            this.pendingRequests =
                                res.body as Array<CommunityMember>;
                            this.loading++;
                        },
                    });
            }
        });

        this.loading--;
        this.communityService
            .fetchCommunityMemberships({ community_id: id })
            .subscribe((res) => {
                this.memberships = res.body as Array<CommunityMember>;
                this.loading++;
            });
    }

    getUrl(url?: string) {
        if (!url?.startsWith('http')) {
            url = 'https://' + url;
        }

        return url;
    }

    openUrl(url?: string) {
        window.open(this.getUrl(url), '_blank');
    }

    isApprovedMember() {
        for (let mem of this.memberships) {
            if (mem.status === 'APPROVED') {
                return true;
            }
        }
        return false;
    }

    requestSent() {
        for (let mem of this.memberships) {
            if (['PENDING_APPROVAL', 'NOT_APPROVED'].includes(mem.status)) {
                return true;
            }
        }
        return false;
    }

    sendJoinRequest() {
        this.loading--;
        this.communityService
            .requestCommunityMembership({
                community_id: this.community!.id,
            })
            .subscribe({
                next: (res) => {
                    this.memberships.push(res.body as CommunityMember);
                    this.snackBar.open('Request sent!');
                    this.loading++;
                },
                error: (error) => {
                    this.loading++;
                    this.snackBar.open(error.body);
                },
            });
    }
}
