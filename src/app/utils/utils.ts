export class convert {
    static zuluToUTC(zString: string): string {
        let utc = new Date(zString);
        return utc.toUTCString();
    }
}

export function showPopup(f: boolean, id: string) {
    let elem = document.getElementById(id) as HTMLElement;
    if (f) {
        elem.style.display = 'block';
        window.scrollTo(0, 0);
    } else elem.style.display = 'none';
}

export function isLive(date: Date | null, endDate: Date | null) {
    let parsedDate = date?.getTime();
    return (
        (!parsedDate || Date.now() > parsedDate) &&
        (!endDate || (endDate && new Date() < endDate))
    );
}

export function format(str: string, ...args: (string | number)[]) {
    var res = str;
    for (var arg in args) {
        res = res.replace('{' + arg + '}', args[arg].toString());
    }
    return res;
}

export function prettyDuration(
    seconds: number,
    showSeconds = true,
    short = false
) {
    seconds = Math.floor(seconds);

    const minutes = Math.floor(seconds / 60);

    if (!minutes) return showSeconds ? `${seconds % 60} sec` : '0 min';

    const hours = Math.floor(minutes / 60);

    if (!hours)
        return (
            `${minutes % 60} min` + (showSeconds ? ` ${seconds % 60} sec` : '')
        );

    const days = Math.floor(hours / 24);

    if (!days) return `${hours % 24} hr ${minutes % 60} min`;

    const weeks = Math.floor(days / 7);

    if (!weeks) {
        if (short) {
            return `${days % 7} days ${hours % 24} hr`;
        } else {
            return `${days % 7} days ${hours % 24} hr ${minutes % 60} min`;
        }
    }

    const years = Math.floor(weeks / 52);

    if (!years) {
        if (short) {
            return `${weeks % 52} wk ${days % 7} days`;
        } else {
            return `${weeks % 52} weeks ${days % 7} days ${hours % 24} hr ${
                minutes % 60
            } min`;
        }
    }

    if (short) {
        return `${years} yr ${weeks % 52} wk`;
    } else {
        return `${years} yrs ${weeks % 52} weeks ${days % 7} days ${
            hours % 24
        } hr ${minutes % 60} min`;
    }
}
