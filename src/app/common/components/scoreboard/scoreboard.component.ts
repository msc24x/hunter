import {
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import { CompetitionInfo, result } from 'src/environments/environment';

@Component({
    selector: 'scoreboard',
    templateUrl: './scoreboard.component.html',
    styleUrls: ['./scoreboard.component.scss'],
})
export class ScoreboardComponent implements OnInit, OnChanges {
    faMedal = faMedal;
    scores: Array<result> = [];
    meta: {
        total: number;
        user_details: result | undefined;
    } | null = null;

    pages: Array<number> = [];
    loading = false;

    showSubmissionsListP = false;

    @Input()
    competitionInfo = {} as CompetitionInfo;

    @Input()
    question_list = false;

    questionSelected: number = -1;

    @Input()
    competition_id: number = 0;

    scoresApiInterval;

    constructor(private scoresDataService: ScoresDataService) {
        this.scoresApiInterval = setInterval(this.fetchScores, 1000 * 60);
    }

    ngOnInit(): void {
        this.fetchScores();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.fetchScores();
    }

    ngOnDestroy(): void {
        clearInterval(this.scoresApiInterval);
    }

    fetchPrevPage() {
        this.pages.pop();
        this.fetchScores();
    }

    fetchNextPage() {
        const lastAfter = this.pages[this.pages.length - 1] || 0;
        this.pages.push(lastAfter + 10);
        this.fetchScores();
    }

    fetchScores(question_id?: number) {
        this.scoresDataService
            .getScoresAll({
                comp_id: this.competition_id,
                ques_id: question_id,
                after: this.pages[this.pages.length - 1],
            })
            .subscribe((res) => {
                this.scores = res.body!.rows as Array<result>;
                this.meta = res.body!.meta;
            });
    }

    handleQuestionChange(newQuestionIndex: number) {
        const ques_id = this.competitionInfo.questions?.[newQuestionIndex]?.id;
        this.questionSelected = newQuestionIndex;

        this.fetchScores(ques_id);
    }

    calcAheadOf() {
        const aheadOfPerc =
            ((1 +
                this.meta!.total -
                (this.meta!.user_details?.user_rank || this.meta!.total)) /
                this.meta!.total) *
            100;

        return Math.round(aheadOfPerc);
    }

    uiShowUserRow() {
        return !this.scores.find(
            (sc) => sc.user_id === this.meta?.user_details?.user_id
        );
    }

    uiMedalColor(rank: number) {
        const rankColors = ['goldenrod', 'silver', 'rosybrown'];

        return rankColors[rank - 1];
    }

    showSubmissionList() {
        if (this.questionSelected === -1) {
            return;
        }
        this.showSubmissionsListP = true;
    }
}