import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Router } from 'express';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CommunitiesDataService } from 'src/app/services/communities-data/communities-data.service';
import { Community, UserInfo } from 'src/environments/environment';

@Component({
    selector: 'communities-list',
    templateUrl: './communities-list.component.html',
    styleUrls: ['./communities-list.component.scss'],
})
export class CommunitiesListComponent {
    @Input({ required: true })
    communities: Array<Community> = [];

    getUrl(url?: string) {
        if (!url?.startsWith('http')) {
            url = 'https://' + url;
        }

        return url;
    }

    openUrl(url?: string) {
        window.open(this.getUrl(url), '_blank');
    }
}
