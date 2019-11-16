import { Component, OnInit, Inject, OnDestroy, AfterViewInit } from '@angular/core'
import { MatDialogRef, MatDialog } from "@angular/material";
import { User, Client, PushNotification } from "twilio-chat";
import { MalihuScrollbarService } from 'ngx-malihu-scrollbar';
import { ChatService } from './../../core/services/specialist/chat.service';
import { StatusService } from '../../core/services/user/status.service';
import { VirgilCrypto, VirgilCardCrypto, VirgilPrivateKeyExporter } from 'virgil-crypto';
import { CachingJwtProvider, CardManager, PrivateKeyStorage, VirgilCardVerifier } from 'virgil-sdk';
declare const Twilio: any;
@Component({
    selector: 'specialist-chat',
    moduleId: module.id,
    templateUrl: 'specialist-chat.component.html',
    styleUrls: ['./../chat.component.css']
})
export class SpecialistChatComponent implements OnInit, OnDestroy, AfterViewInit {

    public scrollbarOptions = { axis: 'y', theme: 'minimal-dark' }
    UserId;
    twilioClient: Client;
    showGroupUser: boolean = false;
    twilioChannelslist = [];
    CurrentChannel;
    CurrentChannelUsers;
    onload: boolean = true;
    chatmessages = [];
    chatbox;
    users;
    usersFilter;
    supportGroups;
    selectedsupportGroups = null;
    selectedUsers = [];
    previousChatButton: boolean = false;

    //keys
    userKeys;
    channelKeys;
    //loading

    sideContainerLoading: boolean = true;
    mainContainerLoading: boolean = false;

    virgilCrypto = new VirgilCrypto();
    disableButton: boolean = false;

    constructor(private _chatService: ChatService, private mScrollbarService: MalihuScrollbarService, private _statusService: StatusService, ) {

    }

    compareFn(p1, p2) {
        return p1 && p2 ? p1.id === p2.id : p1 === p2;
    }
    scrollast() {
        this.mScrollbarService.initScrollbar('#chatConatiner', { axis: 'y', theme: 'minimal-dark' });
        this.mScrollbarService.scrollTo('#chatConatiner', 'last', {
            scrollInertia: 1,
        });

    }
    scrollTop() {
        this.mScrollbarService.initScrollbar('#chatConatiner', { axis: 'y', theme: 'minimal-dark' });
        this.mScrollbarService.scrollTo('#chatConatiner', 'top', {
            scrollInertia: 500,
        });

    }

    ngOnInit(): void {

        this.getUserCard();
        this._statusService.getUserInfo().subscribe(
            (response) => {
                if (response) {
                    this.UserId = response.userGUID;
                }


            },
            (error) => {

            }
        );

        this.getAccessToken();

        // this.getUsers();

    }

    ngOnDestroy() {

    }

    goBack() {
        this.selectedUsers = [];
        this.chatmessages = [];
        this.selectedsupportGroups = [];
        this.showGroupUser = false;
        setTimeout(() => {
            this.mScrollbarService.initScrollbar('#channelSidebar', { axis: 'y', theme: 'minimal-dark' });
        }, 1000);
    }

    getUserCard() {
        this._chatService.getUserCard()
            .subscribe((res) => {

                let body = JSON.parse(res._body);
                if (body) {
                    let privateKey = this.virgilCrypto.importPrivateKey(body.privateKey);
                    let publicKey = this.virgilCrypto.importPublicKey(body.publicKey);

                    this.userKeys = {
                        privateKey: privateKey,
                        publicKey: publicKey
                    };
                }

            }, (err) => {

            });
    }

    getChannelInfo(channelSid) {
        this._chatService.getChannelInfo(channelSid)
            .subscribe((res) => {

                let body = JSON.parse(res._body);

                let privateKeyDecrypted = this.virgilCrypto.decrypt(body.privateKey, this.userKeys.privateKey)
                let privateKey = this.virgilCrypto.importPrivateKey(privateKeyDecrypted);
                let publicKey = this.virgilCrypto.importPublicKey(body.channelKey);

                this.channelKeys = {
                    privateKey: privateKey,
                    publicKey: publicKey
                };


            }, (err) => {

            });
    }
    startChatWithSupportGroup() {


        if (!this.disableButton) {
            this.disableButton = true;
            this._chatService.createSupportChannel(this.selectedsupportGroups.id)
                .subscribe((res) => {
                    let body = JSON.parse(res._body);

                    if (!this.userKeys) {
                        this.getUserCard();
                    }

                    for (var index = 0; index < this.twilioChannelslist.length; index++) {
                        if (this.twilioChannelslist[index].sid == body.channelSid) {

                            this.getChannelChat(this.twilioChannelslist[index]);

                        }
                    }

                    this.selectedUsers = [];
                    this.selectedsupportGroups = [];
                    this.showGroupUser = false;
                    setTimeout(() => {
                        this.mScrollbarService.initScrollbar('#channelSidebar', { axis: 'y', theme: 'minimal-dark' });
                    }, 1000);
                    this.disableButton = false;
                }, (err) => {
                    this.disableButton = false;
                });

        }
    }
    startChatWithUser() {



        if (this.selectedUsers.length > 0 && !this.disableButton) {
            let body = this.selectedUsers;
            let array = new Array();
            for (var index = 0; index < body.length; index++) {
                array.push(body[index].userGUID);
            }
            this.createConversationChannel(array);
        }

    }

    getUsers() {
        this._chatService.GetGroupUser(0, 0)
            .subscribe((res) => {
                this.showGroupUser = true;
                this.users = JSON.parse(res._body);
                this.usersFilter = this.users;
                // let body = JSON.parse(res._body);
                // let array = new Array();
                // for (var index = 1; index < body.length; index++) {
                //     array.push(body[index].userGUID);
                // }
                // this.createConversationChannel(array);
            }, (err) => {

            });
    }

    getSupportGroup() {
        this._chatService.GetSupportGroup()
            .subscribe((res) => {
                this.showGroupUser = true;
                this.supportGroups = JSON.parse(res._body);


            }, (err) => {

            });
    }

    startNewConversation() {

        this.getUsers();
        this.getSupportGroup();
        this.CurrentChannel = null;
        this.chatmessages = [];
        this.CurrentChannelUsers = [];
        // this.getchannel()
    }

    createConversationChannel(body) {

        this.disableButton = true;
        this._chatService.createChannel(body)
            .subscribe((res) => {
                let body = JSON.parse(res._body);

                if (!this.userKeys) {
                    this.getUserCard();
                }
                for (var index = 0; index < this.twilioChannelslist.length; index++) {
                    if (this.twilioChannelslist[index].sid == body.channelSid) {

                        this.getChannelChat(this.twilioChannelslist[index]);

                    }
                }


                this.selectedUsers = [];
                this.selectedsupportGroups = [];
                this.showGroupUser = false;
                setTimeout(() => {
                    this.mScrollbarService.initScrollbar('#channelSidebar', { axis: 'y', theme: 'minimal-dark' });
                }, 1000);

                this.disableButton = false;
            }, (err) => {
                this.disableButton = false;
            });
    }
    getAccessToken() {
        this._chatService.getChatChannelAccessToken()
            .subscribe((res) => {

                this.getchannel(res._body);
            }, (err) => {

            });
    }

    getChatHistory() {

        let msgindex = 10;
        let msgindexsize = 50;

        // this.chatmessages = [];
        this.CurrentChannel.getMessagesCount().then(messagesCount => {
            this.CurrentChannel.getMessages((messagesCount - 10), 0, 'forward')
                .then(messagesPage => {
                    this.previousChatButton = false;


                    let msgs = new Array()
                    msgs = messagesPage.items;
                    msgs.reverse();
                    msgs.forEach(message => {


                        for (var index = 0; index < this.CurrentChannelUsers.length; index++) {
                            if (message.author == this.CurrentChannelUsers[index].userGUID) {
                                message.userName = this.CurrentChannelUsers[index].name
                            }
                        }

                        let msgBody = message.body;
                        const decryptedMessage = this.virgilCrypto.decryptThenVerify(msgBody, this.channelKeys.privateKey, this.channelKeys.publicKey);
                        message.decryptedMessage = decryptedMessage.toString();

                        this.chatmessages.unshift(message);



                        // }

                    });
                    setTimeout(() => {

                        this.scrollTop();
                    }, 500);
                });
        });
    }

    getChannelChat(channel) {
        this.previousChatButton = false;
        this.mainContainerLoading = true;

        if (channel != this.CurrentChannel) {
            this.chatmessages = [];
            this.CurrentChannel = channel;
            this.getChannelInfo(this.CurrentChannel.sid);
            this._chatService.getChannelUsers(channel.sid).subscribe((res) => {
                this.CurrentChannelUsers = JSON.parse(res._body);

                channel.getMessages(10 /* by pages of 20 messages */)
                    .then(messagesPage => {
                        this.chatmessages = [];
                        this.mainContainerLoading = false;
                        messagesPage.items.forEach(message => {

                            for (var index = 0; index < this.CurrentChannelUsers.length; index++) {
                                if (message.author == this.CurrentChannelUsers[index].userGUID) {
                                    message.userName = this.CurrentChannelUsers[index].name

                                }

                            }

                            let msgBody = message.body;
                            const decryptedMessage = this.virgilCrypto.decryptThenVerify(msgBody, this.channelKeys.privateKey, this.channelKeys.publicKey);
                            message.decryptedMessage = decryptedMessage.toString();

                            this.chatmessages.push(message);



                            setTimeout(() => {

                                this.scrollast();
                                channel.getMessagesCount().then(messagesCount => {
                                    if (messagesCount > 10) {
                                        this.previousChatButton = true;
                                        this.scrollast();
                                    }
                                });

                            }, 100);


                        });
                    });


            }, (err) => {

            });
        }

    }



    sendMessageToChannel() {
        if (this.chatbox && this.chatbox.trim()) {

            let encryptedMessage = this.virgilCrypto.signThenEncrypt(this.chatbox, this.channelKeys.privateKey, this.channelKeys.publicKey);
            this.CurrentChannel.sendMessage(encryptedMessage.toString('base64'));
            this.chatbox = null;
            this.scrollast();
        }
    }

    getchannel(token) {



        let twilioChannels = []
        let channelNumber = 0;
        Twilio.Chat.Client.create(token).then(chatClient => {
            this.sideContainerLoading = false;

            setTimeout(() => {
                this.mScrollbarService.initScrollbar('#channelSidebar', { axis: 'y', theme: 'minimal-dark' });
            }, 1000);



            chatClient.on('channelJoined', function (channel) {
                channelNumber++
                channel.on('messageAdded', function (message) {

                    if (this.CurrentChannel == channel) {
                        for (var index = 0; index < this.CurrentChannelUsers.length; index++) {
                            if (message.author == this.CurrentChannelUsers[index].userGUID) {
                                message.userName = this.CurrentChannelUsers[index].name
                            }

                        }

                        let msgBody = message.body;
                        const decryptedMessage = this.virgilCrypto.decryptThenVerify(msgBody, this.channelKeys.privateKey, this.channelKeys.publicKey);
                        message.decryptedMessage = decryptedMessage.toString();

                        this.chatmessages.push(message);



                        this.scrollast();
                    }
                }.bind(this));

                channel.id = channelNumber;
                twilioChannels.unshift(channel);


                this.twilioChannelslist = twilioChannels;




                for (var index = 0; index < this.twilioChannelslist.length; index++) {
                    if (this.twilioChannelslist[index].lastMessage) {
                    }
                }


            }.bind(this));
        });

    }


    endpointfilter(val) {

        this.usersFilter = this.users.filter(function (users, index) {


            let fullname = users.firstName + ' ' + users.lastName
            if
            (
                fullname.toUpperCase().indexOf(val.trim().toUpperCase()) > -1


            ) {
                return users;

            }
        });


    }


    onSelection(e) {

        if (e.option.selected) {
            this.selectedUsers.push(e.option.value)
            for (var index = 0; index < this.users.length; index++) {
                if (this.users[index] == e.option.value) {
                    this.users[index].ischecked = true;
                }

            }

        } else {
            this.selectedUsers.indexOf(e.option.value)
            this.selectedUsers.splice(this.selectedUsers.indexOf(e.option.value), 1);
            for (var index = 0; index < this.users.length; index++) {
                if (this.users[index] == e.option.value) {
                    this.users[index].ischecked = false;
                }

            }
        }
        this.usersFilter = this.users;


    }

    onSupportGroupSelection(e) {

        if (e.option.selected) {
            // this.supportGroups
            this.selectedsupportGroups = e.option.value;
            for (var index = 0; index < this.supportGroups.length; index++) {
                if (this.supportGroups[index] == e.option.value) {
                    this.supportGroups[index].ischecked = true;
                } else {
                    this.supportGroups[index].ischecked = false;
                }
            }

        } else {
            for (var index = 0; index < this.supportGroups.length; index++) {
                // if (this.supportGroups[index] == e.option.value) {
                //     this.supportGroups[index].ischecked = false;
                // } else {
                this.selectedsupportGroups = null;
                this.supportGroups[index].ischecked = false;
                // }
            }
            // this.selectedUsers.indexOf(e.option.value)
            // this.selectedUsers.splice(this.selectedUsers.indexOf(e.option.value),1);
            // for (var index = 0; index < this.users.length; index++) {
            //     if (this.users[index] == e.option.value) {
            //         this.users[index].ischecked = false;
            //     }

            //     }
        }
        this.usersFilter = this.users;


    }
    ngAfterViewInit() {
    }
}

