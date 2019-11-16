import {
    OnInit,
    Component,
    Input,
    Inject,
    OnDestroy
} from '../../../../node_modules/@angular/core';
import { ElementRegistry } from '../../../dynamic-forms-fw/services/element-registry';
import { UiContainerComponent } from '../../../dynamic-forms-fw/components/ui-container/ui-container.component';
import { InputFieldComponent } from '../../../dynamic-forms-fw/components/input-field/input-field.component';
import { TextFieldComponent } from '../../../dynamic-forms-fw/components/text-field/text-field.component';
import { TextareaFieldComponent } from '../../../dynamic-forms-fw/components/textarea-field/textarea-field.component';
import { RadiobuttonFieldComponent } from '../../../dynamic-forms-fw/components/radiobutton-field/radiobutton-field.component';
import { CheckboxFieldComponent } from '../../../dynamic-forms-fw/components/checkbox-field/checkbox-field.component';
import { DropdownFieldComponent } from '../../../dynamic-forms-fw/components/dropdown-field/dropdown-field.component';
import { Section } from '../../../dynamic-forms-fw/models/section';
import { ClinicalNotesService } from '../../core/services/clinical-notes/clinical.notes.service';
import { YesNoRadioFieldComponent } from '../../../dynamic-forms-fw/components/yesno-radio-field/yesnoradio-field.component';
import { MalihuScrollbarService } from 'ngx-malihu-scrollbar';
import { LabelComponent } from '../../../dynamic-forms-fw/components/label/label.component';
import {
    PatientInfoService,
    PatientInfo
} from '../../core/services/specialist/patientinfo.service';
import { UIService } from '../../core/services/ui/ui.service';
import { Message } from '../../core/models/message';
import { SignalRService } from '../../core/services/signalr/signalr.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Rx';
import { MatDialog, MatOptionSelectionChange } from '@angular/material';
import { MsgDialog } from '../../shared/msgbox/msgdialog.component';

import {
    RadiologyService,
    RadiologyRequests
} from './../../core/services/radiology/radiology.service';
import { Init } from 'twilsock/lib/protocol/messages';
import { OpdService } from '../../core/services/opd/opd.service';
import { SimplePdfViewerComponent } from '../../simplePdfViewer/simplePdfViewer.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth/auth.service';
@Component({
    selector: 'dynamic-notes',
    templateUrl: './dynamic.notes.component.html',
    styleUrls: ['./dynamic.notes.component.css']
})
export class DynamicNotesComponent implements OnInit, OnDestroy {
    @Input() data = Input();
    requestrefresh;
    requestrefreshsubscribe: ISubscription;
    panel;
    clinicalNoteId: number;
    sections: Section[];
    selectedSection: Section;
    encounterType;
    showloader = false;
    /**
     *get instance of control registry
     */
    //header
    heartRate;
    bloodPressuretop;
    bloodPressurebottom;
    temperature;
    o2Saturation;
    handedness;

    specialityId: any = 0;
    // videoLoader="none";
    patientInfo: PatientInfo = new PatientInfo();
    matselected: any = '1';
    signbtn = true;

    specialistRequestId;
    formSpecialityId;
    endpointId;

    modalitySubtype = [];
    selectedModalitySubtype;

    encounters = [
        '99251 - Inpatient Consult-1 (non-medicare 20 mins)',
        '99252-  Inpatient Consult-2 (non-medicare 40 mins) ',
        '99253 - Inpatient Consult-3 (non-medicare 55 mins)',
        '99254 - Inpatient Consult-4 (non-medicare 80 mins)',
        '99255 - Inpatient Consult-5 (non-medicare 110 mins)',
        'Addendum'
    ];
    appointmentId: any;

    constructor(
        public dialog: MatDialog,
        private _radiologyService: RadiologyService,
        private _signalRService: SignalRService,
        private mScrollbarService: MalihuScrollbarService,
        private _registry: ElementRegistry,
        private _notesService: ClinicalNotesService,
        private _uiServices: UIService,
        private _route: ActivatedRoute,
        private _patientinfoservice: PatientInfoService,
        private _opdService: OpdService,
        private _authServices: AuthService,

    ) { }

    setpatintinfo(specialistRequestId) {
        if (this.appointmentId) {
            this._opdService
                .GetPatientInfo(this.appointmentId)
                .subscribe(res => {
                    const tempInfo = res.json();
                    console.log('tempInfo', tempInfo);
                    this.patientInfo = new PatientInfo();
                    this.patientInfo.dob = new Date(tempInfo.dob + 'Z');
                    this.patientInfo.bottomBloodPressure =
                        tempInfo.patientTriage.bottomBloodPressure;
                    this.patientInfo.facilityName = sessionStorage.getItem(
                        'facilityName'
                    );
                    this.patientInfo.firstName = tempInfo.patientFirstName;
                    this.patientInfo.gender = tempInfo.sex;
                    this.patientInfo.heartRate =
                        tempInfo.patientTriage.heartRate;
                    this.patientInfo.lastName = tempInfo.patientLastName;
                    this.patientInfo.mrn = tempInfo.mrn;
                    this.patientInfo.temperature =
                        tempInfo.patientTriage.temperature;
                    this.patientInfo.topBloodPressure =
                        tempInfo.patientTriage.topBloodPressure;
                    this.patientInfo.specialityId = tempInfo.specialityId;
                });
        } else {
            this._patientinfoservice
                .getpatientInfo(specialistRequestId)
                .subscribe(
                    patientinfo => {
                        let data = JSON.parse(patientinfo._body);
                        this.patientInfo = data;
                    },
                    err => { }
                );
        }
    }

    encounterTypeChange(val) {
        this.save(true);
    }

    signConfirmation() {
        let title = this.data.isRadiologySession
            ? 'After signing the reports, you will not be able to change them. Do you want to continue ?'
            : 'After signing the notes, you will not be able to change them. Do you want to continue ?';
        let message = '';

        let ref = this.dialog.open(MsgDialog, {
            width: '400px',
            //panelClass: 'custom-dialog-container2',
            data: {
                title: title,
                message: message
            }
        });
        ref.afterClosed().subscribe(result => {
            if (result) {
                if (this.data.isRadiologySession) {
                    this.signRadiologyButton();
                } else {
                    this.signButton();
                }
            } else {
            }
        });
    }
    viewPdf() {
        console.log("viewPdf");
        let token = this._authServices.getToken();
        let url = environment.apiBaseUrl + "clinicalnote/pdf/";
        var fileURL = url + this.specialistRequestId + "?token=" + token;
        // window.open(fileURL);
        const dialogRef = this.dialog.open(SimplePdfViewerComponent, {
            height: '75vh',
            minWidth: '800px',
            panelClass: 'custom-dialog-container',
            data: fileURL
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');

        });

    }
    signButton() {
        // this.goback();
        this.save(true);
        this.signbtn = true;
        // this.selectedSection.form.disable();
        this._signalRService.hubConnection // (string endPointId)
            .invoke(
                'ClinicalNotesSigned',
                this.specialistRequestId,
                this.endpointId
            )
            .then(res => {
                this.signbtn = true;
                let msg = new Message();
                msg.msg = 'Notes signed successfully';
                msg.type = 'success';
                msg.iconType = 'check_circle';
                this._uiServices.showToast(msg);
            })
            .catch(err => {
                console.error(err);
                this.signbtn = false;
                let msg = new Message();
                msg.msg = 'Failed to sign notes';
                msg.type = 'error';
                msg.iconType = 'check_circle';
                this._uiServices.showToast(msg);
            });
    }

    signRadiologyButton() {
        this.save(true);
        this.signbtn = true;
        this._radiologyService
            .setRadiologyAction(
                this.data.specialistRequestId,
                'Signed',
                this.selectedModalitySubtype
            )
            .subscribe(
                response => {
                    if (response.status == 200) {
                        this.signbtn = true;
                        let msg = new Message();
                        msg.msg = 'Reports signed successfully';
                        msg.type = 'success';
                        msg.iconType = 'check_circle';
                        this._uiServices.showToast(msg);
                    }
                },
                error => {
                    console.error(error);
                    this.signbtn = false;
                    let msg = new Message();
                    msg.msg = 'Failed to sign reports';
                    msg.type = 'error';
                    msg.iconType = 'check_circle';
                    this._uiServices.showToast(msg);
                }
            );
    }

    ngOnDestroy() {
        this.requestrefreshsubscribe.unsubscribe();
    }

    modalitySubtypeChange(val) {
        this.showloader = true;
        this._notesService
            .getRadiologySections(this.specialistRequestId, val)
            .subscribe(
                res => {
                    let note = JSON.parse(res._body);

                    if (note.isSigned) {
                        this.signbtn = true;
                    } else {
                        this.signbtn = false;
                    }

                    if (note.encounterType) {
                        this.encounterType = note.encounterType;
                    } else {
                        this.encounterType = this.encounters[0];
                    }

                    this.clinicalNoteId = note.id;
                    this.sections = note.sections;
                    if (this.sections && this.sections.length > 0)
                        this.selectedSection = this.sections[0];
                    this.selectedSection.specialistRequestId = this.specialistRequestId;
                    this.selectedSection.specialityId = this.formSpecialityId;

                    setTimeout(() => {
                        this.showloader = false;
                    }, 1000);
                },
                err => {
                    this.showloader = false;
                }
            );
    }
    ngOnInit(): void {
        // let specialistRequestId;
        // let specialityId;
        // this.selectedSection.form
        //if (this.data.isRadiologySession)
        this._notesService.behaviorSubjectUiElement.subscribe(val => {
            console.log("behaviorSubjectUiElement subscribe 1");

            // if (
            //     this.selectedSection.form &&
            //     this.selectedSection.form.dirty &&
            //     !this.signbtn
            // ) {
            // this.changeSection(null);
            this.changeSection(this.selectedSection);
            // let temp;
            // this.showloader = true;
            // this.selectedSection.form.markAsPristine();
            // this.save(true);
            // temp = this.selectedSection;
            // this.selectedSection = null;
            // this.selectedSection = temp;
            // this.selectedSection.specialistRequestId = this.specialistRequestId;
            // this.selectedSection.specialityId = this.formSpecialityId;
            //  }


        });
        this.requestrefresh = Observable.interval(3000);
        this.requestrefreshsubscribe = this.requestrefresh.subscribe(ex => {
            if (
                this.selectedSection.form &&
                this.selectedSection.form.dirty &&
                !this.signbtn
            ) {
                this.selectedSection.form.markAsPristine();
                this.save(true);

            }

            //this.selectedSection = section;

        });

        if (this.data) {
            this.formSpecialityId = this.data.specialityId;
            this.specialistRequestId = this.data.specialistRequestId;
            this.appointmentId = this.data.appointmentId;
            // this._patientinfoservice.getSpecialistRequestId();
            this.endpointId = sessionStorage.getItem('endPointId');
            if (this.data.isRadiologySession) {
                this._radiologyService
                    .getSubTypeByModalityType(this.data.type)
                    .subscribe(
                        res => {
                            this.modalitySubtype = JSON.parse(res._body);
                            setTimeout(() => {
                                this.selectedModalitySubtype = parseInt(
                                    sessionStorage.getItem('modalitySubTypeId')
                                );
                                if (this.selectedModalitySubtype != 0)
                                    this.modalitySubtypeChange(
                                        this.selectedModalitySubtype
                                    );
                            }, 5000);
                        },
                        err => { }
                    );
                // this._radiologyService.getRadiologySignedRequests(this.specialistRequestId).subscribe(
                //     (res) => {
                //         let data = JSON.parse(res._body);

                //         this.modalitySubtype = [{
                //             id:'00',
                //             name: data['clinicalNote']['name'],
                //         }];

                //         this.selectedModalitySubtype = '00';

                //         let note = JSON.parse(res._body)['clinicalNote'];

                //         // if (note.isSigned) {
                //             this.signbtn = true;
                //         // } else {
                //         //     this.signbtn = false;
                //         // }

                //         if (note.encounterType) {
                //             this.encounterType = note.encounterType;
                //         } else {
                //             this.encounterType = this.encounters[0];
                //         }

                //         this.clinicalNoteId = note.id
                //         this.sections = note.sections;
                //         if (this.sections && this.sections.length > 0)
                //             this.selectedSection = this.sections[0];
                //         this.selectedSection.specialistRequestId = this.specialistRequestId;
                //         this.selectedSection.specialityId = this.formSpecialityId;
                //     },
                //     (err) => {
                //         this._radiologyService.getSubTypeByModalityType(this.data.type).subscribe(
                //             (res) => {
                //                 this.modalitySubtype = JSON.parse(res._body);
                //                 this.selectedModalitySubtype = 0;
                //             },
                //             (err) => { }
                //         );
                //     }
                // )
            }
        }

        this._route.params.subscribe(
            params => {
                if (params['sid']) {
                    this.formSpecialityId = params['sid'];
                    this.specialistRequestId = params['srid'];
                    this.endpointId = params['eid'];
                }

                this._registry.register('container', UiContainerComponent);
                this._registry.register('inputField', InputFieldComponent);
                this._registry.register('textField', TextFieldComponent);
                this._registry.register(
                    'textAreaField',
                    TextareaFieldComponent
                );
                this._registry.register(
                    'radioButtonField',
                    RadiobuttonFieldComponent
                );
                this._registry.register(
                    'checkBoxField',
                    CheckboxFieldComponent
                );
                this._registry.register(
                    'dropDownField',
                    DropdownFieldComponent
                );
                this._registry.register(
                    'yesNoRadioField',
                    YesNoRadioFieldComponent
                );
                this._registry.register('label', LabelComponent);

                this.setpatintinfo(this.specialistRequestId);
                if (!this.data.isRadiologySession) {
                    this._notesService
                        .getSections(
                            this.formSpecialityId,
                            this.specialistRequestId
                        )
                        .subscribe(
                            res => {
                                let note = JSON.parse(res._body);

                                if (note.isSigned) {
                                    this.signbtn = true;
                                } else {
                                    this.signbtn = false;
                                }

                                if (note.encounterType) {
                                    this.encounterType = note.encounterType;
                                } else {
                                    this.encounterType = this.encounters[0];
                                }

                                this.clinicalNoteId = note.id;
                                this.sections = note.sections;
                                if (this.sections && this.sections.length > 0)
                                    this.selectedSection = this.sections[0];
                                this.selectedSection.specialistRequestId = this.specialistRequestId;
                                this.selectedSection.specialityId = this.formSpecialityId;
                            },
                            err => { }
                        );
                }
            },
            err => { }
        );
    }

    save(autosave: boolean) {
        this._notesService
            .saveSectionValues(
                this.specialistRequestId,
                this.clinicalNoteId,
                this.encounterType,
                false,
                this.selectedSection.id,
                this.selectedSection.form.value,
                this.formSpecialityId
            )
            .subscribe(
                res => {
                    if (!autosave) {
                        let msg = new Message();
                        msg.msg = this.data.isRadiologySession
                            ? 'Reports saved successfully'
                            : 'Notes saved successfully';
                        msg.type = 'success';
                        msg.iconType = 'check_circle';
                        this._uiServices.showToast(msg);
                    }
                },
                err => {
                    this.selectedSection.form.markAsDirty();
                    console.error(err);
                }
            );
    }
    sectionDataReceived($event) {
        this.showloader = false;
    }

    changeSection(section: Section) {
        if (this.selectedSection != section) {
            this.showloader = true;
            if (this.selectedSection.form.dirty) {
                if (!this.signbtn) {
                    this.save(true);
                }
            }
            this.selectedSection = section;
            this.selectedSection.specialistRequestId = this.specialistRequestId;
            this.selectedSection.specialityId = this.formSpecialityId;
        } else {

        }
    }

    isSelected(section: Section): string {
        return section === this.selectedSection ? 'selected' : '';
    }

    scroltop() {
        this.mScrollbarService.scrollTo('#inercontainer', 'top', {
            scrollInertia: 1
        });
    }

    ngAfterViewInit() {
        this.mScrollbarService.initScrollbar('#sidebar', {
            axis: 'y',
            theme: 'dark'
        });
        this.mScrollbarService.initScrollbar('#inercontainer', {
            axis: 'y',
            theme: 'dark'
        });
    }
}

