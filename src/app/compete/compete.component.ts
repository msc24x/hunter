import { Component, OnInit } from '@angular/core';

export class Question{
  constructor(
    public title : string,
    public description : string,
    public value : number
  ){}

}

export class Competition{
  constructor(
    public id : number,
    public title : string,
    public about : string,
    public dateCreated : number,
    public duration : number,
    public questions : Array<Question>,
    public isPublic : Boolean
  ){}

}

@Component({
  selector: 'compete',
  templateUrl: './compete.component.html',
  styleUrls: ['./compete.component.scss']
})
export class CompeteComponent implements OnInit {

  public coms : Competition[];

  constructor() {
    const comp = new Competition(
      45,
      "Downtown kabbadi competition",
      "Wrestling is a combat sport involving grappling-type techniques such as clinch fighting, throws and takedowns, joint locks, pins and other grappling holds. ... A wrestling bout is a physical competition, between two (sometimes more) competitors or sparring partners, who attempt to gain and maintain a superior position.",
      545481,
      45454,
      [new Question("dfsf","fdsdf", 545)],
       true
    );

    this.coms = [comp, comp, comp, comp, comp, comp, comp, comp, comp];
    console.log(this.coms[0].questions);
  }

  ngOnInit(): void {
  }

}
