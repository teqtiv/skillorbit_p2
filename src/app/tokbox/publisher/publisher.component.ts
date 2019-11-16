import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChild,
  Input
} from '@angular/core';
import { OpentokService } from '../../core/services/Opentok/Opentok.service';
import { PublisherCommands } from '../../core/models/tokboxObjects';

const publish = () => {};

@Component({
  selector: 'app-publisher',
  templateUrl: './publisher.component.html',
  styleUrls: ['./publisher.component.css']
})
export class PublisherComponent implements AfterViewInit {
  @ViewChild('publisherDiv', null) publisherDiv: ElementRef;
  @Input() session: OT.Session;
  publisher: OT.Publisher;
  publishing: Boolean;
  devicesInterval = null;

  constructor(private opentokService: OpentokService) {
    this.publishing = false;
  }

  ngAfterViewInit() {
    const OT = this.opentokService.getOT();
    this.publisher = OT.initPublisher(this.publisherDiv.nativeElement, {
      insertMode: 'append'
    });

    if (this.session) {
      if (this.session['isConnected']()) {
        this.publish();
      }
      this.session.on('sessionConnected', () => this.publish());
    }

    this.opentokService.PublisherCommands.subscribe(
      (command: PublisherCommands) => {
        if (command.type === 'microphonePrivacy') {
          this.publisher.publishAudio(!command.value);
        } else if (command.type === 'cameraPrivacy') {
          this.publisher.publishVideo(!command.value);
        }
      }
    );
    this.publisher.on('mediaStopped', () => {
      let hasAudio: boolean, hasVideo: boolean;
      console.log('mediaStopped called');
      if (this.devicesInterval === null) {
        this.devicesInterval = setInterval(() => {
          OT.getDevices(async (err, devices) => {
            if (err) {
              console.log(err);
            } else {
              const audioInputs = devices.filter(
                device => device.kind === 'audioInput'
              );
              const videoInputs = devices.filter(
                device => device.kind === 'videoInput'
              );

              if (videoInputs.length < 1) {
                console.log('no camera module found.');
                hasVideo = false;
              } else {
                hasVideo = true;
                clearInterval(this.devicesInterval);
                this.devicesInterval = null;
                this.publisher.destroy();
                this.ngAfterViewInit();
              }

              if (audioInputs.length < 1) {
                console.log('microphone not found.');
                hasAudio = false;
              } else {
                const stream = await OT.getUserMedia({
                  videoSource: null
                });

                const [audioSource] = stream.getAudioTracks();
                this.publisher
                  .setAudioSource(audioSource)
                  .then(() => console.log('Audio source updated'));
              }
              if (hasAudio && hasVideo) {
                clearInterval(this.devicesInterval);
              }
            }
          });
        }, 2000);
      }
    });
  }

  publish() {
    this.session.publish(this.publisher, err => {
      if (err) {
        alert(err.message);
      } else {
        this.publishing = true;
      }
    });
  }
}
