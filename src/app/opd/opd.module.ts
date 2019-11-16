import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpdComponent } from './opd.component';
import { MyAppointmentsComponent } from './my-appointments/my-appointments.component';
import { MaterialModule } from '../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipelModule } from '../pipes/pipe.module';

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        PipelModule
    ],
    entryComponents: [],
    declarations: [OpdComponent, MyAppointmentsComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OpdModule {}
