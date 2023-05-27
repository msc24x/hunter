import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import katex from 'katex';

@Component({
  selector: 'ng-katex',
  templateUrl: './ng-katex.component.html',
  styleUrls: ['./ng-katex.component.scss']
})
export class NgKatexComponent implements OnInit {
  @Input()
  data: string = ""

  private native: HTMLElement

  constructor(private ref: ElementRef) {
    this.native = ref.nativeElement as HTMLElement
  }

  parse_segments(data: string) {
    return data.match(/((\\\$)|[^\$])+/gi);
  }
  
  render(data: string, plain=false) {
    let elem = document.createElement("span") as HTMLSpanElement
    let paragraph = this.native.firstElementChild!

    
    if (!plain) {
      katex.render(
        data,
        elem,
        {
          throwOnError: false,
          output : "mathml"
        }
      )
    } else {
      elem.innerText = data
    }

    paragraph.appendChild(elem)

  }

  ngOnInit(): void {
    this.data = this.data.trim()
    const segments = this.parse_segments(this.data)

    if (!segments)
      return
    
    let plain = !this.data.startsWith("$");

    for (let seg of segments) {
      this.render(seg, plain=plain)
      plain = !plain
    }
    
  }
}
