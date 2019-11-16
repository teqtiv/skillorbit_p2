import { SpecialistScheduleService,OffDays,Holidays,Schedule } from "../../core/services/specialist/specialistschedule.service";
export enum MessageTypes {
    Information,
    Confirmation,
    Warning,
    Error
}

export class Message {
 
    msgType : MessageTypes= MessageTypes.Information;
    iconType = 'info';
    msg : string = 'Test';
    title : string = 'VeeMed';
    type:string = "danger";
    autoCloseAfter : number = 0;
    okBtnTitle = 'Ok';
    cancelBtnTitle = 'Cancel';
    showInput= 'none';
    selectedDatesWorkingDay:Schedule;
    onOkBtnClick : (res,id) => any;
    onCancelBtnClick : () => any;
}