import { Component, Input, OnInit } from '@angular/core';
import { CompetitionInfo } from 'server/src/environments/environment';
import { convert } from 'src/app/utils/utils';
import { UserInfoPipe } from 'src/app/pipes/userInfoPipe';

@Component({
  selector: 'competitions-list',
  templateUrl: './competitions-list.component.html',
  styleUrls: ['./competitions-list.component.scss']
})
export class CompetitionsListComponent implements OnInit {

  @Input()
  competitionsList : Array<CompetitionInfo> | null = null

  @Input()
  heading : string = "Competitions"

  @Input()
  route : string = "editor"

  constructor() { }

  isAfterNow(date: string){
    return Date.parse(date) < Date.now()
  }

  isLive(date : string, duration : number){
    let parsedDate = Date.parse(date)
    return Date.now() > parsedDate && ((Date.now() < parsedDate + duration * 60 * 1000) || (duration == 0))
  }

  ngOnInit(): void {
  }

}
