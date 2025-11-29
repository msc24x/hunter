import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    faRemove,
    faStar,
    faUserSlash,
} from '@fortawesome/free-solid-svg-icons';
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
    approvedMembers: Array<CommunityMember> = [];

    starIcon = faStar;
    removeIcon = faUserSlash;

    selectedCommunitiesTab: number = 0;

    popups: {
        removeMember: { show: boolean; member: CommunityMember | null };
    } = {
        removeMember: {
            show: false,
            member: null,
        },
    };

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

                    this.authService.user = this.user;
                    this.isAuthenticated = true;
                    this.authService.isAuthenticated.next(true);
                }
            },
            error: () => {
                this.loading++;
            },
            complete: () => {
                this.loading++;
            },
        });
        this.loadPageData();
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

            this.titleService.setTitle(
                `${this.community.name || 'Community'} - Hunter`
            );

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
            .subscribe({
                next: (res) => {
                    this.memberships = res.body as Array<CommunityMember>;
                    this.loading++;
                },
                error: () => this.loading++,
            });
    }

    fetchApprovedMembers() {
        if (this.approvedMembers.length) {
            return;
        }

        this.loading--;
        this.communityService
            .fetchApprovedMembershipRequests({
                community_id: this.community!.id,
            })
            .subscribe({
                next: (res) => {
                    this.approvedMembers = res.body as Array<CommunityMember>;
                    this.loading++;
                },
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

                    if (this.community?.auto_approve_members) {
                        this.snackBar.open('Joined!');
                    } else {
                        this.snackBar.open('Request sent!');
                    }

                    this.loading++;
                },
                error: (error) => {
                    this.loading++;
                    this.snackBar.open(error.error);
                },
            });
    }

    leaveCommunity() {
        this.loading--;
        this.communityService
            .leaveCommunity({ community_id: this.community!.id })
            .subscribe({
                next: () => {
                    this.memberships = [];
                    this.snackBar.open('You have left the community.');
                    this.loading++;
                },
                error: (err) => {
                    this.loading++;
                    const msg =
                        (err && err.error) || 'Failed to leave community.';
                    this.snackBar.open(msg);
                },
            });
    }

    updateMember(
        members: CommunityMember[],
        operation: 'accept' | 'reject' | 'disable',
        kwargs?: { callback?: () => void }
    ) {
        this.loading--;

        this.communityService
            .updateCommunityMembership({
                community_id: this.community?.id!,
                members: members,
                operation: operation,
            })
            .subscribe((res) => {
                this.loading++;

                let mem_ids = members.map((m) => m.id);

                this.pendingRequests = this.pendingRequests.filter(
                    (r) => !mem_ids.includes(r.id)
                );

                let message = {
                    'accept': 'Accepted the request',
                    'reject': 'Rejected the request',
                    'disable': 'Member removed',
                };

                this.snackBar.open(message[operation]);

                kwargs?.callback?.();
            });
    }

    saveSettings() {
        this.loading--;
        this.communityService
            .updateCommunity({
                community: this.community!,
            })
            .subscribe({
                next: (res) => {
                    this.loading++;
                    this.snackBar.open('Community settings updated.');
                },
                error: (err) => {
                    this.loading++;
                    const msg =
                        (err && err.error) ||
                        'Failed to update community settings.';
                    this.snackBar.open(msg);
                },
            });
    }

    uiOnPanelTabChange(ev: MatTabChangeEvent) {
        if (ev.index !== 1) {
            return;
        }

        this.fetchApprovedMembers();
    }

    removeMember(ask: boolean = true, member: CommunityMember) {
        if (this.loading) {
            return;
        }

        if (ask) {
            this.popups.removeMember.show = true;
            this.popups.removeMember.member = member;
            return;
        }

        this.updateMember([member], 'disable', {
            callback: () => {
                this.approvedMembers = [];
                this.fetchApprovedMembers();
            },
        });
    }
}
