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

    @Input()
    competition_id: number = 0;

    interval10s;

    constructor(private scoresDataService: ScoresDataService) {
        this.interval10s = setInterval(() => {
            scoresDataService
                .getScoresAll({ comp_id: this.competition_id })
                .subscribe((res) => {
                    this.scores = res.body as Array<result>;
                });
        }, 1000 * 60);
    }

    ngOnInit(): void {
        this.scoresDataService
            .getScoresAll({ comp_id: this.competition_id })
            .subscribe((res) => {
                this.scores = res.body as Array<result>;
            });
    }

    ngOnDestroy(): void {
        clearInterval(this.interval10s);
    }
}
