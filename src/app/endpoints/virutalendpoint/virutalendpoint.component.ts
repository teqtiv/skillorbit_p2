import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { UIService } from '../../core/services/ui/ui.service';
import { Message } from '../../core/models/message';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CountBubble } from './../../core/services/specialist/countbubble.service';
import {
  SpecialistRequestService,
  Accepted
} from './../../core/services/specialist/specialistrequests.service';
import { DatePipe } from '@angular/common';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { HubConnection } from '@aspnet/signalr';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SignalRService } from '../../core/services/signalr/signalr.service';
declare var $: any;
@Component({
  selector: 'virutalendpoint',
  moduleId: module.id,
  templateUrl: 'virutalendpoint.component.html',
  styleUrls: ['virutalendpoint.component.css']
})
export class VirutalEndpointComponent implements OnInit {
  facilityName;
  serialNumber;
  endPointId;
  EndpointSessionInfo: Accepted;
  Endpoints: Endpoints[] = [];
  EndpointsFilter: Endpoints[];
  EndpointsFilterPagination: Endpoints[] = [];
  PageLength: number;
  PageLengthrange: number[];
  paginationdisplaybtn = 'none';
  paginationdisplay = 'none';
  paginationdisplayfilter = 'none';
  currentpage = 1;
  zeroResults = 'none';
  visibilityLoginSpinner;
  //firstime;
  private hubConnection: HubConnection;
  private headers: HttpHeaders;
  nick = '';
  message = '';
  messages: string[] = [];
  constructor(
    private _signalRService: SignalRService,
    private _specialistRequestService: SpecialistRequestService,
    private _uiService: UIService,
    private _authServices: AuthService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _countBubble: CountBubble
  ) {}

  public sendMessage(): void {
    this.hubConnection
      .invoke('EchoMessage', this.message)
      .catch(err => console.error(err));
  }

  // connectionR() {

  //     let token = this._authServices.getToken();
  //     this.hubConnection = new HubConnection('https://dev-app-lb-1724806204.us-east-1.elb.amazonaws.com/kartdemo/signalr/?token=' + token + "&connectiontype=user");
  //     this.hubConnection
  //         .start()
  //         .then(() => {

  //             this.hubConnection.on('EndPointUpdate', (endPointId: number, endPointStatus: string) => {

  //                 // this.messages.push(text);
  //             });

  //             this.hubConnection.on('Echo', (receivedMessage: string) => {
  //                 const text = ` ${receivedMessage}`;
  //                 this.messages.push(text);
  //             });

  //         })

  // }

  connectEndpoint(val: Endpoints) {
    if (val.kartStatus.toUpperCase() == 'ONLINE') {
      this.facilityName = val.facilityName;
      this.serialNumber = val.serialNumber;
      this.endPointId = val.id;

      let msg = new Message();
      msg.msg = val.id;
      msg.title = '';
      msg.okBtnTitle = 'Connect';
      msg.cancelBtnTitle = 'Not now';
      msg.onOkBtnClick = this.yesClick.bind(this);
      msg.showInput = 'endpoint';
      this._uiService.showMsgBox(msg);
    }
  }
  yesClick(result, id) {
    document.getElementById('call-connecting').style.display = 'block';
    this._specialistRequestService.issessionrequest = true;
    sessionStorage.setItem('endpointFacilityName', this.facilityName);
    sessionStorage.setItem('endpointSerialNumber', this.serialNumber);
    sessionStorage.setItem('endPointId', this.endPointId);

    this._specialistRequestService.getEndpointSessioninfo(id).subscribe(
      response => {
        if (response._body != 'offline' && response._body != 'busy') {
          this.EndpointSessionInfo = JSON.parse(response._body);
          sessionStorage.setItem(
            'vidyo',
            JSON.stringify(this.EndpointSessionInfo)
          );
          console.log(this.EndpointSessionInfo);
          if (this.EndpointSessionInfo.platform.toLowerCase() === 'tokbox') {
            this._router.navigate(['/talk/endpoint']);
          } else {
            this._router.navigate(['/call/endpoint']);
          }
        } else {
          document.getElementById('call-connecting').style.display = 'none';
          let msg = new Message();
          msg.msg = 'Somthing went wrong !';
          this._uiService.showToast(msg);
        }
      },
      error => {}
    );
  }
  getEndpoint() {
    this.visibilityLoginSpinner = 'table-cell';
    let date = new Date();

    this._specialistRequestService.getSpecialistEndpoint().subscribe(
      response => {
        this.visibilityLoginSpinner = 'none';

        if (response.status == 200) {
          if (JSON.parse(response._body) != null) {
            this.Endpoints = JSON.parse(response._body);

            this.EndpointsFilter = this.Endpoints;
            //this.Endpoints = this.Endpoints.slice(0,10);
            this.EndpointsFilter = this.EndpointsFilter.slice(0, 8);
            this.PageLength = Math.ceil(this.Endpoints.length / 8);
            this.PageLengthrange = this.createRange(this.PageLength);
            //this._countBubble.setendpointcount(0);

            if (this.Endpoints.length <= 8) {
              // this.paginationdisplay ="block";
              this.paginationdisplaybtn = 'none';
              this.paginationdisplay = 'none';
            } else {
              this.paginationdisplaybtn = 'block';
              this.paginationdisplay = 'block';
            }

            if (this.Endpoints.length == 0) {
              this.zeroResults = 'table-cell';
            }
          }
        }
      },
      error => {
        this.visibilityLoginSpinner = 'none';
      }
    );
  }

  pagNum(val, filter) {
    // this.firstime =false;

    if (!filter.trim()) {
      this.EndpointsFilter = this.Endpoints;
    } else {
      this.EndpointsFilter = this.EndpointsFilterPagination;
    }

    // this.endpointfilter(filter)
    if (val != 'P' && val != 'N') {
      this.EndpointsFilter = this.EndpointsFilter.slice(val * 8 - 8, val * 8);
      this.currentpage = val;

      // if (val == 1) {
      //     this.firstime =true;
      // }
      //   this.firstime = val;
    } else if (val == 'P') {
      if (this.currentpage != 1) {
        val = this.currentpage - 1;
        this.currentpage = val;
      } else {
        val = this.currentpage;
        this.currentpage = val;
      }

      this.EndpointsFilter = this.EndpointsFilter.slice(val * 8 - 8, val * 8);
    } else if (val == 'N') {
      if (this.currentpage < this.PageLength) {
        val = this.currentpage + 1;
        this.currentpage = val;
      } else {
        val = this.currentpage;
        this.currentpage = val;
      }

      this.EndpointsFilter = this.EndpointsFilter.slice(val * 8 - 8, val * 8);
    }
  }

  endpointfilter(val) {
    this.currentpage = 1;

    this.EndpointsFilter = this.Endpoints.filter(function(hero, index) {
      var lastSessionTimeInUtc = ' ';

      if (hero.lastSessionTimeInUtc) {
        let x = hero.lastSessionTimeInUtc.split('.');

        lastSessionTimeInUtc = new DatePipe('en-US').transform(
          x[0] + '.000Z',
          'MMM d y h:mm a'
        );
      } else {
        lastSessionTimeInUtc = 'N/A';
      }

      if (
        hero.partnerSiteName.toUpperCase().indexOf(val.trim().toUpperCase()) >
          -1 ||
        hero.facilityName.toUpperCase().indexOf(val.trim().toUpperCase()) >
          -1 ||
        hero.name.toUpperCase().indexOf(val.trim().toUpperCase()) > -1 ||
        hero.kartStatus.toUpperCase().indexOf(val.trim().toUpperCase()) > -1 ||
        lastSessionTimeInUtc.toUpperCase().indexOf(val.trim().toUpperCase()) >
          -1 ||
        hero.location.toUpperCase().indexOf(val.trim().toUpperCase()) > -1
      ) {
        return hero.partnerSiteName;
      }
    });

    if (val.trim()) {
      if (this.EndpointsFilter.length <= 8) {
        // this.paginationdisplay ="block";
        this.paginationdisplaybtn = 'none';
        this.paginationdisplayfilter = 'none';
      } else {
        this.paginationdisplaybtn = 'block';
        this.paginationdisplayfilter = 'block';
      }

      this.paginationdisplay = 'none';
      //  this.paginationdisplayfilter="block"

      this.EndpointsFilterPagination = this.EndpointsFilter;
      this.EndpointsFilter = this.EndpointsFilter.slice(0, 8);
      this.PageLength = Math.ceil(this.EndpointsFilterPagination.length / 8);
      this.PageLengthrange = this.createRange(this.PageLength);
    } else {
      if (this.Endpoints.length <= 8) {
        // this.paginationdisplay ="block";
        this.paginationdisplaybtn = 'none';
        this.paginationdisplay = 'none';
      } else {
        this.paginationdisplaybtn = 'block';
        this.paginationdisplay = 'block';
      }

      // this.paginationdisplay="block";
      this.paginationdisplayfilter = 'none';

      this.EndpointsFilter = this.EndpointsFilter.slice(0, 8);
      this.PageLength = Math.ceil(this.Endpoints.length / 8);
      this.PageLengthrange = this.createRange(this.PageLength);
    }

    // if(val)
    // {
    //     this.PageLength =  Math.ceil(this.EndpointsFilter.length / 10) ;
    //     this.PageLengthrange = this.createRange(this.PageLength)
    // }else
    // {
    //     this.PageLength =  Math.ceil(this.Endpoints.length / 10) ;
    //     this.PageLengthrange = this.createRange(this.PageLength)
    // }

    // if (this.firstime) {

    // this.firstime =false;

    //   this.EndpointsFilter = this.EndpointsFilter.slice(((this.firstime * 10) - 10), (this.firstime * 10));
    // }

    if (this.Endpoints.length == 0 || this.EndpointsFilter.length == 0) {
      this.zeroResults = 'table-cell';
    } else {
      this.zeroResults = 'none';
    }
  }

  ngOnInit(): void {
    this._signalRService.hubConnection.on(
      'EndPointUpdate',
      (endPointId: number, endPointStatus: string) => {
        this.EndpointsFilter.filter(function(el) {
          if (el.id == endPointId) {
            el.kartStatus = endPointStatus;
          }
        });
      }
    );

    this.getEndpoint();
  }

  createRange(number) {
    var items: number[] = [];
    for (var i = 1; i <= number; i++) {
      items.push(i);
    }
    return items;
  }
}

// export class PartnerSite {

//     Partnersite: any;
//     Facility: Facility[];

// }

// export class Facility {

//     facility: any;
//     Endpoints: Endpoints[];

// }

// export class Endpoints {

//     Partnersite: any;
//     facility: any;
//     SerialNumber: any;
//     Status: any;
//     Camera: any;
//     BatteryLife: any;
//     LastSession: any;
//     Location: any;

// }
export class Endpoints {
  id: any;
  serialNumber: any;
  kartStatus: any;
  name: any;
  // statusUpdatedOn: any;
  // statusUpdatedOnInUtc: any;
  // cameraStatus: any;
  // lastSessionTime: any;
  lastSessionTimeInUtc: any;
  // betteryLifeInSeconds:any;
  partnerSiteName: any;
  location: any;
  // isForDemo: any;
  facilityName: any;
}
