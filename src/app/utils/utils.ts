export class convert{
  static zuluToUTC(zString : string) : string{
    let utc = new Date(zString)
    return utc.toUTCString()
  }
}

export function showPopup(f : boolean, id : string){
  let elem = document.getElementById(id) as HTMLElement
  if(f){
    elem.style.display = 'block'
    window.scrollTo(0, 0)
  }
  else
    elem.style.display = 'none'
}

export function isLive(date: string, duration: number) {
  let parsedDate = Date.parse(date);
  return (
    Date.now() > parsedDate &&
    (Date.now() < parsedDate + duration * 60 * 1000 || duration == 0)
  );
}
