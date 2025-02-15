import { Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { resCode, UserInfo } from 'src/environments/environment';
import { isLive } from '../../utils/utils';
import { UserDataService } from 'src/app/services/user-data/user-data.service';
import { DatePipe } from '@angular/common';

@Pipe({
    name: 'userInfoPipe',
})
export class UserInfoPipe implements PipeTransform {
    constructor(private userDataService: UserDataService) {}

    transform(value: any, ...args: any[]) {
        let userName = new BehaviorSubject<string>('');
        this.userDataService.getUser(value).subscribe({
            next: (res) => {
                let user = res.body as UserInfo;
                if (!user.name) user.name = user.email;
                if (args[0] == 'noId') {
                    userName.next(user.name);
                } else {
                    userName.next(user.name + `(${user.id})`);
                }
            },
            error: (err) => {
                if (err.status == resCode.notFound)
                    userName.next('deleted user');
            },
        });
        return userName.asObservable();
    }
}

@Pipe({
    name: 'isLiveStatusPipe',
})
export class IsLiveStatusPipe implements PipeTransform {
    transform(value: Date | null, ...args: any[]) {
        return isLive(value, args[0]);
    }
}

@Pipe({
    name: 'prettyDate',
})
export class PrettyDate implements PipeTransform {
    transform(
        value: Date | string | undefined | null,
        format?: string
    ): string {
        if (!value) {
            return '';
        }

        format = format || "yyyy MMM dd 'at' hh:mm aa";
        let date = new Date(value);
        let dateNow = new Date();
        let dateString = new DatePipe('en-US').transform(date, format) || '';

        dateString = dateString
            .replace(dateNow.getFullYear().toString(), '')
            .trim();

        return dateString;
    }
}

@Pipe({
    name: 'timeAgo',
})
export class TimeAgo implements PipeTransform {
    transform(
        value: Date | string | undefined | null,
        future?: boolean
    ): string {
        if (!value) {
            return '';
        }

        var date: number;

        if (typeof value === 'string') {
            var date = Date.parse(value);
        } else {
            date = value.valueOf();
        }

        const now = Date.now();
        var diff: number = 0;

        if (future) {
            diff = date - now;
        } else {
            diff = now - date;
        }

        const seconds = Math.round(diff / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        const weeks = Math.round(days / 7);

        if (seconds < 60) {
            return seconds === 1
                ? '1 second ago'
                : `${seconds || 'a few'} seconds ago`;
        } else if (minutes < 60) {
            return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        } else if (hours < 24) {
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (days < 7) {
            return days === 1 ? '1 day ago' : `${days} days ago`;
        } else {
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        }
    }
}
