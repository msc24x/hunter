import { Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { resCode, UserInfo } from 'src/environments/environment';
import { isLive, prettyDuration } from '../../utils/utils';
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
    name: 'pluralize',
    pure: true,
})
export class PluralizePipe implements PipeTransform {
    transform(
        value: string | null,
        count: number,
        pluralOverride?: string
    ): string {
        if (!value) return '';

        if (count === 1) return value;

        if (pluralOverride) return pluralOverride;

        return this.defaultPlural(value);
    }

    private defaultPlural(word: string): string {
        // baby → babies
        if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
            return word.slice(0, -1) + 'ies';
        }

        // box → boxes, class → classes
        if (/(s|x|z|ch|sh)$/i.test(word)) {
            return word + 'es';
        }

        // default: car → cars
        return word + 's';
    }
}

@Pipe({
    name: 'prettyDate',
})
export class PrettyDate implements PipeTransform {
    transform(
        value: Date | string | undefined | null,
        format?: string,
        showDaytime?: boolean
    ): string {
        if (!value) {
            return '';
        }

        format = format || "yyyy MMM dd 'at' hh:mm aa";
        const date = new Date(value);
        const dateNow = new Date();
        let dateString = new DatePipe('en-US').transform(date, format) || '';

        dateString = dateString
            .replace(dateNow.getFullYear().toString(), '')
            .trim();

        if (showDaytime) {
            const daytime = this.getDaytimeLabel(date);
            if (daytime) {
                dateString = `${dateString}${daytime}`;
            }
        }

        return dateString;
    }

    private getDaytimeLabel(date: Date): string {
        const h = date.getHours();

        if (h >= 5 && h < 12) return ' (morning)'; // 5 AM – 11:59 AM
        if (h >= 12 && h < 17) return ' (afternoon)'; // 12 PM – 4:59 PM
        if (h >= 17 && h < 21) return ' (evening)'; // 5 PM – 8:59 PM
        if (h >= 21 || h < 5) return ' (night)'; // 9 PM – 4:59 AM

        return '';
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

@Pipe({
    name: 'prettyDuration',
})
export class PrettyDuration implements PipeTransform {
    transform(diff: number): string {
        if (!diff) {
            return '0 sec';
        }

        return prettyDuration(diff, true, true);
    }
}
