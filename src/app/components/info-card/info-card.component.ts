import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  hideSelf(){
    let self = document.getElementById("card") as HTMLElement
    self.style.display = "none"
  }

}
