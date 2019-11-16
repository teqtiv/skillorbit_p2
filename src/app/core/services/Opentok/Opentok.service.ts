import { Injectable } from '@angular/core';

import * as OT from '@opentok/client';
import { Accepted } from '../specialist/specialistrequests.service';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class OpentokService {
  session: OT.Session;
  token: string;
  PublisherCommands = new Subject();
  SubscriberCommands = new Subject();

  constructor() {}

  getOT() {
    return OT;
  }
  initSession(EndpointSessionInfo: Accepted) {
    if (
      EndpointSessionInfo.token &&
      EndpointSessionInfo.resourceId &&
      EndpointSessionInfo.host
    ) {
      this.session = this.getOT().initSession(
        EndpointSessionInfo.host,
        EndpointSessionInfo.resourceId
      );
      this.token = EndpointSessionInfo.token;
      return Promise.resolve(this.session);
    } else {
      return;
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.session.connect(this.token, err => {
        if (err) {
          reject(err);
        } else {
          resolve(this.session);
        }
      });
    });
  }
}
