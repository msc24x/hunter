import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CompetitionsDataService } from 'src/app/services/data/competitions-data.service';
import { resCode } from 'src/environments/environment';

@Component({
  selector: 'create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.scss']
})
export class CreateDialogComponent implements OnInit {

  @Output()
  backgroundClick = new EventEmitter()

  responseMessage : string = ""

  constructor(
    private authService : AuthService,
    private router : Router,
    private competitionsData : CompetitionsDataService
  ) { }

  ngOnInit(): void {
  }

  hideSelf(event : Event){
     if((event.target as HTMLInputElement).id == "dialog_box")
      this.backgroundClick.emit()
  }

  requestCreateCompetition(){
    const title = (document.getElementById("competition_title") as HTMLInputElement).value;
    this.competitionsData.postCompetition(title)?.subscribe(res =>{
      console.log(res)
      this.handleResponse(res as HttpResponse<Object>)
    },
    err=>{
      this.handleResponse(err as HttpResponse<Object>)
    })

  }


  private handleResponse(res : HttpResponse<Object>){
    this.toggleSubmitButton(true);
    console.log(res.status)

    switch (res.status) {
      case resCode.serverErrror:
        this.responseMessage = "*Server side exception, please try again later";
        break;
      case resCode.forbidden:
        this.responseMessage = "*"+(res as unknown as HttpErrorResponse).error;
        break;
      case resCode.badRequest:
        this.responseMessage = "*Title not valid";
        break;
      case resCode.created:
        this.responseMessage = "*created successfully"
        this.router.navigate([`/editor/${(res.body as unknown as {id : number}).id}`])
        break;
      case resCode.accepted:
        break;
      default:
        this.responseMessage = "*Unknown error occurred"
        break;
    }
  }

  private toggleSubmitButton(enable : boolean){
    (document.getElementById("create_btn") as HTMLButtonElement).disabled = !enable;
  }

}
