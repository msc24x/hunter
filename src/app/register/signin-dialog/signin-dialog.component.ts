import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'signin-dialog',
  templateUrl: './signin-dialog.component.html',
  styleUrls: ['./signin-dialog.component.scss']
})
export class SigninDialogComponent implements OnInit {

  registerResponseMessage : string = "";

  constructor(private authService : AuthService) { }

  ngOnInit(): void {
  }

  sendRegisterReq(){
    const email = (document.getElementsByClassName("textbox")[0] as HTMLInputElement).value;
    const password = (document.getElementsByClassName("textbox")[1] as HTMLInputElement).value;

    if(this.isEmail(email) && (password.length >= 6 && password.length <= 16)){

      this.toggleSubmitButton(false);

      this.authService.register(email, password).subscribe((res)=>{
        this.handleResponse(res);
      },
      err=>{
        this.handleResponse(err)
      })
    }
    else{
      this.registerResponseMessage = "*Either email or password (6 to 16 characters) is unacceptable";
    }
  }


  private isEmail(email:string){
    if(email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
      return true;
    }
    else{
      return false;
    }
  }


  private handleResponse(res : HttpResponse<Object>){
    this.toggleSubmitButton(true);

    switch (res.status) {
      case 503:
        this.registerResponseMessage = "*Server side exception, please try again later";
        break;
      case 403:
        this.registerResponseMessage = "*"+(res as unknown as HttpErrorResponse).error;
        break;
      case 406:
        this.registerResponseMessage = "*Either email or password is incorrect";
        break;
      case 201:
        this.registerResponseMessage = "*Registered successfully"
        break;
      default:
        this.registerResponseMessage = "*Unknown error occurred"
        break;
    }
  }

  private toggleSubmitButton(enable : boolean){
    (document.getElementById("register_btn") as HTMLButtonElement).disabled = !enable;
  }



}
