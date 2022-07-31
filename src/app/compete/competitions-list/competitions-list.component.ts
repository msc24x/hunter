import { Component, Input, OnInit } from '@angular/core';
import { CompetitionInfo } from 'server/src/environments/environment';

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

  ngOnInit(): void {
  }

}
