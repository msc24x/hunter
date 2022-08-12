import { Component, Input, OnInit } from '@angular/core';
import { CompetitionInfo } from 'server/src/environments/environment';
import { convert } from 'src/app/utils/utils';
import { UserInfoPipe } from 'src/app/pipes/userInfoPipe';
import { CompetitionsDataService } from 'src/app/services/data/competitions-data.service';

@Component({
  selector: 'competitions-list',
  templateUrl: './competitions-list.component.html',
  styleUrls: ['./competitions-list.component.scss']
})
export class CompetitionsListComponent implements OnInit {

  @Input()
  competitionsList : Array<CompetitionInfo> | null = null

  @Input()
  host_user_id = ""

  @Input()
  heading : string = "Competitions"

  @Input()
  route : string = "editor"

  title = ""
  liveStatus = "all"
  orderBy : "any" | "latest" | "oldest" = "latest"

  orderByCode = {"any" : 0, "latest" : -1, "oldest" : 1}

  constructor(private competitionsDataService : CompetitionsDataService) { }

  isAfterNow(date: string){
    return Date.parse(date) < Date.now()
  }

  isLive(date : string, duration : number){
    let parsedDate = Date.parse(date)
    return Date.now() > parsedDate && ((Date.now() < parsedDate + duration * 60 * 1000) || (duration == 0))
  }

  ngOnInit(): void {
  }

  updateLiveStatus(event : Event){
    let select = event.target as HTMLSelectElement
    this.liveStatus = select.value
    this.updateList()
  }

  updateOrderBy(event : Event){
    let select = event.target as HTMLSelectElement
    this.orderBy = select.value as "any" | "latest" | "oldest"
    this.updateList()
  }

  updateList(){
    console.log({
      title : this.title,
      dateOrder : this.orderByCode[this.orderBy],
      liveStatus : this.liveStatus,
      host_user_id : this.host_user_id
    })
    this.competitionsDataService.getPublicCompetitions({
      title : this.title,
      dateOrder : this.orderByCode[this.orderBy],
      liveStatus : this.liveStatus,
      host_user_id : this.host_user_id+""
    }).subscribe(res=>{
      this.competitionsList = res.body
    })
  }

}
