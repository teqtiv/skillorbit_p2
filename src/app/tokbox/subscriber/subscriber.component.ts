import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChild,
  Input
} from '@angular/core';
import * as OT from '@opentok/client';
import { OpentokService } from '../../core/services/Opentok/Opentok.service';

@Component({
  selector: 'app-subscriber',
  templateUrl: './subscriber.component.html',
  styleUrls: ['./subscriber.component.css']
})
export class SubscriberComponent implements AfterViewInit {
  @ViewChild('subscriberDiv', null) subscriberDiv: ElementRef;
  @Input() session: OT.Session;
  @Input() stream: OT.Stream;

  constructor(private opentokService: OpentokService) {}

  ngAfterViewInit() {
    const subscriber = this.session.subscribe(
      this.stream,
      this.subscriberDiv.nativeElement,
      {},
      err => {
        if (err) {
          alert(err.message);
        }
        console.log('subscriber: ', subscriber);
        this.setSubscriberVideo(subscriber);
      }
    );
    subscriber.on('videoEnabled', () => {
      const imgData = subscriber.getImgData();
      subscriber.setStyle('backgroundImageURI', imgData);
      subscriber.setStyle('videoDisabledDisplayMode', 'off');
    });
    subscriber.on('videoDisabled', () => {
      subscriber.setStyle('backgroundImageURI', '');
      subscriber.setStyle('videoDisabledDisplayMode', 'on');
    });
    subscriber.on('destroyed', () => {
      this.opentokService.SubscriberCommands.next('destroyed');
    });

    subscriber.on('connected', () => {
      this.opentokService.SubscriberCommands.next('connected');
    });
  }

  private setSubscriberVideo(subscriber: OT.Subscriber) {
    console.log('Subscriber:', subscriber);
    if (subscriber.stream.hasVideo) {
      setTimeout(() => {
        const imgData = subscriber.getImgData();
        subscriber.setStyle('backgroundImageURI', imgData);
      }, 500);
    } else {
      subscriber.setStyle('backgroundImageURI', '');
    }
  }
}
