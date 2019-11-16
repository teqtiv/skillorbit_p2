import {
    Component,
    OnInit,
    Inject,
    ChangeDetectionStrategy
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CalendarEventModel } from '../../../core/models/calander.model';
import { StatusService } from '../../../core/services/user/status.service';
import { addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';
import { Message } from '../../../core/models/message';
import { UIService } from '../../../core/services/ui/ui.service';
import { SpecialistScheduleService } from '../../../core/services/specialist/specialistschedule.service';
import { MappingService } from '../../../core/services/mapping/mapping.service';

@Component({
    selector: 'app-opd-dialogue',
    templateUrl: './opd-dialogue.component.html',
    styleUrls: ['./opd-dialogue.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpdDialogueComponent implements OnInit {
    public scrollbarOptions = { axis: 'y', theme: 'minimal-dark' };

    hours: number[];
    minutes: number[];
    timeZone;
    timezoneoffset: number;
    hiddenLoader = true;
    hiddenSaveLoader = true;
    availabilitySlots = [];
    hiddenList = false;
    events: CalendarEventModel[];

    daysInWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];
    defaultZone = 1;
    constructor(
        public dialogRef: MatDialogRef<OpdDialogueComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _statusService: StatusService,
        private _uiService: UIService,
        private _specialistScheduleService: SpecialistScheduleService,
        private _mappingService: MappingService
    ) {
        this.events = data.events;
        this.addEvent();
        this.getTimezone();
    }

    ngOnInit() {
        // this.timeZone = 'Local';
        this.createTime();
    }
    private createTime() {
        this.hours = Array.from({ length: 24 }, (x, i) => i);
        this.minutes = Array.from({ length: 60 }, (x, i) => i);
    }

    getTimezone() {
        const d = new Date();
        let offset = d.getTimezoneOffset();

        this._statusService.getUserInfo().subscribe(
            response => {
                const getUser = this._mappingService.mapUser(response);
                if (getUser != null) {
                    console.log(getUser);
                    offset = offset + getUser.utcDSTOffset / 60;
                    this.timezoneoffset = offset;
                    this.timeZone = getUser.stateName;
                }
            },
            error => {}
        );
    }

    addEvent() {
        this.events.push(
            new CalendarEventModel(this.daysInWeek[this.data.day].toLowerCase())
        );
    }

    changeTimeZone() {
        switch (this.defaultZone) {
            case 1:
                this.events.forEach(ev => {
                    if (ev.start) {
                        ev.startTime.hours = ev.start.getHours();
                        ev.startTime.minutes = ev.start.getMinutes();
                    }
                    if (ev.end) {
                        ev.endTime.hours = ev.end.getHours();
                        ev.endTime.minutes = ev.end.getMinutes();
                    }
                });
                break;
            case 2:
                this.events.forEach(ev => {
                    // console.log(new Date(ev.start.toUTCString()));
                    if (ev.start) {
                        ev.startTime.hours = ev.start.getUTCHours();
                        ev.startTime.minutes = ev.start.getUTCMinutes();
                    }
                    if (ev.end) {
                        ev.endTime.hours = ev.end.getUTCHours();
                        ev.endTime.minutes = ev.end.getUTCMinutes();
                    }
                });
                break;
            case 3:
                this.events.forEach(ev => {
                    if (ev.start) {
                        const startTime = addMinutes(
                            ev.start,
                            this.timezoneoffset
                        );
                        ev.startTime.hours = startTime.getHours();
                        ev.startTime.minutes = startTime.getMinutes();
                    }
                    if (ev.end) {
                        const endTime = addMinutes(ev.end, this.timezoneoffset);
                        ev.endTime.hours = endTime.getHours();
                        ev.endTime.minutes = endTime.getMinutes();
                    }
                });
                break;

            default:
                break;
        }
    }

    changeStartTime(eventId: number) {
        let d = new Date();
        const localOffset = d.getTimezoneOffset();
        this.events.forEach(ev => {
            if (ev.id === eventId) {
                d = setHours(d, ev.startTime.hours);
                d = setMinutes(d, ev.startTime.minutes);
                switch (this.defaultZone) {
                    case 2:
                        d = addMinutes(d, localOffset * -1);
                        break;
                    case 3:
                        d = addMinutes(d, this.timezoneoffset * -1);
                        break;
                    default:
                        break;
                }
                ev.start = d;
                if (!ev.end) {
                    ev.end = startOfDay(new Date());
                }
            }
        });
    }

    changeEndTime(eventId: number) {
        let d = new Date();
        const localOffset = d.getTimezoneOffset();
        this.events.forEach(ev => {
            if (ev.id === eventId) {
                d = setHours(d, ev.endTime.hours);
                d = setMinutes(d, ev.endTime.minutes);
                switch (this.defaultZone) {
                    case 2:
                        d = addMinutes(d, localOffset * -1);
                        break;
                    case 3:
                        d = addMinutes(d, this.timezoneoffset * -1);
                        break;
                    default:
                        break;
                }
                ev.end = d;
                if (!ev.start) {
                    ev.start = startOfDay(new Date());
                }
            }
        });
    }

    close() {
        this.dialogRef.close();
    }

    save() {
        this.hiddenSaveLoader = false;
        let isValid = true;
        this.events.forEach(ev => {
            console.log(ev.start, ev.end, ev.start > ev.end);
            if (ev.start >= ev.end) {
                isValid = false;
                this.createToastMessage({
                    msg:
                        'Shift End time should be greater than Shift Start time.',
                    iconType: 'error',
                    type: 'danger'
                });
                return;
            }
        });
        if (!isValid) {
            this.hiddenSaveLoader = true;
            return;
        }
        this._specialistScheduleService
            .saveMyAvailability(this.events)
            .subscribe(
                res => {
                    this.dialogRef.close();
                    const success = new Message();
                    success.msg = 'Data successfully uploaded';
                    success.type = 'success';
                    success.iconType = 'done';
                    this._uiService.showToast(success);
                },
                err => {
                    const message = new Message();
                    message.msg = err._body;
                    message.type = 'danger';
                    message.iconType = 'error';
                    if (err.status === 401) {
                        message.msg = 'Login session expired';
                    }
                    this._uiService.showToast(message);
                    this.hiddenSaveLoader = true;
                }
            );
    }

    private createToastMessage(obj) {
        const message = new Message();
        message.msg = obj.msg;
        message.type = obj.type;
        message.iconType = obj.iconType;
        this._uiService.showToast(message);
    }
}
