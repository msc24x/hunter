export class Sanitizer {
    static isEmail(val: string) {
        if (
            val
                .toLowerCase()
                .match(
                    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                )?.length != 0
        ) {
            return true;
        } else return false;
    }
}
