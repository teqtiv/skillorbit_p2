import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable, OnDestroy } from "@angular/core";
import { AuthService } from '../auth/auth.service';
import { StatusService, Roles, Permissions, childcomponnet, } from '../user/status.service';
import { Observable } from "rxjs/Observable";

@Injectable()
export class RoleGuard implements CanActivate {
    UserRoles: Roles[];
    UserRolespermissionCode: string[] = [];


    constructor(private router: Router,
        private authService: AuthService,
        private _statusService: StatusService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {




        this._statusService.getpermissionCodesParent().subscribe(res => {
            if (res) {
                if (res.Session) {
                    this.router.navigate(['/home']);
                } else if (res.Messages) {
                    this.router.navigate(['/messages']);
                } else if (res.Schedule) {
                    this.router.navigate(['/schedule']);
                } else if (res.Endpoints) {
                    this.router.navigate(['/endpoints']);
                } else if (res.Specialist) {
                    this.router.navigate(['/specialist']);
                }
                else if (res.Radiology) {
                    this.router.navigate(['/radiology']);
                }
                else if (res.profile) {
                    this.router.navigate(['/profile']);
                } else {

                }
            }
        });
        return true;
    }
}
