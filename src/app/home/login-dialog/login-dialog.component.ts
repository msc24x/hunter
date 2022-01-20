import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent implements OnInit {

  loginResponse : string = ""

  constructor(private authService : AuthService) { }

  ngOnInit(): void {
  }

  sendLoginRequest(){
    const email = (document.getElementsByClassName("textbox")[0] as HTMLInputElement).value;
    const password = (document.getElementsByClassName("textbox")[1] as HTMLInputElement).value;
    const remember = (document.getElementById("keep_logged_check") as HTMLInputElement).checked;

    if(this.isEmail(email) && (password.length >= 6 && password.length <= 16)){

      this.toggleSubmitButton(false);

      this.authService.authenticate(email, password, remember).subscribe((res)=>{
        this.handleResponse(res);
      },
      err=>{
        this.handleResponse(err)
      })
    }
    else{
      this.loginResponse = "*Either email or password (6 to 16 characters) is unacceptable";
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

  toggleKeepLoggedIn() {
    const keepLoggedCheck = document.getElementById("keep_logged_check") as HTMLInputElement;
    if(keepLoggedCheck.checked == true){
      keepLoggedCheck.checked = false;
    }
    else{
      keepLoggedCheck.checked = true;
    }
  }

  private handleResponse(res : HttpResponse<Object>){
    this.toggleSubmitButton(true);

    switch (res.status) {
      case 503:
        this.loginResponse = "*Server side exception, please try again later";
        break;
      case 403:
        this.loginResponse = "*"+(res as unknown as HttpErrorResponse).error;
        break;
      case 406:
        this.loginResponse = "*Either email or password is incorrect";
        break;
      case 201:
        this.loginResponse = "*Registered successfully"
        break;
      case 202:
        this.loginResponse = "*Authenticated successfully"
        break;
      default:
        this.loginResponse = "*Unknown error occurred"
        break;
    }
  }

  private toggleSubmitButton(enable : boolean){
    (document.getElementById("login_btn") as HTMLButtonElement).disabled = !enable;
  }



}
