import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss']
})
export class TextInputComponent implements OnInit {

  @Input()
  title : string = "Input"

  @Output()
  onChangeEvent = new EventEmitter<string>()

  constructor() { }

  ngOnInit(): void {
  }

  emitChange(){
    let target = document.getElementById(this.title) as HTMLInputElement
    this.onChangeEvent.emit(target.value)
  }

  truncateInput(){
    let elem = document.getElementById(this.title) as HTMLInputElement
    console.log(elem)
    elem.value = ""
  }

}
