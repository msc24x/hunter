import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent implements OnInit {

  @Input()
  persist = false

  constructor() { }

  ngOnInit(): void {
  }

  hideSelf(event : Event){
    let self = event.target as HTMLElement
    self = self.parentElement || self
    self.style.display = "none"
  }

}
