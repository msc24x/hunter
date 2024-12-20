import { Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { resCode, UserInfo } from 'src/environments/environment';
import { isLive } from '../../utils/utils';
import { UserDataService } from 'src/app/services/user-data/user-data.service';

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
