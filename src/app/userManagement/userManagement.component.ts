import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UIService } from '../core/services/ui/ui.service';
import {
    FormGroup,
    FormControl,
    Validators,
    FormBuilder,
    AbstractControl
} from '@angular/forms';
import { Message } from '../core/models/message';
import { Specialist } from '../core/models/specialist.model';
import { User } from '../core/models/user';
import { AuthService } from '../core/services/auth/auth.service';
import { StatusService } from '../core/services/user/status.service';
import { PassChangeService } from '../core/services/user/pass-change.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SpecialistService } from '../core/services/specialist/specialist.service';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import { MatOptionSelectionChange } from '@angular/material';
import { GeoLocationService } from '../core/services/location/geo-location.service';
import { MatDialogRef, MatDialog } from '@angular/material';
@Component({
    selector: 'userManagement',
    moduleId: module.id,
    templateUrl: 'userManagement.component.html',
    styleUrls: ['userManagement.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
    public scrollbarOptions = { axis: 'y', theme: 'minimal-dark' };

    user: User = new User();
    userspecialist: Specialist = new Specialist();
    form;
    formupdate;
    passold;
    pass;
    passconfirm;
    passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[\w~@#$%^&*+=`|{}:;!.?\"()\[\]-]{8,20}$/;
    phonePattern = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    public mask = [
        '(',
        /[1-9]/,
        /\d/,
        /\d/,
        ')',
        ' ',
        /\d/,
        /\d/,
        /\d/,
        '-',
        /\d/,
        /\d/,
        /\d/,
        /\d/
    ];
    npiPattern = /^[0-9-A-Za-z]+$/;
    patternname = /^[A-Za-z,' ']+$/;
    Loadingpage = 'none';
    Loadininfogpage = 'none';
    Loadingbox = 'block';

    fullname;
    email;
    mobileNumber;
    address;
    address1;
    countryName;
    stateName;
    cityName;
    zipCode;

    physicianLicenseNumber;
    deaNumber;
    npiNumber;
    licensedStates;
    practiceGroup;
    timeZoneDescription;
    specialityName;
    inercontainer;
    inercontaineredit;

    isSpecialist = false;
    countries = null;
    states = null;
    cities = null;
    specialities = null;
    error = null;

    filteredCountries: Observable<string[]>;
    filteredStates: Observable<string[]>;
    filteredCities: Observable<string[]>;
    filteredSpecialist: Observable<string[]>;
    filteredSpeciality: Observable<string[]>;
    SelCountvalchange = '';
    SelStatevalchange = '';

    countryauto: boolean = false;
    stateauto: boolean = false;
    cityauto: boolean = false;
    licensedstateauto: boolean = false;
    specialityNameauto: boolean = false;

    multipleLicensedStates = [];
    licensedStatesaddremovelist = [];

    updatelicensestate: boolean = false;

    addressData;
    addressForm: boolean = true;

    constructor(
        private dialog: MatDialog,
        private _specialist: SpecialistService,
        private _geo: GeoLocationService,
        private _PassChangeService: PassChangeService,
        private _statusService: StatusService,
        private _uiServices: UIService,
        private _authServices: AuthService,
        private _router: Router,
        private _route: ActivatedRoute
    ) { }

    compareFn(p1, p2) {
        return p1 && p2 ? p1.id === p2.stateId : p1 === p2;
    }

    addressOnDataReceived(data) {
        this.addressForm = data.isFormValid;

        this.user.address = data.values.address;
        this.user.address1 = data.values.address1;
        this.user.cityName = data.values.cityName;
        this.user.countryName = data.values.countryName;
        this.user.stateId = data.values.stateId;
        this.user.zipCode = data.values.zipCode;
    }
    passwordMatcher = (
        control: AbstractControl
    ): { [key: string]: boolean } => {
        const passold = control.get('passold');
        const pass = control.get('pass');
        const passconfirm = control.get('passconfirm');
        if (!pass || !passconfirm) return null;
        return pass.value === passconfirm.value ? null : { nomatch: true };
    };

    newpasswordMatcher = (
        control: AbstractControl
    ): { [key: string]: boolean } => {
        const passold = control.get('passold');
        const pass = control.get('pass');
        const passconfirm = control.get('passconfirm');

        if (!passold || !pass) return null;
        return passold.value === pass.value ? { matchnew: true } : null;
    };

    formgroup() {
        this.form = new FormGroup(
            {
                'passold': new FormControl(this.passold, []),
                'pass': new FormControl(this.pass, []),
                'passconfirm': new FormControl(this.passconfirm, [])
            },
            { validators: [this.passwordMatcher, this.newpasswordMatcher] }
        );
    }

    panelvalidation() {
        this.formgroup();
        this.form.controls['passold'].setValidators([Validators.required]);
        this.form.controls['pass'].setValidators([
            Validators.required,
            Validators.maxLength(20),
            Validators.pattern(this.passwordPattern)
        ]);
        this.form.controls['passconfirm'].setValidators([Validators.required]);
        this.form.updateValueAndValidity();
    }

    formgroupupdate() {
        this.formupdate = new FormGroup({
            // 'credentials': new FormControl(this.user.credentials,[]),
            'lastName': new FormControl(this.user.lastName, []),
            'firstName': new FormControl(this.user.firstName, []),
            // 'email': new FormControl(this.user.email,[]),
            // 'title': new FormControl(this.user.title,[]),
            'mobileNumber': new FormControl(this.user.mobileNumber, []),
            // 'employer': new FormControl(this.user.employer,[]),
            // 'address': new FormControl(this.user.address, []),
            // 'addressOptional': new FormControl(this.user.address1, []),
            // 'zipCode': new FormControl(this.user.zipCode, []),
            // 'country': new FormControl(this.user.countryName, []),
            // 'city': new FormControl(this.user.cityName, []),
            // 'state': new FormControl(this.user.stateName, []),
            // 'terms': new FormControl(this.user.terms,[]),

            'deaNumber': new FormControl(this.userspecialist.deaNumber, []),
            'npiNumber': new FormControl(this.userspecialist.npiNumber, []),
            // 'speciality': new FormControl(this.userspecialist.speciality, []),
            //   'physicianLicenseNumber': new FormControl(this.userspecialist.physicianLicenseNumber, []),
            'licensedStates': new FormControl(
                this.licensedStatesaddremovelist,
                []
            ),
            'practiceGroup': new FormControl(
                this.userspecialist.practiceGroup,
                []
            )
            // 'secretQuestion1': new FormControl(this.user.secretQuestion1,[]),
            // 'secretQuestion2': new FormControl(this.user.secretQuestion2,[]),
            // 'secretAnswer1': new FormControl(this.user.secretAnswer1,[]),
            // 'secretAnswer2': new FormControl(this.user.secretAnswer2,[])
        });
    }

    panelvalidationupdate() {
        this.formgroupupdate();
        // this.formupdate.controls['credentials'].setValidators( [Validators.required]);
        this.formupdate.controls['lastName'].setValidators([
            Validators.required,
            Validators.pattern(this.patternname)
        ]);
        this.formupdate.controls['firstName'].setValidators([
            Validators.required,
            Validators.pattern(this.patternname)
        ]);
        // this.formupdate.controls['email'].setValidators( [Validators.required, Validators.email]);
        // this.formupdate.controls['title'].setValidators( [Validators.required]);
        this.formupdate.controls['mobileNumber'].setValidators([
            Validators.required
        ]);

        // this._geo.getCountries().subscribe(
        //     (response) => {
        //         this.countries = JSON.parse(response._body);
        //         this.filteredCountries = this.form.controls.country.valueChanges
        //             .startWith(null)
        //             .map(val => val ? this.filterCountries(val) : this.countries.slice());
        //     },
        // );

        // this.formupdate.controls['employer'].setValidators( [Validators.required]);
        // this.formupdate.controls['address'].setValidators([Validators.required]);
        // this.formupdate.controls['city'].setValidators([Validators.required]);
        // this.formupdate.controls['state'].setValidators([Validators.required]);
        // this.formupdate.controls['zipCode'].setValidators([Validators.required, Validators.minLength(5), Validators.pattern(this.npiPattern)]);
        // this.formupdate.controls['country'].setValidators([Validators.required]);

        // this._specialist.getSpeciality().subscribe(
        //     (response) => {
        //         this.specialities = JSON.parse(response._body);
        //         this.filteredSpecialist = this.form.controls.speciality.valueChanges
        //             .startWith(null)
        //             .map(val => val ? this.filterSpecialist(val) : this.specialities.slice());
        //     },
        // );

        if (this.user.isSpecialist) {
            this.formupdate.controls['deaNumber'].setValidators([
                Validators.required
            ]);
            this.formupdate.controls['npiNumber'].setValidators([
                Validators.pattern(this.npiPattern),
                Validators.required
            ]);
            //  this.formupdate.controls['speciality'].setValidators([Validators.required]);
            //   this.formupdate.controls['physicianLicenseNumber'].setValidators([Validators.required]);
            this.formupdate.controls['licensedStates'].setValidators([
                Validators.required
            ]);
            this.formupdate.controls['practiceGroup'].setValidators([
                Validators.required
            ]);
        }

        this.formupdate.updateValueAndValidity();
    }
    ngOnInit(): void {
        this.inercontainer = 'block';
        this.inercontaineredit = 'none';
        this.panelvalidation();
        this.getUser();
        // this.getSpecilist();
        this.panelvalidationupdate();
    }
    ngOnChanges() {
        let specialist = new Specialist();
        this.user = this.user;
        this.user.specialist = specialist;
    }

    ngOnDestroy() {
        this.dialog.closeAll();
    }
    onedit() {
        this.inercontainer = 'none';
        this.inercontaineredit = 'block';

        this.formgroupupdate();
        this.panelvalidationupdate();
        // this.getallcities();
    }
    goback() {
        this.inercontainer = 'block';
        this.inercontaineredit = 'none';
        this.getUser();
    }
    addremovelicensedStates() {
        for (
            var index = 0;
            index < this.userspecialist.licensedStates.length;
            index++
        ) {
            this.userspecialist.licensedStates[index].isActive = false;
        }

        for (
            var index1 = 0;
            index1 < this.licensedStatesaddremovelist.length;
            index1++
        ) {
            for (
                var index2 = 0;
                index2 < this.userspecialist.licensedStates.length;
                index2++
            ) {
                if (
                    this.licensedStatesaddremovelist[index1].id ===
                    this.userspecialist.licensedStates[index2].stateId
                ) {
                    this.licensedStatesaddremovelist[
                        index1
                    ].licenceNumber = this.userspecialist.licensedStates[
                        index2
                    ].licenceNumber;
                }
            }
        }

        this.updatelicensestate = true;
    }
    openedChange(opened: boolean) {
        if (!opened) {
            for (
                var index = 0;
                index < this.licensedStatesaddremovelist.length;
                index++
            ) {
                if (!this.licensedStatesaddremovelist[index].licenceNumber) {
                    this.formupdate.controls['licensedStates'].setErrors({
                        'required': true
                    });
                }
            }
        } else {
            this.formupdate.controls['licensedStates'].setErrors(null);
        }
    }
    zipCodeCheck(val) {
        this.user.stateId = '';
        this.user.stateName = '';
        this.user.cityName = '';
        this.user.cityId = '';
        if (val && !isNaN(val)) {
            if (val.trim().length == 5) {
                this._geo.getStateCityWithZipCode(val).subscribe(
                    response => {
                        let res = response.json();
                        this.user.stateId = res.stateId;
                        this.user.stateName = res.stateName;
                        this.user.cityName = res.cityName;
                        this.user.cityId = res.cityId;
                        this.formupdate.controls['zipCode'].setErrors(null);
                    },
                    error => {
                        this.formupdate.controls['zipCode'].setErrors({
                            'incorrect': true
                        });
                    }
                );
            }
        }
    }
    getUser() {
        this._statusService.getUserInfo().subscribe(
            res => {
                if (res) {
                    var response = JSON.parse(JSON.stringify(res));
                    this.user = response;

                    if (this.user.isSpecialist) {
                        this.getSpecilist();
                    }
                    let body = {
                        values: response,
                        css: 'col-md-4'
                    };

                    this.addressData = body;

                    this.fullname =
                        response.firstName + ' ' + response.lastName;

                    this.email = response.email;

                    this.mobileNumber = '+1';
                    this.mobileNumber += response.mobileNumber;
                    this.address = response.address;
                    this.address1 = response.address1;
                    this.countryName = response.countryName;
                    this.stateName = response.stateName;
                    this.cityName = response.cityName;
                    this.zipCode = response.zipCode;

                    this.getStatesByCity(response.cityId);
                    this.getStatesByCountry(response.countryId);
                    this.user.city = {
                        stateId: response.stateId,
                        cityName: response.cityName,
                        id: response.cityId
                    };
                }
            },
            error => { }
        );
    }

    updateUserInfo() {
        if (this.updatelicensestate) {
            const temp = this.licensedStatesaddremovelist;

            for (let index = 0; index < temp.length; index++) {
                temp[index].stateId = temp[index].id;
                temp[index].id = 0;

                // this.licensedStatesaddremovelist[index].stateId =
                //     temp[index].id;
                // this.licensedStatesaddremovelist[index].id = 0;
            }

            for (let index = 0; index < temp.length; index++) {
                this.userspecialist.licensedStates.push(temp[index]);
            }
        }
        if (this.user.mobileNumber[0].toString() !== '+') {
            let number = this.user.mobileNumber;
            let formatenumber = number.replace(/[- )(]/g, '');
            this.user.mobileNumber = '+1' + formatenumber;
        }

        this.Loadininfogpage = 'block';

        this._statusService
            .updateUserInfo(this.user, this.userspecialist)
            .subscribe(
                response => {
                    this._statusService.getStatus().subscribe(
                        resp => {
                            this.user = JSON.parse(resp._body);

                            if (this.user.isSpecialist) {
                                this._statusService
                                    .getSpecialistInfo()
                                    .subscribe(
                                        res => {
                                            if (res) {
                                                this.userspecialist = JSON.parse(
                                                    res._body
                                                );

                                                this._statusService.setUserInfo(
                                                    this.user
                                                );
                                                this._statusService.setSpecilistInfo(
                                                    this.userspecialist
                                                );
                                                this.Loadininfogpage = 'none';
                                                // this.goback();
                                                let msg = new Message();
                                                msg.msg =
                                                    'Profile Successfully Updated';
                                                msg.type = 'success';
                                                msg.iconType = 'check_circle';
                                                this._uiServices.showToast(msg);

                                                this._router.navigate(['']);
                                            }
                                        },
                                        error => { }
                                    );
                            } else {
                                this._statusService.setUserInfo(this.user);
                                this._statusService.setSpecilistInfo(
                                    this.userspecialist
                                );
                                this.Loadininfogpage = 'none';
                                // this.goback();
                                let msg = new Message();
                                msg.msg = 'Profile Successfully Updated';
                                msg.type = 'success';
                                msg.iconType = 'check_circle';
                                this._uiServices.showToast(msg);

                                this._router.navigate(['']);
                            }
                        },
                        error => { }
                    );
                },
                error => {
                    this.Loadininfogpage = 'none';
                    let msg = new Message();
                    msg.msg = 'Something went wrong';
                    msg.iconType = 'info';
                    this._uiServices.showToast(msg);
                }
            );
    }
    getStatesByCountry(val) {
        if (val) {
            this._geo.getStates(val).subscribe(
                response => {
                    this.multipleLicensedStates = JSON.parse(response._body);
                },
                error => { }
            );
        }
    }
    getSpecilist() {
        this._statusService.getSpecilistInfo().subscribe(
            response => {
                if (response) {
                    this.userspecialist = response;
                    this.licensedStatesaddremovelist = response.licensedStates;

                    this.physicianLicenseNumber =
                        response.physicianLicenseNumber;
                    this.deaNumber = response.deaNumber;
                    this.npiNumber = response.npiNumber;

                    this.practiceGroup = response.practiceGroup;
                    this.timeZoneDescription = response.timeZoneDescription;
                    this.specialityName = response.specialityName;
                    this.licensedStates = '';

                    for (
                        var index = 0;
                        index < response.licensedStates.length;
                        index++
                    ) {
                        this.licensedStates +=
                            response.licensedStates[index].stateName + ' ';
                    }
                    this.licensedStates;
                }
            },
            error => { }
        );
    }
    changepass() {
        this.Loadingpage = 'block';
        this.Loadingbox = 'none';
        this._PassChangeService.setNewPass(this.passold, this.pass).subscribe(
            res => {
                let msg = new Message();
                msg.msg = 'Password Changed Successfully';
                msg.type = 'success';
                msg.iconType = 'check_circle';
                this._uiServices.showToast(msg);

                this._router.navigate(['']);

                this.Loadingpage = 'none';
                this.Loadingbox = 'block';

                this.form.reset();
                // this.form.markAsPristine();
                // this.form.markAsUntouched();
                // this.form.updateValueAndValidity();
            },
            err => {
                let msg = new Message();
                msg.msg = 'Invalid Current Password';
                msg.iconType = 'info';
                this._uiServices.showToast(msg);

                this.form.controls['passold'].reset();

                this.Loadingpage = 'none';
                this.Loadingbox = 'block';
            }
        );
    }
    displayCountry(country): string {
        return country ? country.countryName : '';
    }
    displayState(state): string {
        return state ? state.stateName : '';
    }
    displayCity(city): string {
        return city ? city.cityName : '';
    }
    displaySpeciality(speciality): string {
        return speciality ? speciality.name : '';
    }
    focusoutSelectSpeciality() {
        let temp = this.userspecialist.specialityName || {};
        if (temp.constructor == Object) {
            return;
        }
        let value = this.userspecialist.specialityName;
        // let filters = this.specialities.filter(f => f.name.toLowerCase() == value.toLowerCase());
        // if(filters.length == 0)
        // {
        //     this.formupdate.controls.speciality.reset('');
        //     this.user.specialist.speciality = undefined;
        //     this.formupdate.controls.speciality.setErrors({'required': true});
        //     return;
        // }
        // this.formupdate.controls.speciality.setValue(filters[0]);
    }

    focusoutSelectLicensedState() {
        let temp = this.userspecialist.licensedStates || {};
        if (temp.constructor == Object) {
            return;
        }
        let value = this.userspecialist.licensedStates;
        // let filters = this.states.filter(f => f.stateName.toLowerCase() == value.toLowerCase());
        // if(filters.length == 0)
        // {
        //     this.formupdate.controls.licensedStates.reset('');
        //     this.userspecialist.licensedStates = undefined;
        //     this.formupdate.controls.licensedStates.setErrors({'required': true});
        //     return;
        // }
        //this.formupdate.controls.licensedStates.setValue(filters[0]);
    }

    onSelectCountriesChange(val) {
        // if (val == '') {
        this.countryauto = true;
        this.stateauto = true;
        this.cityauto = true;
        this.formupdate.controls['state'].reset();
        this.formupdate.controls['city'].reset();

        // }
    }

    focusinSelectCountries(val) {
        // this.SelCountvalchange=val;

        if (this.SelCountvalchange != val && this.SelCountvalchange != '') {
            // this.form.controls.country.reset('');
            this.formupdate.controls.city.reset('');
            //    this.form.controls.city.disable();
            this.formupdate.controls.state.reset('');

            // this.form.controls.country.setErrors({'required': true});
            // return;
        }
        if (val != '') {
            this.formupdate.controls.state.enable();
        }
    }
    focusoutSelectCountries(val) {
        let temp = this.user.countryName || {};
        this.SelCountvalchange = val;
        if (val == '') {
            // this.form.controls.state.disable();
            // this.form.controls.city.disable();
        } else {
            this.formupdate.controls.state.enable();
        }
        if (temp.constructor == Object) {
            return;
        }
        let name = this.user.countryName;
        let filters = this.countries.filter(
            f => f.countryName.toLowerCase() == name.toLowerCase()
        );

        if (filters.length == 0) {
            this.formupdate.controls.country.reset('');
            this.formupdate.controls.state.reset('');
            this.formupdate.controls.city.reset('');
            // this.formupdate.controls.country.setErrors({ 'required': true });
            // this.form.controls.state.disable();
            // this.form.controls.city.disable();
            return;
        }

        // let state = this.formupdate.controls['state'].value || filters[0].id;
        // if(state.countryId != filters[0].id)
        // {
        //     this.formupdate.controls.state.reset('');
        //     this.formupdate.controls.city.reset('');
        // }

        // this.formupdate.controls.country.setValue(filters[0]);
        //  this.getState(this.form.controls.state, filters[0])
    }

    focusinSelectState(val) {
        if (this.SelStatevalchange != val && this.SelStatevalchange != '') {
            // this.form.controls.country.reset('');
            //  this.form.controls.state.reset('');
            this.formupdate.controls.city.reset('');

            // this.form.controls.country.setErrors({'required': true});
            // return;
        }

        if (val != '') {
            this.formupdate.controls.city.enable();
        }
    }

    focusoutSelectState(val) {
        let temp = this.user.stateName || {};
        this.SelStatevalchange = val;
        if (val == '') {
            // this.form.controls.city.disable();
        }
        if (temp.constructor == Object) {
            return;
        }

        let name = this.user.stateName;
    }

    setCity(event: MatOptionSelectionChange, city) {
        // this.filteredCities=null;
        // this.cities=null;

        if (event.source.selected) {
            this.user.cityId = city.id;
        }
    }
    setState(event: MatOptionSelectionChange, state) {
        // this.filteredCities=null;
        // this.cities=null;

        if (event.source.selected) {
            this.userspecialist.licensedStates = state.stateName;
        }
    }
    setSpeciality(event: MatOptionSelectionChange, speciality) {
        // this.filteredCities=null;
        // this.cities=null;

        if (event.source.selected) {
            this.userspecialist.specialityId = speciality.id;
        }
    }
    filterCountries(val: string): string[] {
        if (val.constructor == Object) {
            return this.countries;
        }
        return this.countries.filter(
            option =>
                option.countryName.toLowerCase().indexOf(val.toLowerCase()) ===
                0
        );
    }

    filterCities(val: string): string[] {
        if (val.constructor == Object) {
            return this.cities;
        }
        return this.cities.filter(
            option =>
                option.cityName.toLowerCase().indexOf(val.toLowerCase()) === 0
        );
    }

    filterStates(val: string): string[] {
        if (val.constructor == Object) {
            return this.states;
        }
        return this.states.filter(
            option =>
                option.stateName.toLowerCase().indexOf(val.toLowerCase()) === 0
        );
    }

    filterSpecialist(val: string): string[] {
        if (val.constructor == Object) {
            return this.specialities;
        }
        return this.specialities.filter(
            option => option.name.toLowerCase().indexOf(val.toLowerCase()) === 0
        );
    }

    //new geo implementation

    // cities = null;
    // state = null;
    // country = null;
    displayAllCity(city): string {
        return city ? city.cityName : '';
    }

    onCitySelect(event: MatOptionSelectionChange, val) {
        if (val && event.source.selected) {
            this.getStatesByCity(val.id);
        }
    }

    getStatesByCity(val) {
        if (val) {
            this._geo.getStatesByCity(val).subscribe(
                response => {
                    this.states = response.json();
                    this.user.state = this.states.stateName;
                    this.user.stateId = this.states.id;
                    this.getCountryByState(this.states.id);
                },
                error => { }
            );
        }
    }

    getCountryByState(val) {
        this._geo.getCountryByState(val).subscribe(
            response => {
                this.countries = response.json();
                this.user.country = this.countries.countryName;
                this.user.countryId = this.countries.id;
            },
            error => { }
        );
    }

    filterAllCities(val: string): string[] {
        if (val.constructor == Object) {
            return this.cities;
        }
        return this.cities.filter(
            option =>
                option.cityName.toLowerCase().indexOf(val.toLowerCase()) === 0
        );
    }

    focusoutSelectCity() {
        let temp = this.user.city || {};

        if (temp.constructor == Object) {
            return;
        }

        let name = this.user.city;
        let filters = this.cities.filter(
            f => f.cityName.toLowerCase() == name.toLowerCase()
        );
        if (filters.length == 0) {
            this.formupdate.controls.city.reset('');
            this.user.state = null;
            this.user.country = null;
            this.formupdate.controls.city.setErrors({ 'required': true });
            return;
        }
        this.formupdate.controls.city.setValue(filters[0]);
    }
}
