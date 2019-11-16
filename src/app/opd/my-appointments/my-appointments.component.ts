import { Component, OnInit } from '@angular/core';
import { OpdService } from '../../core/services/opd/opd.service';
import { UtilityService } from '../../core/services/general/utility.service';
import { MappingService } from '../../core/services/mapping/mapping.service';
import { Appointment } from '../../core/models/appointment';

@Component({
    selector: 'my-appointments',
    templateUrl: './my-appointments.component.html',
    styleUrls: ['./my-appointments.component.css']
})
export class MyAppointmentsComponent implements OnInit {
    inputValue;
    startDate: Date;
    endDate: Date;
    patientLastName = '';
    patientFirstName = '';
    appointments: Appointment[] = [];
    appointmentsCount = 0;
    currentpage = 1;
    PageLength: number;
    PageLengthrange: number[];
    pageSize = 8;
    paginationdisplaybtn;
    paginationdisplay = 'none';
    visibilityLoginSpinner;
    visibilityLoginSpinnerdata;
    zeroResults;

    constructor(
        public _opdService: OpdService,
        public _utilityService: UtilityService,
        public _mappingService: MappingService
    ) {}

    ngOnInit() {
        this.getAppointments();
    }

    getAppointments() {
        this.appointments = [];

        this.visibilityLoginSpinner = 'table-cell';
        this.visibilityLoginSpinnerdata = 'none';
        const data = {
            to: this.endDate ? this.endDate.toUTCString() : null,
            from: this.startDate ? this.startDate.toUTCString() : null,
            mrn: null,
            patientLastName: this.patientLastName,
            patientFirstName: this.patientFirstName,
            pageIndex: this.currentpage - 1,
            pageSize: this.pageSize,
            isFilterOn: false
        };

        if (
            this.patientFirstName ||
            this.patientLastName ||
            (this.endDate && this.startDate)
        ) {
            data.isFilterOn = true;
        }

        this._opdService.getMyAppointmentsCount(data).subscribe(
            response => {
                this.visibilityLoginSpinner = 'none';
                this.visibilityLoginSpinnerdata = 'table-row';
                if (response.status === 200) {
                    if (response.json() != null) {
                        this.appointmentsCount = response.json();

                        if (this.appointmentsCount === 0) {
                            this.zeroResults = 'table-cell';
                        } else {
                            this.zeroResults = 'none';

                            this._opdService
                                .getMyAppointments(data)
                                .subscribe(res => {
                                    if (res.status === 200) {
                                        const resp = res.json();
                                        resp.forEach(element => {
                                            this.appointments.push(
                                                this._mappingService.mapAppointment(
                                                    element
                                                )
                                            );
                                        });
                                        this.appointments = res.json();
                                    }
                                });

                            this.PageLength = Math.ceil(
                                this.appointmentsCount / 8
                            );
                            this.PageLengthrange = this.createRange(
                                this.PageLength
                            );

                            if (this.appointmentsCount <= this.pageSize) {
                                this.paginationdisplaybtn = 'none';
                                this.paginationdisplay = 'none';
                            } else {
                                this.paginationdisplaybtn = 'block';
                                this.paginationdisplay = 'block';
                            }
                        }
                    }
                }
            },
            error => {
                this.visibilityLoginSpinner = 'none';
                this.visibilityLoginSpinnerdata = 'table-row';
            }
        );
    }

    filter() {
        this.getAppointments();
    }

    onStartDateFocusOut() {
        if (this.startDate && this.endDate) {
            if (
                this._utilityService.dateDifferenceInDays(
                    this.startDate,
                    this.endDate
                ) < 0
            ) {
                this.endDate = null;
            } else {
                this.getAppointments();
            }
        }
    }
    onEndDateFocusOut() {
        if (this.startDate && this.endDate) {
            if (
                this._utilityService.dateDifferenceInDays(
                    this.startDate,
                    this.endDate
                ) < 0
            ) {
                this.endDate = null;
            } else {
                this.getAppointments();
            }
        }
    }
    pagNum(val) {
        if (val !== 'P' && val !== 'N') {
            this.currentpage = val;
            this.getAppointments();
        } else if (val === 'P') {
            if (this.currentpage !== 1) {
                this.currentpage--;
                this.getAppointments();
            } else {
                this.getAppointments();
            }
        } else if (val === 'N') {
            if (this.currentpage < this.PageLength) {
                this.currentpage++;
                this.getAppointments();
            } else {
                this.getAppointments();
            }
        }
    }

    createRange(number) {
        const items: number[] = [];
        for (let i = 1; i <= number; i++) {
            items.push(i);
        }
        return items;
    }
}
