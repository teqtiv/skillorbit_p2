import { Headers, Response, Http, RequestOptions } from '@angular/http';
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { HttpService } from "../base/http.service";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';

import { environment } from "../../../../environments/environment";

@Injectable()
export class ChatService {
    constructor(private _http: HttpService) { }


    getChatChannelAccessToken(): Observable<any> {
        return this._http.get("chat/access/token").catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getChannelUsers(channelSid): Observable<any> {
        return this._http.get("channel/users/"+ channelSid).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getUserCard(): Observable<any> {
        return this._http.get("channel/user/card").catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    getChannelInfo(channelSid): Observable<any> {
        return this._http.get("channel/"+ channelSid).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    createSupportChannel(GroupId): Observable<any> {
        return this._http.post("chat/support/channel/create/" + GroupId,null).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    createChannel(body): Observable<any> {
        return this._http.post("chat/channel/create", body).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    GetGroupUser(pageIndex, pageSize): Observable<any> {
        return this._http.get("accessible/users/" + pageIndex + "/" + pageSize).catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    GetSupportGroup(): Observable<any> {
        return this._http.get("user/support/groups").catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    GetGroupUserCount(): Observable<any> {
        return this._http.get("accessible/users/count").catch((err, caught) => {
            return Observable.throw(err);
        });
    }

    // getAllMessage(id): Observable<any> {
    //     return this._http.get("requests/" + id + "/messages/0/0/false").catch((err, caught) => {
    //         return Observable.throw(err);
    //     });
    // }
    // sendMessage(requestMsgSessionId, message): Observable<any> {
    //     let body = {
    //         RequestMsgSessionId: requestMsgSessionId,
    //         Message: message,
    //     }
    //     return this._http.post("requests/message/send", body).catch((err, caught) => {
    //         return Observable.throw(err);
    //     });
    // }


}   
