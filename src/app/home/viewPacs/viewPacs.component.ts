import { Component } from '@angular/core';
import { SignalRService } from '../../core/services/signalr/signalr.service';
import { Pacs } from '../../core/main';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PatientInfoService,
  PatientInfo
} from '../../core/services/specialist/patientinfo.service';
import {
  Accepted,
  SpecialistRequestService
} from '../../core/services/specialist/specialistrequests.service';
import { Message } from '../../core/models/message';
import { UIService } from '../../core/services/ui/ui.service';

@Component({
  selector: 'ViewPacs',
  templateUrl: 'viewPacs.component.html',
  styleUrls: ['../home.component.css']
})
export class ViewPacsComponent {
  showLoader: boolean = true;
  showPacs: boolean = true;
  pageIndex: number = 0;
  mrn;
  request: PatientInfo;
  accepted: Accepted;
  specialistRequestId;
  constructor(
    private _uiServices: UIService,
    private _specialistRequestService: SpecialistRequestService,
    private _router: Router,
    private _patientinfoservice: PatientInfoService,
    private _signalRService: SignalRService,
    private viewer: Pacs,
    private _route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.setPacsListener();
    this._route.params.subscribe(
      params => {
        if (params['mrn']) {
          this.mrn = params['mrn'];
          this.specialistRequestId = params['specialistRequestId'];
          this.getPacsCredentials();
          this.getPatient(params['specialistRequestId']);
        }
      },
      err => {}
    );
  }

  pageView(pageIndex) {
    this.pageIndex = pageIndex;
  }

  callAccept() {
    document.getElementById('call-connecting').style.display = 'block';
    //  this.callanimate();
    this._patientinfoservice.isrefreshed = true;
    this._specialistRequestService.issessionrequest = true;
    // sessionStorage.setItem('facilityName', facilityName);
    // sessionStorage.setItem('specialityName', specialityName);
    // sessionStorage.setItem('reasonForRequest', reasonForRequest);
    // sessionStorage.setItem('endPoint', endPoint);
    // sessionStorage.setItem('endPointId', endPointId);

    this.setRequests(this.specialistRequestId, 'Accepted', '');
  }
  callReject() {
    this.setRequests(this.specialistRequestId, 'Rejected', '');
    //  this.setRequests(id,'Rejected')
  }
  setRequests(id, action, result) {
    // this.request = null;

    this._specialistRequestService
      .setSpecialistRequest(id, action, result)
      .subscribe(
        response => {
          if (response.status == 200 && action == 'Accepted') {
            if (response._body) {
              this.accepted = JSON.parse(response._body);
              sessionStorage.setItem('vidyo', JSON.stringify(this.accepted));
              if (this.accepted.platform.toLowerCase() === 'tokbox') {
                this._router.navigate(['/talk/session']);
              } else {
                this._router.navigate(['/call/session']);
              }

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }

          if (response.status == 200 && action == 'Rejected') {
            // window.location.reload();
            // this._router.navigate(['/home']);
            this._router.navigate(['/home']);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        },
        error => {
          document.getElementById('call-connecting').style.display = 'none';
          let msg = new Message();
          msg.msg = 'Something went wrong, please try again.';
          this._uiServices.showToast(msg);
        }
      );
  }
  getPatient(specialistRequestId) {
    this._patientinfoservice.getpatientInfo(specialistRequestId).subscribe(
      patientinfo => {
        this.request = JSON.parse(patientinfo._body);
        var timeDiff = Math.abs(Date.now() - Date.parse(this.request['dob']));
        if (Math.floor(timeDiff / (1000 * 3600 * 24) / 365) <= 1) {
          this.request['age'] =
            Math.floor(timeDiff / (1000 * 3600 * 24) / 365) + ' year';
        } else {
          this.request['age'] =
            Math.floor(timeDiff / (1000 * 3600 * 24) / 365) + ' years';
        }

        if (this.request['age'] == '0 year') {
          if (Math.floor(timeDiff / (1000 * 3600 * 24) / 30) <= 1) {
            this.request['age'] =
              Math.floor(timeDiff / (1000 * 3600 * 24) / 30) + ' month';
          } else {
            this.request['age'] =
              Math.floor(timeDiff / (1000 * 3600 * 24) / 30) + ' months';
          }
        }

        if (this.request['age'] == '0 month') {
          if (Math.floor(timeDiff / (1000 * 3600 * 24)) <= 1) {
            this.request['age'] =
              Math.floor(timeDiff / (1000 * 3600 * 24)) + ' day';
          } else {
            this.request['age'] =
              Math.floor(timeDiff / (1000 * 3600 * 24)) + ' days';
          }
        }

        this.request['visitType'] = this.request['visitType']
          ? this.request['visitType']
          : '-';
        this.request['Priority'] = this.request['isUrgent']
          ? 'Urgent'
          : 'Routine';
      },
      err => {}
    );
  }
  onExit() {
    this._router.navigate(['/home']);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  setPacsListener() {
    this._signalRService.hubConnection.on(
      'GetPACSCredentials',
      (username, password) => {
        this.viewer.Authenticate(username, password, '', '', this.mrn);
        setTimeout(() => {
          this.showLoader = false;
        }, 5000);
      }
    );
  }

  getPacsCredentials() {
    if (this._signalRService.ishubConnection) {
      this._signalRService.hubConnection.invoke('GetPACSCredentials');
    } else {
      setTimeout(() => {
        this.getPacsCredentials();
      }, 2000);
    }
  }

  refresh() {
    console.log('refresh called from radiology session');
    this.showPacs = false;
    this.showLoader = true;
    setTimeout(() => {
      this.showPacs = true;
      this.showLoader = true;
      this.getPacsCredentials();
    }, 1000);
  }
}
