import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import * as ace from 'ace-builds';
import { CompetitionInfo, UserInfo } from 'src/environments/environment';
import { AuthService } from '../services/auth/auth.service';
import { CompetitionsDataService } from '../services/data/competitions-data.service';
@Component({
  selector: 'competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss']
})
export class CompetitionComponent implements OnInit {

  c_id : string = "";
  editor!: ace.Ace.Editor;

  isAuthenticated : boolean = false
  user = {} as UserInfo
  competition = {} as CompetitionInfo


  constructor(
    private route : ActivatedRoute,
    private authService : AuthService,
    private router : Router,
    private competitionsService : CompetitionsDataService
  ) {
    const idParam = route.snapshot.paramMap.get("competition_id");
    if(idParam){
      this.c_id = idParam;
    }

    this.authService.isAuthenticated.subscribe(isAuth=>{
      this.user = this.authService.user
      this.isAuthenticated = isAuth;

    })

  }


  ngOnInit(): void {
    this.initEditor()

    this.authService.authenticate_credentials().subscribe(res=>{
      if(res.status == 202){
        const body = res.body as UserInfo
        this.user = body
        this.authService.user = this.user
        this.authService.isAuthenticated.next(true)
        this.competitionsService.getCompetitionInfo(this.c_id).subscribe(res=>{
          this.competition = res.body as CompetitionInfo
        })
      }
    },
    err=>{
      this.router.navigate(["/home"])
    })
  }


  initEditor(){
    this.editor = ace.edit("editor")
    ace.config.set("basePath", "https://unpkg.com/ace-builds@1.4.12/src-noconflict")
    /**
     * twilight
     * monokai
     * terminal
     */
    this.editor.setTheme("ace/theme/twilight")
    this.editor.session.setMode("ace/mode/python")
  }

}
