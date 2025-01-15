import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { faRankingStar } from '@fortawesome/free-solid-svg-icons';
import { CompetitionInfo } from 'backend/src/config/types';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { ScoresMeta, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'app-insights',
    templateUrl: './insights.component.html',
    styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent {
    rankIcon = faRankingStar;
    competition_id: number = -1;
    scoreMeta: ScoresMeta = null;

    loading = false;

    isAuthenticated: boolean = false;
    user = {} as UserInfo;

    @Input({ required: true })
    competitionInfo!: CompetitionInfo;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthService,
        private competitionsData: CompetitionsDataService,
        private datePipe: DatePipe,
        private titleService: Title,
        private snackBar: MatSnackBar
    ) {
        titleService.setTitle('Build • Hunter');

        this.competition_id = parseInt(
            this.activatedRoute.snapshot.paramMap.get('competition_id') || ''
        );

        this.authService.isAuthenticated.subscribe((isAuth) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;
        });
    }

    ngOnDestroy(): void {
        document
            .getElementsByTagName('bottom-app-bar')[0]
            .classList.remove('hidden');

        window.onbeforeunload = null;
    }

    ngOnInit(): void {
        window.scroll(0, 0);

        if (!this.isAuthenticated) {
            this.loading = true;
            this.authService.authenticate_credentials().subscribe(
                (res) => {
                    if (res.status == 202) {
                        const body = res.body as UserInfo;
                        this.user = body;
                        this.authService.user = this.user;
                        this.authService.isAuthenticated.next(true);
                        this.loading = false;
                        this.fetchQuestions();
                    }
                },
                (err) => {
                    this.loading = false;
                    this.router.navigate(['/home']);
                }
            );
        } else {
            this.fetchQuestions();
        }
    }

    fetchQuestions() {
        this.loading = true;
        this.competitionsData
            .getQuestions({ competition_id: this.competition_id })
            .subscribe((res) => {
                if (res.body) {
                    this.competitionInfo = res.body as CompetitionInfo;
                    this.loading = false;

                    this.titleService.setTitle(
                        `Insights • ${
                            this.competitionInfo.title || 'Competition'
                        }`
                    );
                }
            });
    }
}
