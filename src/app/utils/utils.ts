export class convert{
  static zuluToUTC(zString : string) : string{
    let utc = new Date(zString)
    return utc.toUTCString()
  }
}
