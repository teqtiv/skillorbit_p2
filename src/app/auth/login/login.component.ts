import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { UIService } from '../../core/services/ui/ui.service'
import { AuthService } from '../../core/services/auth/auth.service'
import { StatusService } from '../../core/services/user/status.service'
import { User } from '../../core/models/user'
import { Router } from '@angular/router';
import { Message } from "../../core/models/message";


@Component({
    selector: 'login',
    moduleId: module.id,
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
    currentDate = new Date();
    Mainpage = "none";
    Loginpage = "block";
    Loadingpage = "none";
    signin: boolean;
    user: User = new User()
    successResponse: any
    errorResponse: any

    patternemail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    formLogin = new FormGroup({

        'email': new FormControl(this.user.email, [Validators.required, Validators.pattern(this.patternemail)]),
        'password': new FormControl(this.user.password, [Validators.required]),
    });
    constructor(private _authServices: AuthService, private _uiServices: UIService, private _router: Router, private _statusService: StatusService) { }
    login(): void {

        if (this.formLogin.invalid) {
            let msg = new Message();



            if (this.formLogin.controls['email'].hasError('required') && this.formLogin.controls['password'].hasError('required')) {
                msg.msg = "Email and password are required."
            } else if (this.formLogin.controls['email'].hasError('required')) {
                msg.msg = "Email is required."
            } else if (this.formLogin.controls['email'].hasError('pattern')) {
                msg.msg = "Invalid email address."
            } else if (this.formLogin.controls['password'].hasError('required')) {
                msg.msg = "Password is required."
            }
            this._uiServices.showToast(msg);

        } else {
            this.Loginpage = "none";
            this.Loadingpage = "block";

            this.user.email = this.user.email.toLocaleLowerCase();
            this._authServices.checkLogin(this.user).subscribe(
                (response: Response) => {
                    if (response.status == 200) {
                        // this.Mainpage = "none";
                        // this.Loginpage= "none";
                        // this.Loadingpage= "none";
                        this._statusService.getStatus().subscribe(
                            (response) => {
                                this.Mainpage = "none";
                                this.Loginpage = "none";
                                this.Loadingpage = "none";
                                this.user = JSON.parse(response._body);
                                this._statusService.setUserInfo(this.user);
                                //this._authServices.storeUser(this.user);

                                if (this.user.userStatus == "Init") {
                                    this._router.navigate(['/verification']);
                                } else if (this.user.userStatus == "Verified") {
                                    this._router.navigate(['/verification']);
                                } else

                                // if(this.user.userStatus == "Completed" )
                                {
                                    this._router.navigate(['']);
                                    this._authServices.loginStatusChanged.next(true);
                                }
                            },
                            (error) => {
                                let msg = new Message();
                                msg.msg = "Something went wrong, please try again."

                                this._uiServices.showToast(msg);
                                this.Loginpage = "block";
                                this.Loadingpage = "none";
                                this._authServices.logoutUser();
                            }
                        )

                    }
                },
                (error) => {
                    if (error.status == 400) {
                        let msg = new Message();
                        msg.msg = "Invalid email or password."

                        this._uiServices.showToast(msg);
                        this.Loginpage = "block";
                        this.Loadingpage = "none";



                    } else {
                        let msg = new Message();
                        msg.msg = "Something went wrong, please try again."

                        this._uiServices.showToast(msg);
                        this.Loginpage = "block";
                        this.Loadingpage = "none";
                    }

                });
        }
    }

    Mainpagecreateaccount() {
        this._router.navigate(['/registration']);
    }

    Mainpagesignin() {
        this.Mainpage = "none";
        this.Loginpage = "block";
    }

    ngOnInit(): void {



        this._authServices.currentMessage.subscribe(value => this.signin = value);

        if (this.signin) {
            this.Mainpagesignin()
        }

        if (this._authServices.checkToken()) {
            this._router.navigate(['']);
        }
    }
    ngOnDestroy() {
        //this.subscription.unsubscribe();
    }

    base64string = '';
    play() {


        this.base64string = ``;
        var snd = new Audio("data:audio/wav;base64," + this.base64string);
        snd.play();
    }

}
