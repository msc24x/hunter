import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterOutlet } from '@angular/router';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/competitions-data/competitions-data.service';
import { resCode } from 'src/environments/environment';

@Component({
    selector: 'create-dialog',
    templateUrl: './create-dialog.component.html',
    styleUrls: ['./create-dialog.component.scss'],
})
export class CreateDialogComponent implements OnInit {
    loading = false;
    cubeIcon = faCube;

    practiceContest = false;

    responseMessage: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
        private competitionsData: CompetitionsDataService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.showCreateDialog(false);
    }

    dialogBoxClicked(event: any) {
        if (event.target.id == 'dialog_box') this.showCreateDialog(false);
    }

    requestCreateCompetition() {
        this.loading = true;
        const title = (
            document.getElementById('competition_title') as HTMLInputElement
        ).value;
        this.competitionsData
            .postCompetition({ title, practice: this.practiceContest })
            ?.subscribe(
                (res) => {
                    this.practiceContest = false;
                    this.router.navigate([
                        `/editor/${(res.body as unknown as { id: number }).id}`,
                    ]);
                },
                (err) => {
                    this.handleResponse(err as HttpErrorResponse);
                }
            );
    }

    private handleResponse(res: HttpErrorResponse) {
        this.toggleSubmitButton(true);
        this.loading = false;

        switch (res.status) {
            case resCode.badRequest:
                this.snackBar.open(res.error);
                break;
            default:
                this.snackBar.open(
                    'Unknown error occurred, please try again later'
                );
                break;
        }
    }

    showCreateDialog(show: boolean) {
        let createDialog = document.getElementById(
            'create_dialog_popup'
        ) as HTMLDivElement;
        if (show) {
            window.scroll(0, 0);
            createDialog.style.display = 'block';
        } else {
            createDialog.style.display = 'none';
        }
    }

    private toggleSubmitButton(enable: boolean) {
        (document.getElementById('create_btn') as HTMLButtonElement).disabled =
            !enable;
    }
}
