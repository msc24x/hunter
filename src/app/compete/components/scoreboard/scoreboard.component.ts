import { Component, Input, OnInit } from '@angular/core';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import { result } from 'src/environments/environment';

@Component({
    selector: 'scoreboard',
    templateUrl: './scoreboard.component.html',
    styleUrls: ['./scoreboard.component.scss'],
})
export class ScoreboardComponent implements OnInit {
    scores: Array<result> = [];
    user_details: result | undefined;

    @Input()
    competition_id: number = 0;

    scoresApiInterval;

    constructor(private scoresDataService: ScoresDataService) {
        this.scoresApiInterval = setInterval(this.fetchScores, 1000 * 60);
    }

    ngOnInit(): void {
        this.fetchScores();
    }

    ngOnDestroy(): void {
        clearInterval(this.scoresApiInterval);
    }

    fetchScores() {
        this.scoresDataService
            .getScoresAll({ comp_id: this.competition_id })
            .subscribe((res) => {
                this.scores = res.body?.rows as Array<result>;
                this.user_details = res.body?.user_details;
            });
    }

    uiShowUserRow() {
        return !this.scores.find(
            (sc) => sc.user_id === this.user_details?.user_id
        );
    }
}
