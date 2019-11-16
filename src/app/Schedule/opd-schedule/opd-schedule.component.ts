import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ViewPeriod } from 'calendar-utils';
import { CalendarEventModel } from '../../core/models/calander.model';
import { Subject } from 'rxjs';
import { SpecialistScheduleService } from '../../core/services/specialist/specialistschedule.service';
import { MappingService } from '../../core/services/mapping/mapping.service';
import { addMinutes, addHours, startOfDay, setDay } from 'date-fns';

@Component({
    selector: 'opd-schedule',
    templateUrl: './opd-schedule.component.html',
    styleUrls: ['./opd-schedule.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpdScheduleComponent implements OnInit {
    viewDate: Date = new Date();
    calenderView = 'block';
    LoadingPage = 'none';
    LoadingPageload = 'none';
    viewPeriod: ViewPeriod;
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
        private _specialistScheduleService: SpecialistScheduleService,
        private _mappingService: MappingService
    ) {}

    ngOnInit() {
        this.loadEvents();
    }
    private loadEvents() {
        this.calenderView = 'none';
        this.LoadingPage = 'block';
        this._specialistScheduleService.getMySchedule().subscribe(resp => {
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
        return ev;
    }

    refreshView(): void {
        this.refresh.next();
    }
}
