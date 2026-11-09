import { Component, Input, OnInit } from '@angular/core';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { ScoresDataService } from 'src/app/services/data/scores-data.service';
import { result, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit {
    trophyIcon = faTrophy;

    @Input()
    communityId: number | null = null;

    @Input()
    heading = 'Top 100';

    rows: Array<result> = [];
    loading = true;

    constructor(private scoresDataService: ScoresDataService) {}

    ngOnInit(): void {
        this.scoresDataService
            .getLeaderboard(this.communityId ?? undefined)
            .subscribe({
                next: (res) => {
                    this.loading = false;
                    this.rows = res.body!.rows;
                },
                error: () => {
                    this.loading = false;
                },
            });
    }

    medalColor(rank: number) {
        const rankColors = ['goldenrod', 'silver', 'rosybrown'];

        return rankColors[rank - 1];
    }

    medalBg(rank: number) {
        const rankBgs = [
            'rgba(218, 165, 32, 0.16)',
            'rgba(150, 150, 150, 0.18)',
            'rgba(188, 143, 143, 0.16)',
        ];

        return rankBgs[rank - 1];
    }

    uiUser(row: result): UserInfo {
        return {
            id: row.user_id,
            email: '',
            name: row.user_name,
            avatar_url: row.user_avatar_url || undefined,
        };
    }
}
