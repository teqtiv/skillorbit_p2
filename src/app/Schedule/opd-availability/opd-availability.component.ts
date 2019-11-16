import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    OnDestroy
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CalendarEventAction } from 'angular-calendar';
import { startOfDay, addHours, setDay, addMinutes, getDay } from 'date-fns';
import { MatDialog } from '@angular/material';

import { OpdDialogueComponent } from './opd-dialogue/opd-dialogue.component';
import { SpecialistScheduleService } from '../../core/services/specialist/specialistschedule.service';
import { MappingService } from '../../core/services/mapping/mapping.service';
import { CalendarEventModel } from '../../core/models/calander.model';
import { Message } from '../../core/models/message';
import { UIService } from '../../core/services/ui/ui.service';

@Component({
    selector: 'opd-availability',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './opd-availability.component.html',
    styleUrls: ['./opd-availability.component.css']
})
export class OpdAvailabilityComponent implements OnInit, OnDestroy {
    viewDate: Date = new Date();
    calenderView = 'block';
    LoadingPage = 'none';
    LoadingPageload = 'none';
    actions: CalendarEventAction[] = [
        {
            label: '<i class="material-icons">delete_forever</i>',
            onClick: ({ event }: { event: CalendarEventModel }): void => {
                this.events = this.events.filter(iEvent => iEvent !== event);
                this.handleEvent('Deleted', event);
            }
        }
    ];

    events: CalendarEventModel[] = [];
    refresh: Subject<any> = new Subject();

    daysInWeek = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ];

    constructor(
        public dialog: MatDialog,
        private _specialistScheduleService: SpecialistScheduleService,
        private _mappingService: MappingService,
        private _uiService: UIService
    ) {}

    ngOnInit() {
        this.loadEvents();
    }

    private loadEvents() {
        this.calenderView = 'none';
        this.LoadingPage = 'block';
        this._specialistScheduleService.getMyAvailability().subscribe(resp => {
            const r = JSON.parse(resp._body);
            this.events = [];
            r.forEach(element => {
                let ev = this._mappingService.mapCalnderEvent(element);
                ev = this.configStartEnd(ev);
                this.events.push(ev);
            });
            this.refreshView();
        });
        this.calenderView = 'block';
        this.LoadingPage = 'none';
    }

    configStartEnd(ev: CalendarEventModel): CalendarEventModel {
        ev.start = addMinutes(
            addHours(
                startOfDay(
                    setDay(
                        new Date(),
                        this.daysInWeek.findIndex(day => day === ev.day)
                    )
                ),
                ev.start.getHours()
            ),
            ev.start.getMinutes()
        );
        ev.end = addMinutes(
            addHours(
                startOfDay(
                    setDay(
                        new Date(),
                        this.daysInWeek.findIndex(day => day === ev.day)
                    )
                ),
                ev.end.getHours()
            ),
            ev.end.getMinutes()
        );

        if (ev.end < ev.start) {
            ev.end = addHours(ev.end, 24);
        }

        ev.title =
            (ev.start.getHours() > 12
                ? ev.start.getHours() - 12
                : ev.start.getHours()
            ).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            }) +
            ':' +
            ev.start.getMinutes().toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            }) +
            ' To ' +
            (ev.end.getHours() > 12
                ? ev.end.getHours() - 12
                : ev.end.getHours()
            ).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            }) +
            ':' +
            ev.end.getMinutes().toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            });
        ev.actions = this.actions;
        return ev;
    }

    handleEvent(action: string, event: CalendarEventModel): void {
        console.log(action);
        console.log(event);
        // this.modal.open(this.modalContent, { size: 'lg' });
        if (action === 'Deleted') {
            event.isDeleted = true;
            this._specialistScheduleService
                .saveMyAvailability([event])
                .subscribe(
                    res => {
                        const success = new Message();
                        success.msg = 'Availability successfully deleted';
                        success.type = 'success';
                        success.iconType = 'done';
                        this._uiService.showToast(success);
                    },
                    err => {
                        const e = err._body;
                        const msg = new Message();
                        msg.msg = e;
                        msg.type = 'danger';
                        msg.iconType = 'error';
                        if (err.status === 401) {
                            msg.msg = 'Login session expired';
                        }
                        this._uiService.showToast(msg);
                    }
                );
        }
        if (action === 'Clicked') {
            this.addAvailability(event.start);
        }
    }

    openDialog(data) {
        const dialogRef = this.dialog.open(OpdDialogueComponent, {
            // height: '450px',
            width: '650px',
            maxWidth: '95vw !important',
            minWidth: '80vw !important',
            data: data
        });
        dialogRef.afterClosed().subscribe(result => {
            this.loadEvents();
        });
    }

    addAvailability(date: Date) {
        let filteredEvents: CalendarEventModel[];
        const dayOfWeek = getDay(date);
        filteredEvents = this.events.filter(
            event => event.day === this.daysInWeek[dayOfWeek]
        );
        const data = {
            events: filteredEvents,
            day: dayOfWeek
        };
        this.openDialog(data);
    }
    refreshView(): void {
        this.refresh.next();
    }

    ngOnDestroy(): void {
        this.dialog.closeAll();
    }
}
