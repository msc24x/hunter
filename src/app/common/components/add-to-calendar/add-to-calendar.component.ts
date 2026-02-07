import { Component, Input } from '@angular/core';
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faCalendar, faCalendarPlus } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-add-to-calendar',
    templateUrl: './add-to-calendar.component.html',
    styleUrls: ['./add-to-calendar.component.scss'],
})
export class AddToCalendarComponent {
    calendarIcon = faCalendar;
    googleIcon = faGoogle;
    appleIcon = faApple;
    calendarPlusIcon = faCalendarPlus;

    isDropdownOpen = false;

    @Input({ required: true })
    eventTitle!: string;

    @Input()
    startDate?: Date | null;

    @Input()
    endDate?: Date | null;

    @Input()
    description?: string;

    @Input()
    link?: string;

    @Input()
    location?: string = 'Online';

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    closeDropdown(): void {
        this.isDropdownOpen = false;
    }

    private formatDateTimeForCalendar(date: Date | null | undefined): string {
        if (!date) {
            return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}${month}${day}T${hours}${minutes}00`;
    }

    private getEventDates() {
        if (!this.startDate) {
            return { startDateTime: '', endDateTime: '' };
        }

        const startDateTime = this.formatDateTimeForCalendar(this.startDate);
        const endDateTime = this.endDate
            ? this.formatDateTimeForCalendar(this.endDate)
            : this.formatDateTimeForCalendar(this.startDate);

        return { startDateTime, endDateTime };
    }

    addToGoogle(): void {
        const { startDateTime, endDateTime } = this.getEventDates();
        const eventDescription = this.buildEventDescription();
        const eventLocation = encodeURIComponent(this.location || 'Online');

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            this.eventTitle,
        )}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(eventDescription)}&location=${eventLocation}`;

        window.open(googleCalendarUrl, '_blank');
        this.closeDropdown();
    }

    addToOutlook(): void {
        const { startDateTime, endDateTime } = this.getEventDates();
        const eventBody = this.buildEventDescription();
        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
            this.eventTitle,
        )}&startdt=${startDateTime}&enddt=${endDateTime}&body=${encodeURIComponent(
            eventBody,
        )}&location=${encodeURIComponent(this.location || 'Online')}`;

        window.open(outlookUrl, '_blank');
        this.closeDropdown();
    }

    addToApple(): void {
        this.downloadICS();
    }

    downloadICS(): void {
        const { startDateTime, endDateTime } = this.getEventDates();
        const eventDescription = this.buildEventDescription();

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Hunter//Hunter Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@hunter.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${this.eventTitle}
DESCRIPTION:${eventDescription}
LOCATION:${this.location || 'Online'}
END:VEVENT
END:VCALENDAR`;

        const element = document.createElement('a');
        element.setAttribute(
            'href',
            'data:text/calendar;charset=utf-8,' +
                encodeURIComponent(icsContent),
        );
        element.setAttribute(
            'download',
            `${this.eventTitle.replace(/\s+/g, '_')}.ics`,
        );
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.closeDropdown();
    }

    private buildEventDescription(): string {
        const parts: string[] = [];

        if (this.description) {
            parts.push(this.description);
        }

        if (this.link) {
            parts.push(`Link: ${this.link}`);
        }

        return parts.join('\n');
    }
}
