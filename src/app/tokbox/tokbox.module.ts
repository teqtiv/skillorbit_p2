import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TokboxComponent } from './tokbox.component';
import { MaterialModule } from '../material/material.module';
import { DynamicNotesModule } from '../dyanmic-notes/dynamic.notes.module';
import { PacsModule } from '../pacs/pacs.module';
import { PublisherComponent } from './publisher/publisher.component';
import { SubscriberComponent } from './subscriber/subscriber.component';
import { OpentokService } from '../core/services/Opentok/Opentok.service';
import { SurveyComponent } from './survey/survey.component';
import { LabReportsModule } from '../lab-reports/lab-reports.module';
import { LabReportsComponent } from '../lab-reports/lab-reports.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicNotesModule,
    PacsModule,
    MatIconModule,
    LabReportsModule
  ],
  declarations: [
    TokboxComponent,
    PublisherComponent,
    SubscriberComponent,
    SurveyComponent
  ],
  providers: [OpentokService]
})
export class TokboxModule {}
