import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { resCode } from 'src/app/services/auth/responseCodes';

@Component({
  selector: 'create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.scss']
})
export class CreateDialogComponent implements OnInit {

  @Output()
  backgroundClick = new EventEmitter()

  responseMessage : string = ""

  constructor(private authService : AuthService, private router : Router) { }

  ngOnInit(): void {
  }

  hideSelf(event : Event){
     if((event.target as HTMLInputElement).id == "dialog_box")
      this.backgroundClick.emit()
  }

  requestCreateCompetition(){
    const title = (document.getElementById("competition_title") as HTMLInputElement).value;
    this.authService.createCompetition(title)?.subscribe(res =>{
      console.log(res)
      this.handleResponse(res as HttpResponse<Object>)
    },
    err=>{
      this.handleResponse(err as HttpResponse<Object>)
    })

  }


  private handleResponse(res : HttpResponse<Object>){
    this.toggleSubmitButton(true);

    switch (res.status) {
      case this.authService.resCode.serverErrror:
        this.responseMessage = "*Server side exception, please try again later";
        break;
      case this.authService.resCode.forbidden:
        this.responseMessage = "*"+(res as unknown as HttpErrorResponse).error;
        break;
      case this.authService.resCode.badRequest:
        this.responseMessage = "*Title not valid";
        break;
      case this.authService.resCode.created:
        this.responseMessage = "*created successfully"
        this.router.navigate([`/editor/${(res as unknown as {status : number, id : number}).id}`])
        break;
      case this.authService.resCode.accepted:
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
