import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-bar',
  templateUrl: './app-bar.component.html',
  styleUrls: ['./app-bar.component.scss']
})
export class AppBarComponent implements OnInit {

  @Input()
  showRegisterBtn : boolean = true

  constructor() { }

  ngOnInit(): void {
    const navBar = document.getElementById("navBarCompact") as HTMLElement;

    navBar.style.display = "none"
  }

  toggleNavBar(){
    const navBar = document.getElementById("navBarCompact") as HTMLElement;
    if(navBar.style.display == "none"){
      navBar.style.display = "initial"
    }else{
      navBar.style.display = "none"
    }
  }

}
