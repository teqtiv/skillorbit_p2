import { Injectable } from "../../../../../node_modules/@angular/core";
import { HttpService } from "../base/http.service";
import { Observable } from "../../../../../node_modules/rxjs/Observable";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable()
export class ClinicalNotesService {

    /**
     *
     */
    behaviorSubjectUiElement = new Subject<String>();
    
    constructor(private _http: HttpService) {
    }

    getUnsignedNotes(): Observable<any> {
        return this._http.get(`specialist/session/unsigned`).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getSections(specialityId: number, specialistRequestId: number): Observable<any> {
        return this._http.get(`clinicalnote/${specialityId}/${specialistRequestId}`).catch((err, caught) => {
            return Observable.throw(err);
        });
    }
    getRadiologySections(radiologyRequestId, modalitySubTypeId): Observable<any> {
        return this._http.get(`clinicalnote/radiology/${modalitySubTypeId}/${radiologyRequestId}`).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getSectionElements(sectionId: number): Observable<any> {
        return this._http.get(`clinicalnote/section/${sectionId}`).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getSectionValues(specialistRequestId: number, sectionId: number, specialityId: number) {
        return this._http.get(`clinicalnote/section/values/${specialistRequestId}/${sectionId}/${specialityId}`)
            .catch((err, caught) => {
                return Observable.throw(err);
            });
    }

    getClinicalNotePdf(specialistRequestId: number) {
        return this._http.get(`clinicalnote/pdf/${specialistRequestId}`+`?token=737f61212c1beede43cea0ed4468a2c0658aa623a011170f2ca6187383d2ef79`)
            .catch((err, caught) => {
                return Observable.throw(err);
            });
    }

    saveSectionValues(specialistRequestId: number, clinicalNoteId: number,
        encounterType: string, isSigned: boolean, clinicalNoteSectionId: number,
        values: any, specialityId: any): Observable<any> {

        let valArray = []; //Object.entries(values);
        for (var key in values)
            valArray.push({ key: key, value: values[key] });

        let body = {
            specialistRequestId: specialistRequestId,
            clinicalNoteId: clinicalNoteId,
            encounterType: encounterType,
            isSigned: isSigned,
            clinicalNoteSectionId: clinicalNoteSectionId,
            values: valArray,
            specialityId: specialityId
        };



        return this._http.post('clinicalnote/section/save', body).catch((err, caught) => {
            return Observable.throw(err);
        });

    }
}