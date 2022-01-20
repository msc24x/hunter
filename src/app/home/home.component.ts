import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  fetched_email : string = ""

  constructor(private authService : AuthService) { }

  ngOnInit(): void {
    this.authService.authenticate_credentials().subscribe(res=>{
      console.log(res)
    })
  }

}
