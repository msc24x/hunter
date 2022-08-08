import { Pipe, PipeTransform } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { UserInfo } from "src/environments/environment";
import { UserDataService } from "../services/data/user-data.service";

@Pipe({
    name : "userInfoPipe"
})
export class UserInfoPipe implements PipeTransform{

    constructor(private userDataService : UserDataService){

    }

    transform(value: any, ...args: any[]) {
        let userName  = new BehaviorSubject<string>("")
        this.userDataService.getUser(value)
        .subscribe(res=>{
            let user = res.body as UserInfo
            if(!user.name)
                user.name = user.email
            if(args[0] == "noId"){
                userName.next(user.name)
            }
            else{
                userName.next(user.name + `(${user.id})`)
            }
        })
        return userName.asObservable()
    }
}