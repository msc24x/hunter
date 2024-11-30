import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isLive, showPopup } from 'src/app/utils/utils';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { UserDataService } from 'src/app/services/user-data/user-data.service';
import { Title } from '@angular/platform-browser';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import {
    faGear,
    faGlobe,
    faLink,
    faPen,
} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'editor-menu',
    templateUrl: './editor-menu.component.html',
    styleUrls: ['./editor-menu.component.scss'],
})
export class EditorMenuComponent implements OnInit {
    loading = 0;

    githubIcon = faGithub;
    linkedinIcon = faLinkedin;
    webIcon = faLink;
    penIcon = faGear;

    isAuthenticated: boolean = false;
    user = {
        id: 0,
        email: '',
        name: '',
    } as UserInfo;

    userCompetitions: Array<CompetitionInfo> | null = null;
    competitionsMetaData = {
        total: 0,
        live: 0,
        public: 0,
    };

    constructor(
        private authService: AuthService,
        private competitionsDataService: CompetitionsDataService,
        private userDataService: UserDataService,
        private router: Router,
        private titleService: Title
    ) {
        this.titleService.setTitle('Workbench • Hunter');

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;

            if (this.user) {
                this.titleService.setTitle(
                    `${
                        this.user?.name ? this.user.name + ' • ' : ''
                    }Workbench • Hunter`
                );
            }
        });
    }
    showEditProfileForm(f: boolean) {
        showPopup(f, 'edit_profile_popup');
    }

    calculateCompetitionsMetaData() {
        let data = {
            total: 0,
            live: 0,
            public: 0,
        };

        if (this.userCompetitions == null) {
            this.competitionsMetaData = data;
            return;
        }

        data.total = this.userCompetitions?.length || 0;

        for (let competition of this.userCompetitions) {
            if (
                isLive(competition.scheduled_at, competition.scheduled_end_at)
            ) {
                data.live += 1;
            }
            if (competition.public) {
                data.public += 1;
            }
        }

        this.competitionsMetaData = data;
        return;
    }

    updateUserInfo() {
        const getElemVal = (key: string) => {
            const elem = document.getElementById(key) as HTMLInputElement;

            return elem.value;
        };

        this.user.name = getElemVal('user_name_input');
        this.user.blog_url = getElemVal('user_blog_input');
        this.user.linkedin_url = getElemVal('user_linkedin_input');

        this.loading += 1;

        this.userDataService
            .updateUserInfo({
                id: this.user.id,
                name: this.user.name,
                blog_url: this.user.blog_url,
                linkedin_url: this.user.linkedin_url,
                email: this.user.email,
            })
            .subscribe((res) => {
                this.loading -= 1;
            });
    }

    ngOnInit(): void {
        const fetchData = () => {
            this.loading += 1;
            // fetch user's all created competitions
            this.competitionsDataService
                .getCompetitions({
                    includeSelf: true,
                    orderBy: 'desc',
                })
                .then((res) => {
                    this.userCompetitions = res;
                    this.calculateCompetitionsMetaData();
                    this.loading -= 1;
                });
        };

        if (!this.isAuthenticated) {
            this.authService.authenticate_credentials().subscribe({
                next: (res) => {
                    if (res.status == 202) {
                        // save user info
                        this.user = res.body as UserInfo;

                        // save user info for all components subscribed to the service
                        this.authService.user = this.user;
                        this.isAuthenticated = true;
                        this.authService.isAuthenticated.next(true);
                        fetchData();
                    }
                },
                error: (err) => {
                    this.router.navigate(['/home']);
                },
            });
        } else {
            fetchData();
        }
    }
}
