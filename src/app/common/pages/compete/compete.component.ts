import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../../../services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';

@Component({
    selector: 'compete',
    templateUrl: './compete.component.html',
    styleUrls: ['./compete.component.scss'],
})
export class CompeteComponent implements OnInit {
    loading = 0;

    isAuthenticated: boolean = false;
    user = {
        id: 0,
        email: '',
        name: '',
    };

    publicCompetitions: Array<CompetitionInfo> | null = null;
    invitedCompetitions: Array<CompetitionInfo> | null = null;

    constructor(
        private authService: AuthService,
        private competitionsDataService: CompetitionsDataService,
        private router: Router
    ) {
        this.authService.isAuthenticated.subscribe((isAuth: boolean) => {
            this.user = this.authService.user;
            this.isAuthenticated = isAuth;

            this.loading++;
            this.competitionsDataService
                .getCompetitions({ title: '', dateOrder: '-1', public: true })
                .then((res) => {
                    this.publicCompetitions = res;
                    this.loading--;
                });

            this.loading++;
            this.competitionsDataService
                .getCompetitions({ title: '', dateOrder: '-1', invited: true })
                .then((res) => {
                    this.invitedCompetitions = res;
                    this.loading--;
                });
        });
    }

    ngOnInit(): void {
        if (this.isAuthenticated) {
            return;
        }

        this.authService.authenticate_credentials().subscribe({
            next: (res) => {
                if (res.status == 202) {
                    this.user = res.body as UserInfo;

                    this.authService.user = this.user;
                    this.isAuthenticated = true;
                    this.authService.isAuthenticated.next(true);
                }
            },
        });
    }

    routeToCompetition() {
        this.loading++;
        const id = document.getElementById(
            'competition_id_text'
        ) as HTMLInputElement;
        this.router.navigate(['/compete/p/' + id.valueAsNumber]);
    }
}
