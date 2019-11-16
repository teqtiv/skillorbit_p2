import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { UIService } from '../core/services/ui/ui.service';
import { Message } from '../core/models/message';
import { ActivatedRoute } from '@angular/router';
import {
    PatientInfoService,
    PatientInfo
} from '../core/services/specialist/patientinfo.service';
import { Pacs } from '../core/main';
import {
    SpecialistRequestService,
    Accepted
} from '../core/services/specialist/specialistrequests.service';
import { Observable } from 'rxjs/Rx';
import { Location } from '@angular/common';
import { SignalRService } from '../core/services/signalr/signalr.service';
import { StatusService } from '../core/services/user/status.service';
import { OpentokService } from '../core/services/Opentok/Opentok.service';
import * as OT from '@opentok/client';
import { OpdService } from '../core/services/opd/opd.service';
declare var $;
declare var buffer;

@Component({
    selector: 'app-tokbox',
    templateUrl: './tokbox.component.html',
    styleUrls: ['./tokbox.component.css']
})
export class TokboxComponent implements OnInit, OnDestroy {
    dynamicNotesData;
    endpointFacilityName;
    endpointSerialNumber;

    specialityName;
    endPoint;

    pageNum = 1;

    previewD = 'block';

    Type: any;
    Name = 'loading....';
    Gender: any;
    Hospital: string;
    LastWellKnownDate: any;
    Mrn: any;
    PhysicianCell: any;
    PhysicianName: any;
    Age: string | number;
    reasonForRequest: string;
    videoLoader = 'none';
    patientInfo: PatientInfo;
    patientId: number;

    timeout: any;
    firsttimeload = true;
    Pacsshow = false;

    stopinterval = false;

    connectThread: any;
    connectThreadSubscribe: any;
    stethos = false;

    session: OT.Session;
    streams: Array<OT.Stream> = [];
    changeDetectorRef: ChangeDetectorRef;
    public rect;
    public canvas;
    public context;
    pressinterval;
    mousepress = true;
    clickCount = 0;
    doubleclicked = false;
    dragclick = false;
    lasttime = 0;
    mouseeventblock = false;
    microphonePrivacy = false;
    cameraPrivacy = false;
    singleClickTimer: any;
    direction: string;
    callConnectingTimer;

    radioPadding = 24;
    showPacs = true;
    showLoader = false;
    pacsVisble = false;
    closeDragElementoffsetTop = 0;
    isAppointment = false;
    appointmentId;
    HeartRate: any;
    TopBloodPressure: any;
    BottomBloodPressure: any;
    Temperature: any;

    constructor(
        private _statusService: StatusService,
        private _signalRService: SignalRService,
        private location: Location,
        private _specialistRequestService: SpecialistRequestService,
        private viewer: Pacs,
        private _uiService: UIService,
        private _route: ActivatedRoute,
        private _patientinfoservice: PatientInfoService,
        private opentokService: OpentokService,
        ref: ChangeDetectorRef,
        private _opdService: OpdService
    ) {
        this.changeDetectorRef = ref;
    }

    ngOnInit() {
        this.showoptionbeforeconnect();
        this.Connect();
        this.callanimate();
        setInterval(() => {
            this.checkEnpoint();
        }, 60000);

        this._signalRService.hubConnection.on(
            'GetPACSCredentials',
            (username, password) => {
                this.viewer.Authenticate(username, password, '', '', this.Mrn);
            }
        );

        this._signalRService.hubConnection.on('StreamStethoscope', message => {
            if (this.stethos) {
                buffer.addChunk(message);
            }
        });
    }

    canDeactivate(): boolean | Observable<boolean> | Promise<boolean> {
        this.location.forward();

        setInterval(() => {
            this.location.forward();
        }, 100);

        return false;
    }

    setpatintinfo() {
        if (this.isAppointment) {
            const timeDiff = Math.abs(
                Date.now() - Date.parse(this.patientInfo.dob)
            );
            this.Name =
                this.patientInfo.firstName + ' ' + this.patientInfo.lastName;

            this.Age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365);
            if (this.Age === 0) {
                this.Age =
                    Math.floor(timeDiff / (1000 * 3600 * 24) / 30) + ' month';
            } else if (this.Age === 0) {
                this.Age = Math.floor(timeDiff / (1000 * 3600 * 24)) + ' days';
            }

            this.Gender = this.patientInfo.gender;
            this.Mrn = this.patientInfo.mrn;

            this.HeartRate = this.patientInfo.heartRate;
            this.TopBloodPressure = this.patientInfo.topBloodPressure;
            this.BottomBloodPressure = this.patientInfo.bottomBloodPressure;
            this.Temperature = this.patientInfo.temperature;

            console.error('setpatintinfo');
            this._patientinfoservice
                .checkpatinentpacsinfo(this.patientInfo.mrn)
                .subscribe(
                    response => {
                        if (response.status === 200) {
                            this.getPacsCredentials();
                        }
                    },
                    error => {
                        this.checkforpacinfo();
                    }
                );
        } else {
            this._patientinfoservice.receivepatientinfo().subscribe(data => {
                console.log('data in receivepatientinfo', data);
                const timeDiff = Math.abs(Date.now() - Date.parse(data.dob));
                this.Name = data.firstName + ' ' + data.lastName;

                this.Age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365);
                if (this.Age === 0) {
                    this.Age =
                        Math.floor(timeDiff / (1000 * 3600 * 24) / 30) +
                        ' month';
                } else if (this.Age === 0) {
                    this.Age =
                        Math.floor(timeDiff / (1000 * 3600 * 24)) + ' days';
                }

                this.Gender = data.gender;
                this.Mrn = data.mrn;
                if (!this.isAppointment) {
                    this.PhysicianName = data.requestingPhysicianName;
                    this.PhysicianCell = data.requestingPhysicianCell;
                    this.LastWellKnownDate = data.lastWellKnownDate;
                }

                if (this.isAppointment) {
                    this.HeartRate = data.heartRate;
                    this.TopBloodPressure = data.topBloodPressure;
                    this.BottomBloodPressure = data.bottomBloodPressure;
                    this.Temperature = data.temperature;
                }

                console.error('setpatintinfo');
                this._patientinfoservice
                    .checkpatinentpacsinfo(data.mrn)
                    .subscribe(
                        response => {
                            if (response.status === 200) {
                                this.getPacsCredentials();
                            }
                        },
                        error => {
                            this.checkforpacinfo();
                        }
                    );
            });
        }
    }

    getPacsCredentials() {
        console.log('getPacsCredentials');
        console.log(
            'this._signalRService.ishubConnection',
            this._signalRService.ishubConnection
        );
        if (this._signalRService.ishubConnection) {
            this._signalRService.hubConnection.invoke('GetPACSCredentials');

            this.showPacs = true;
            this.Pacsshow = true;
            this.stopinterval = true;
            if (this.pageNum === 2) {
                $('.pacsbox').show();
            }
        } else {
            setTimeout(() => {
                this.getPacsCredentials();
            }, 2000);
        }
    }

    findPatientStudy(val) {
        this.viewer.findStudy(val);
    }

    checkforpatientinfo() {
        const specialistRequestId = this._patientinfoservice.getSpecialistRequestId();

        this._patientinfoservice.getpatientInfo(specialistRequestId).subscribe(
            patientinfo => {
                this.patientInfo = JSON.parse(patientinfo._body);
                this._patientinfoservice.sendpatientinfo(this.patientInfo);
            },
            err => {
                setTimeout(() => {
                    this.checkforpatientinfo();
                }, 1000);
            }
        );
    }

    checkforpacinfo() {
        console.error('checkforpacinfo');
        setInterval(() => {
            if (!this.stopinterval) {
                this._patientinfoservice
                    .checkpatinentpacsinfo(this.patientInfo.mrn)
                    .subscribe(
                        response => {
                            if (response.status === 200) {
                                this.getPacsCredentials();
                            }
                        },
                        error => {}
                    );
            }
        }, 60000);
    }

    /**
     * Callanimates
     * Display the animation before call connection
     */
    callanimate() {
        setTimeout(() => {
            document.getElementById('connecting-text-0').style.display = 'none';
            document.getElementById('connecting-1').style.visibility =
                'visible';
            document.getElementById('connecting-text-1').style.display =
                'block';
        }, 0);

        setTimeout(() => {
            document.getElementById('connecting-line-1').style.display =
                'block';
            document.getElementById('connecting-1').style.visibility = 'hidden';
            document.getElementById('connecting-2').style.visibility =
                'visible';

            document.getElementById('connecting-text-1').style.display = 'none';
            document.getElementById('connecting-text-2').style.display =
                'block';
        }, 3500);

        setTimeout(() => {
            document.getElementById('connecting-line-2').style.display =
                'block';
            document.getElementById('connecting-1').style.visibility = 'hidden';
            document.getElementById('connecting-2').style.visibility = 'hidden';
            document.getElementById('connecting-3').style.visibility =
                'visible';

            document.getElementById('connecting-text-1').style.display = 'none';
            document.getElementById('connecting-text-2').style.display = 'none';
            document.getElementById('connecting-text-3').style.display =
                'block';
        }, 7000);
    }

    checkEnpoint() {
        const specialistRequestId = this._patientinfoservice.getSpecialistRequestId();

        this._specialistRequestService
            .pingEnpoint(specialistRequestId)
            .subscribe(
                response => {
                    if (
                        response.status === 200 &&
                        (response._body === 'Completed' ||
                            response._body === 'ForceCompleted')
                    ) {
                        console.log(response);
                        $('.cartdisconect').fadeIn();

                        setTimeout(() => {
                            console.warn('disconnect called in checkEndpoint');
                            this.disconnectCall();
                            $('.cartdisconect').fadeOut();
                        }, 2000);
                    }
                },
                error => {}
            );
    }

    Connect() {
        if (
            this._specialistRequestService.issessionrequest ||
            JSON.parse(sessionStorage.getItem('vidyo'))
        ) {
            const EndpointSessionInfo: Accepted = JSON.parse(
                sessionStorage.getItem('vidyo')
            );
            this.joinTokBox(EndpointSessionInfo);

            this._route.params.subscribe(params => {
                this.Type = params['type'];

                if (params['type'] === 'session') {
                    this.Hospital = sessionStorage.getItem('facilityName');
                    this.reasonForRequest = sessionStorage.getItem(
                        'reasonForRequest'
                    );
                    this.endPoint = sessionStorage.getItem('endPoint');
                    this.specialityName = sessionStorage.getItem(
                        'specialityName'
                    );

                    if (sessionStorage.getItem('appointmentId')) {
                        this.appointmentId = sessionStorage.getItem(
                            'appointmentId'
                        );
                        this.isAppointment = true;
                    }

                    if (this.isAppointment) {
                        this._opdService
                            .GetPatientInfo(this.appointmentId)
                            .subscribe(res => {
                                const tempInfo = res.json();
                                console.log('tempInfo', tempInfo);
                                this.patientInfo = new PatientInfo();
                                this.patientInfo.dob = new Date(
                                    tempInfo.dob + 'Z'
                                );
                                this.patientInfo.bottomBloodPressure =
                                    tempInfo.patientTriage.bottomBloodPressure;
                                this.patientInfo.facilityName = sessionStorage.getItem(
                                    'facilityName'
                                );
                                this.patientInfo.firstName =
                                    tempInfo.patientFirstName;
                                this.patientInfo.gender = tempInfo.sex;
                                this.patientInfo.heartRate =
                                    tempInfo.patientTriage.heartRate;
                                this.patientInfo.lastName =
                                    tempInfo.patientLastName;
                                this.patientInfo.mrn = tempInfo.mrn;
                                this.patientInfo.temperature =
                                    tempInfo.patientTriage.temperature;
                                this.patientInfo.topBloodPressure =
                                    tempInfo.patientTriage.topBloodPressure;
                                this.patientInfo.specialityId =
                                    tempInfo.specialityId;

                                this._patientinfoservice.sendpatientinfo(
                                    this.patientInfo
                                );

                                this.Name =
                                    this.patientInfo.lastName +
                                    ' ' +
                                    this.patientInfo.firstName;
                                this.Hospital =
                                    EndpointSessionInfo.facilityName;

                                this._patientinfoservice.sendpatientinfo(
                                    this.patientInfo
                                );
                                this.setpatintinfo();
                                const data = {
                                    specialityId: this.patientInfo.specialityId,
                                    specialistRequestId: 0,
                                    appointmentId: this.appointmentId
                                };
                                this.dynamicNotesData = data;
                            });
                    } else {
                        const specialistRequestId = this._patientinfoservice.getSpecialistRequestId();
                        if (specialistRequestId > 0) {
                            this.setpatintinfo();
                            this._patientinfoservice
                                .getpatientInfo(specialistRequestId)
                                .subscribe(
                                    patientinfo => {
                                        this.patientInfo = JSON.parse(
                                            patientinfo._body
                                        );
                                        this._patientinfoservice.sendpatientinfo(
                                            this.patientInfo
                                        );

                                        const data = {
                                            specialityId: this.patientInfo
                                                .specialityId,
                                            specialistRequestId: specialistRequestId
                                        };
                                        this.dynamicNotesData = data;
                                    },
                                    err => {
                                        this.checkforpatientinfo();
                                    }
                                );
                        } else {
                            this.setpatintinfo();
                        }
                    }
                } else if (params['type'] === 'endpoint') {
                    this.endpointFacilityName = sessionStorage.getItem(
                        'endpointFacilityName'
                    );
                    this.Hospital = this.endpointFacilityName;
                    this.endpointSerialNumber = sessionStorage.getItem(
                        'endpointSerialNumber'
                    );
                    this.endPoint = this.endpointSerialNumber;
                }
            });
        } else {
            console.log('Session not found');
            // this._router.navigate(['/home']);
            window.location.href = '';
        }
    }

    /**
     * Joins tokbox client with the session using the opentokSevice
     * @param EndpointSessionInfo
     */
    joinTokBox(EndpointSessionInfo: Accepted) {
        console.log(
            'joinTokBox called with EndpointSessionInfo: ',
            EndpointSessionInfo
        );
        this.opentokService
            .initSession(EndpointSessionInfo)
            .then((session: OT.Session) => {
                this.ConfigSession(session);
            })
            .then(() => {
                this.opentokService.connect();
                this.ConfigDocument();
            })
            .catch(err => {
                console.error(err);
                this.showReconnectOption();
                // this._router.navigate(['/home']);
                // window.location.href = '';
            });
    }

    showReconnectOption() {
        document.getElementById('sessionEndOption').style.display = 'block';
        document.getElementById('connecting-line-3').style.display = 'block';
        document.getElementById('connecting-1').style.visibility = 'hidden';
        document.getElementById('connecting-2').style.visibility = 'hidden';
        document.getElementById('connecting-3').style.visibility = 'hidden';
        document.getElementById('connecting-text-1').style.display = 'none';
        document.getElementById('connecting-text-2').style.display = 'none';
        document.getElementById('connecting-text-3').style.display = 'none';
        document.getElementById('material-icons-4').style.color = 'red';
    }

    /**
     * Configure the session and the session events
     * @param session type: OT.Session
     */
    private ConfigSession(session: OT.Session) {
        console.log('ConfigSession called');
        this.session = session;
        this.session.on('streamCreated', event => {
            console.log('Stream Careated: ', event.stream);
            this.streams.push(event.stream);
            this.changeDetectorRef.detectChanges();
        });
        this.session.on('streamDestroyed', event => {
            const idx = this.streams.indexOf(event.stream);
            if (idx > -1) {
                this.streams.splice(idx, 1);
                this.changeDetectorRef.detectChanges();
            }
        });

        // Subcribe on session signanl call_disconnectfromKart
        this.session.on('signal', function(event) {
            // disregard the error flag
            if (event.type === 'signal:kart') {
                if (event.data === '__cmd__;call_disconnectfromKart;') {
                    $('.kartdisconect').fadeIn();
                    setTimeout(() => {
                        $('#publishVideo').hide();
                        $('.kartdisconect').fadeOut();
                        sessionStorage.removeItem('vidyo');
                        sessionStorage.removeItem('reasonForRequest');
                        sessionStorage.removeItem('facilityName');
                        // window.location.href = '/#/survey';

                        $('.survey').show();
                        for (let index = 0; index < 4; index++) {
                            $('.radio-survey[data-index="' + index + '"]').css(
                                'width',
                                $('th.ng-star-inserted')
                                    .eq(index)
                                    .width() + 24
                            );
                        }
                        $('.preview-area-b').hide();
                    }, 1000);
                }
            }
        });

        // Subscribe on kart connects/disconnects
        this.opentokService.SubscriberCommands.subscribe((status: string) => {
            switch (status) {
                case 'connected':
                    console.log('kart connected');
                    this.endAnimate();
                    $('.cartoffline').fadeOut();
                    $('.online').fadeOut();
                    break;
                case 'destroyed':
                    console.log('kart disconnects');
                    $('.cartoffline').fadeIn();
                    break;
                default:
                    break;
            }

            // setTimeout(() => {
            //   $('.cartoffline').fadeOut();
            // }, 2000);
        });
    }

    /**
     * Configure the page events and canvas
     */
    private ConfigDocument() {
        this.callConnectingTimer = setTimeout(() => {
            // if successfully connects to kart i.e has subscribers then connect else show reconnection options
            if (this.streams.length > 0) {
                this.endAnimate();
            } else {
                this.showReconnectOption();
            }
        }, 30000);
        this.canvassetup(<HTMLCanvasElement>(
            document.getElementById('canvascontanier')
        ));
        $('#connectionStatus').html('Ready to Connect');
        $('#helper').addClass('hidden');
        $('#toolbarLeft').removeClass('hidden');
        $('#toolbarCenter').removeClass('hidden');
        $('#toolbarRight').removeClass('hidden');

        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
    }
    endAnimate() {
        document.getElementById('call-connecting').style.display = 'none';
        clearTimeout(this.callConnectingTimer);
    }

    /**
     * Updates online status
     * @param event
     */
    updateOnlineStatus(event) {
        const condition = navigator.onLine ? 'online' : 'offline';
        switch (condition) {
            case 'online':
                $('.offline').fadeOut();
                $('.online').fadeIn();
                break;

            case 'offline':
                $('.online').fadeOut();
                $('.offline').fadeIn();
                break;

            default:
                break;
        }
    }

    showoptionbeforeconnect() {
        setTimeout(() => {
            document.getElementById('sessionEndOption').style.display = 'block';
            document.getElementById('connecting-line-3').style.display =
                'block';
            document.getElementById('connecting-1').style.visibility = 'hidden';
            document.getElementById('connecting-2').style.visibility = 'hidden';
            document.getElementById('connecting-3').style.visibility = 'hidden';
            document.getElementById('connecting-text-1').style.display = 'none';
            document.getElementById('connecting-text-2').style.display = 'none';
            document.getElementById('connecting-text-3').style.display = 'none';
            document.getElementById('material-icons-4').style.color = 'red';
        }, 60000);
    }

    //#region Navigation Actions

    onSpecialist() {
        const msg = new Message();
        msg.msg = 'Select a specilist';
        msg.title = '';
        msg.okBtnTitle = null;
        msg.onOkBtnClick = null;
        msg.cancelBtnTitle = 'OK';
        msg.showInput = 'addSpec';
        this._uiService.showMsgBox(msg);
    }

    /**
     * Determines whether pacs on
     */
    onPacs() {
        if (this.pageNum !== 2) {
            $('.subscriber').addClass('changed');
            $('.subscriber').css('left', '0px');
            $('.publishing').hide();
            $('.notebox').hide();
            $('.pacsbox').show();
            $('.lab').hide();

            this.pacsVisble = true;

            if (this.firsttimeload) {
                this.firsttimeload = false;
            }
            this.previewD = 'none';
            this.pageNum = 2;
        }
        this.mouseeventblock = true;
    }

    /**
     * Determines whether video on
     */
    onVideo() {
        if (this.pageNum !== 1) {
            $('.subscriber').removeClass('changed');
            $('.publishing').show();
            $('.notebox').hide();
            $('.pacsbox').hide();
            $('.lab').hide();
            this.pacsVisble = false;

            this.previewD = 'block';
            this.pageNum = 1;
        }
        this.mouseeventblock = false;
    }

    /**
     * Determines whether notes on
     */
    onNotes() {
        if (this.pageNum !== 3) {
            $('.subscriber').addClass('changed');
            $('.subscriber').css('left', '');
            $('.subscriber').css('right', '0px');
            $('.publishing').hide();
            $('.notebox').show();
            $('.pacsbox').hide();
            $('.lab').hide();
            this.pacsVisble = false;
            this.previewD = 'none';
            this.pageNum = 3;
        }
        this.mouseeventblock = true;
    }

    /**
     * Determines whether lab on
     */
    onLab() {
        if (this.pageNum !== 4) {
            $('.subscriber').addClass('changed');
            $('.subscriber').css('left', '0px');
            $('.publishing').hide();
            $('.notebox').hide();
            $('.publishing').hide();
            $('.pacsbox').hide();
            $('.lab').show();
            this.pacsVisble = false;
            this.previewD = 'none';
            this.pageNum = 4;
        }
        this.mouseeventblock = true;
    }

    //#endregion

    ngOnDestroy() {
        this._patientinfoservice.patientinfoshare.unsubscribe();
    }

    /**
     * Ends session
     */
    EndSession() {
        const appointmentId = JSON.parse(
            sessionStorage.getItem('appointmentId')
        );
        if (appointmentId) {
            this._opdService.EndSession(appointmentId).subscribe(res => {
                if (res.status === 200) {
                    this.directdisconnectCall();
                    sessionStorage.removeItem('vidyo');
                    sessionStorage.removeItem('reasonForRequest');
                    sessionStorage.removeItem('facilityName');
                    sessionStorage.removeItem('appointmentId');
                }
            });
        } else {
            const specialistRequestId = this._patientinfoservice.getSpecialistRequestId();

            this._specialistRequestService
                .setSpecialistRequest(specialistRequestId, 'EndSession', '')
                .subscribe(
                    response => {
                        if (response.status === 200) {
                            this.directdisconnectCall();
                            sessionStorage.removeItem('vidyo');
                            sessionStorage.removeItem('reasonForRequest');
                            sessionStorage.removeItem('facilityName');
                        }
                    },
                    error => {
                        this.directdisconnectCall();

                        const msg = new Message();
                        msg.msg = 'Something went wrong, please try again.';
                    }
                );
        }
    }

    /**
     * Ends session with survey
     */
    EndSessionWithSurvey() {
        const appointmentId = JSON.parse(
            sessionStorage.getItem('appointmentId')
        );
        if (appointmentId) {
            this._opdService.EndSession(appointmentId).subscribe(res => {
                if (res.status === 200) {
                    this.disconnectCall();
                    sessionStorage.removeItem('vidyo');
                    sessionStorage.removeItem('reasonForRequest');
                    sessionStorage.removeItem('facilityName');
                    sessionStorage.removeItem('appointmentId');
                }
            });
        } else {
            const specialistRequestId = this._patientinfoservice.getSpecialistRequestId();

            this._specialistRequestService
                .setSpecialistRequest(specialistRequestId, 'EndSession', '')
                .subscribe(
                    response => {
                        if (response.status === 200) {
                            console.warn(
                                'disconnect called in EndSessionWithSurvey'
                            );
                            this.disconnectCall();
                            sessionStorage.removeItem('vidyo');
                            sessionStorage.removeItem('reasonForRequest');
                            sessionStorage.removeItem('facilityName');
                        }
                    },
                    error => {
                        this.disconnectCall();

                        const msg = new Message();
                        msg.msg = 'Something went wrong, please try again.';
                    }
                );
        }
    }
    /**
     * On Yes click
     */
    yesClick() {
        this.EndSessionWithSurvey();
    }

    /**
     * canvassetup
     * Configure the canvas for drawing
     * @param canvas HTMLCanvasElement to be configured
     */
    canvassetup(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.addEventListener('mousedown', ev =>
            this.handleMouseDown(ev)
        );
        this.canvas.addEventListener('mouseup', ev => this.handleMouseUp(ev));
        this.canvas.addEventListener('mousemove', ev =>
            this.handleMouseMove(ev)
        );
        this.canvas.addEventListener('dblclick', ev =>
            this.handleMouseDblClick(ev)
        );
        this.rect = this.canvas.getBoundingClientRect();
        this.context = this.canvas.getContext('2d');
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = window.innerHeight;

        console.log(this.canvas.width, this.canvas.height);

        const mousewheelevt = /Firefox/i.test(navigator.userAgent)
            ? 'DOMMouseScroll'
            : 'mousewheel';

        this.canvas.addEventListener(mousewheelevt, ev =>
            this.handleMouseScroll(ev)
        );

        document.documentElement.addEventListener(
            'gesturestart',
            function(event) {
                event.preventDefault();
            },
            false
        );
        $(document).keydown(function(event) {
            if (
                event.ctrlKey === true &&
                (event.which === 61 ||
                    event.which === 107 ||
                    event.which === 173 ||
                    event.which === 109 ||
                    event.which === 187 ||
                    event.which === 189)
            ) {
                event.preventDefault();
            }
        });
    }

    //#region MouseEvents

    handleMouseScroll(ev: any) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const currenttime = Date.now();
        if (typeof ev.detail === 'number' && ev.detail !== 0) {
            if (ev.detail > 0) {
                this.direction = 'Down';
            } else if (ev.detail < 0) {
                this.direction = 'Up';
            }
        } else if (typeof ev.wheelDelta === 'number') {
            if (ev.wheelDelta < 0) {
                this.direction = 'Down';
            } else if (ev.wheelDelta > 0) {
                this.direction = 'Up';
            }
        }
        let commandBlock = '';
        if (currenttime > this.lasttime) {
            if (this.getOS() === 'MacOS') {
                commandBlock =
                    this.direction === 'Up'
                        ? '__cmd__;zoom_out;'
                        : '__cmd__;zoom_in;';
            } else {
                commandBlock =
                    this.direction === 'Up'
                        ? '__cmd__;zoom_in;'
                        : '__cmd__;zoom_out;';
            }
            console.log(this.mouseeventblock);

            if (!this.mouseeventblock) {
                this.sendMessage(commandBlock);
            }
        }
        this.lasttime = Date.now() + 25;
    }

    handleMouseDblClick(ev: any) {
        ev.preventDefault();
    }

    handleMouseMove(ev: any) {
        if (this.dragclick) {
            this.rect.w = ev.pageX - this.canvas.offsetLeft - this.rect.startX;
            this.rect.h = this.rect.w;
            this.draw();
        }
        return true;
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        console.log(this.canvas.width, this.canvas.height);

        const x = this.rect.startX;
        const y = this.rect.startY;

        if ($('input[name=Color]:checked').val() === '1') {
            this.context.beginPath();
            this.context.arc(
                x,
                y,
                Math.abs(this.rect.w),
                0,
                2 * Math.PI,
                false
            );
            this.context.lineWidth = 2;
            this.context.strokeStyle = '#00aecd';
            this.context.stroke();
            this.context.closePath();

            this.context.beginPath();
            this.context.fillStyle = '#00aecd';
            this.context.arc(x, y, 2, 0, 2 * Math.PI, true);
            this.context.fill();
            this.context.closePath();
        } else if ($('input[name=Color]:checked').val() === '2') {
            this.context.beginPath();
            this.context.arc(
                x,
                y,
                Math.abs(this.rect.w),
                0,
                2 * Math.PI,
                false
            );
            this.context.lineWidth = 2;
            this.context.strokeStyle = '#28B463';
            this.context.stroke();
            this.context.closePath();

            this.context.beginPath();
            this.context.fillStyle = '#28B463';
            this.context.arc(x, y, 2, 0, 2 * Math.PI, true);
            this.context.fill();
            this.context.closePath();
        }
    }

    handleMouseDown(ev: MouseEvent) {
        this.rect.startX = ev.clientX;
        this.rect.startY = ev.clientY - this.closeDragElementoffsetTop;
        if (ev.which === 1) {
            this.dragclick = true;
            this.rect.w = 0;
            this.rect.h = 0;

            this.clickCount++;
            if (this.clickCount === 1) {
                this.singleClickTimer = setTimeout(() => {
                    this.clickCount = 0;
                    this.doubleclicked = false;
                    console.log('single click');
                }, 500);
            } else if (this.clickCount === 2) {
                this.doubleclicked = true;
                this.clickCount = 0;
                console.log('dblClick');
                clearTimeout(this.singleClickTimer);
            }
        } else if (ev.which === 2) {
        } else if (ev.which === 3) {
        }
    }

    handleMouseUp(ev: MouseEvent): any {
        console.log(ev.which);
        if (ev.which === 1) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.dragclick = false;
            if (this.rect.w === 0) {
                if (this.doubleclicked) {
                    console.log('here');
                    const commandBlock = '__cmd__;zoom_out;';
                    this.sendMessage(commandBlock);
                } else {
                    const commandBlock =
                        '__cmd__;ptz_start;point ' +
                        this.rect.startX +
                        ' ' +
                        this.rect.startY +
                        ';screen_width ' +
                        this.canvas.width +
                        ';screen_height ' +
                        this.canvas.height +
                        ';ptz_end;';
                    this.sendMessage(commandBlock);
                }
            } else {
                const commandBlock =
                    '__cmd__;ptz_start;point ' +
                    this.rect.startX +
                    ' ' +
                    this.rect.startY +
                    ';rectangle ' +
                    Math.abs(this.rect.w * 2) +
                    ' ' +
                    Math.abs(this.rect.h * 2) +
                    ';screen_width ' +
                    this.canvas.width +
                    ';screen_height ' +
                    this.canvas.height +
                    ';ptz_end;';
                this.sendMessage(commandBlock);
            }
        } else if (ev.which === 2) {
        } else if (ev.which === 3) {
            const commandBlock = '__cmd__;reset;';
            this.sendMessage(commandBlock);
        }
    }

    //#endregion

    /**
     * Sends message
     * @param commandBlock Message commands
     */
    sendMessage(commandBlock: string) {
        console.log(commandBlock);
        this.session.signal(
            {
                data: commandBlock
            },
            function(error) {
                if (error) {
                    console.log(
                        'signal error (' + error.name + '): ' + error.message
                    );
                } else {
                    console.log('signal sent.');
                }
            }
        );
    }

    /**
     * Gets OS
     * @returns
     */
    getOS() {
        const userAgent = window.navigator.userAgent,
            platform = window.navigator.platform,
            macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
            windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
            iosPlatforms = ['iPhone', 'iPad', 'iPod'];
        let os = null;

        if (macosPlatforms.indexOf(platform) !== -1) {
            os = 'MacOS';
        } else if (iosPlatforms.indexOf(platform) !== -1) {
            os = 'iOS';
        } else if (windowsPlatforms.indexOf(platform) !== -1) {
            os = 'Windows';
        } else if (/Android/.test(userAgent)) {
            os = 'Android';
        } else if (!os && /Linux/.test(platform)) {
            os = 'Linux';
        }

        return os;
    }

    /**
     * Disconnects call
     */
    disconnectCall() {
        console.log('disconnectCall called');
        const commandBlock = '__cmd__;call_disconnect;';
        let signalSent = false;
        this.session.signal(
            {
                data: commandBlock,
                type: 'web'
            },
            function(error) {
                if (error) {
                    console.log(
                        'signal error (' + error.name + '): ' + error.message
                    );
                } else {
                    signalSent = true;
                }
            }
        );
        setTimeout(() => {
            if (signalSent) {
                this.session.disconnect();
                sessionStorage.removeItem('vidyo');
                sessionStorage.removeItem('reasonForRequest');
                sessionStorage.removeItem('facilityName');
            }
            this.showSurvey();
        }, 500);
    }

    /**
     * Directdisconnects call
     */
    directdisconnectCall() {
        const commandBlock = '__cmd__;call_disconnect;';
        let signalSent = false;
        this.session.signal(
            {
                data: commandBlock,
                type: 'web'
            },
            function(error) {
                if (error) {
                    console.log(
                        'signal error (' + error.name + '): ' + error.message
                    );
                } else {
                    signalSent = true;
                }
            }
        );
        setTimeout(() => {
            if (signalSent) {
                this.session.disconnect();
                sessionStorage.removeItem('vidyo');
                sessionStorage.removeItem('reasonForRequest');
                sessionStorage.removeItem('facilityName');
            }
            window.location.href = '/';
        }, 500);
    }

    /**
     * Shows survey
     */
    showSurvey() {
        console.log('showSurvey called');
        $('.survey').show();
        this.previewD = 'none';

        for (let index = 0; index < 4; index++) {
            $('.radio-survey[data-index="' + index + '"]').css(
                'width',
                $('th.ng-star-inserted')
                    .eq(index)
                    .width() + this.radioPadding
            );
        }

        // this._router.navigate(['/survey']);
        // window.location.href = '/survey';
        // setTimeout(() => {
        //   window.location.href = '';
        // }, 500);
    }

    fullscreen() {
        if (document.fullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            setTimeout(() => {
                this.canvas.height = window.innerHeight;
            }, 500);
        } else {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
            setTimeout(() => {
                this.canvas.height = window.innerHeight;
            }, 500);
        }
    }

    //#region SideBar Button Events

    /**
     * Refreshs pacs
     */
    refreshPacs() {
        let signalSent = false;
        const commandBlock = '__cmd__;pacs;';
        this.session.signal(
            {
                data: commandBlock
            },
            function(error) {
                if (error) {
                    console.log(
                        'signal error (' + error.name + '): ' + error.message
                    );
                    console.error('SendChatMsg Failed');
                } else {
                    signalSent = true;
                }
            }
        );
        setTimeout(() => {
            if (signalSent) {
                const msg = new Message();
                msg.msg = 'Pacs successfully requested';
                msg.type = 'success';
                msg.iconType = 'check_circle';
                this._uiService.showToast(msg);
            } else {
                const msg = new Message();
                msg.msg = 'Failed to request pacs';
                msg.type = 'error';
                msg.iconType = 'check_circle';
                this._uiService.showToast(msg);
            }
        }, 500);
    }

    refresh() {
        this.showPacs = false;
        this.showLoader = true;
        this.pacsVisble = false;
        // console.warn("it's getting inside refresh.");
        setTimeout(() => {
            this.showPacs = true;
            this.showLoader = false;
            this.pacsVisble = true;
            // $('.pacsbox').show();
            // console.warn("it's getting here.");
            this.getPacsCredentials();
        }, 1000);
    }

    /**
     * Ondisconnects tokbox component
     */
    ondisconnect() {
        const msg = new Message();
        // msg.msg = this.Mrn;
        msg.msg = 'Are you sure you want to end this session ?';
        msg.title = '';
        msg.okBtnTitle = 'End Session';
        msg.onOkBtnClick = this.yesClick.bind(this);
        msg.showInput = 'none';
        this._uiService.showMsgBox(msg);
    }

    /**
     * Stethoscopes button press
     */
    stethoscopeButton() {
        this.stethos = !this.stethos;

        document
            .getElementById('stethoscopeButton')
            .classList.add('list-btn-round');
        if (this.stethos) {
            document.getElementById('stethoscopeButton').classList.add('pulse');
            document
                .getElementById('stethoscopeButton')
                .classList.remove('dark');

            this._statusService.getUserInfo().subscribe(
                response => {
                    if (response) {
                        this._signalRService.hubConnection
                            .invoke(
                                'RequestStethocope',
                                response.userGUID,
                                sessionStorage.getItem('endPointId')
                            )
                            .catch(err => console.error(err));
                    } else {
                    }
                },
                error => {}
            );
        } else {
            document
                .getElementById('stethoscopeButton')
                .classList.remove('pulse');
            document.getElementById('stethoscopeButton').classList.add('dark');

            this._signalRService.hubConnection
                .invoke('StopStream', sessionStorage.getItem('endPointId'))
                .catch(err => console.error(err));
        }
    }

    /**
     * Microphones button
     */
    microphoneButton() {
        this.microphonePrivacy = !this.microphonePrivacy;

        this.opentokService.PublisherCommands.next({
            type: 'microphonePrivacy',
            value: this.microphonePrivacy
        });
        if (this.microphonePrivacy) {
            document.getElementById('micIcon').classList.remove('icon_vm_mic');
            document.getElementById('micIcon').classList.add('icon_vm_mute');
            document
                .getElementById('microphoneButton')
                .classList.remove('light');
            document.getElementById('microphoneButton').classList.add('dark');
        } else {
            document.getElementById('micIcon').classList.remove('icon_vm_mute');
            document.getElementById('micIcon').classList.add('icon_vm_mic');
            document
                .getElementById('microphoneButton')
                .classList.remove('dark');
            document.getElementById('microphoneButton').classList.add('light');
        }
    }

    /**
     * Cameras button
     */
    cameraButton() {
        this.cameraPrivacy = !this.cameraPrivacy;
        this.opentokService.PublisherCommands.next({
            type: 'cameraPrivacy',
            value: this.cameraPrivacy
        });

        if (this.cameraPrivacy) {
            // Hide the local camera preview, which is in slot 0
            document
                .getElementById('camIcon')
                .classList.remove('icon_vm_video');
            document
                .getElementById('camIcon')
                .classList.add('icon_vm_video_disable');
            document.getElementById('cameraButton').classList.remove('light');
            document.getElementById('cameraButton').classList.add('dark');
        } else {
            // Show the local camera preview, which is in slot 0
            document
                .getElementById('camIcon')
                .classList.remove('icon_vm_video_disable');
            document.getElementById('camIcon').classList.add('icon_vm_video');
            document.getElementById('cameraButton').classList.remove('dark');
            document.getElementById('cameraButton').classList.add('light');
        }
    }

    /**
     * Resetcameras button
     */
    resetcameraButton() {
        const commandBlock = '__cmd__;reset;';
        this.sendMessage(commandBlock);
    }

    //#endregion
}
