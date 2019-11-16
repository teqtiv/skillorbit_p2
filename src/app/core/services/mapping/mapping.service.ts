import { Injectable } from '@angular/core';
import { CalendarEventModel } from '../../models/calander.model';
import { User } from '../../models/user';
import { Specialist } from '../../models/specialist.model';
import { Appointment } from '../../models/appointment';
import { Accepted } from '../specialist/specialistrequests.service';

@Injectable()
export class MappingService {
    constructor() {}

    mapCalnderEvent(res: any): CalendarEventModel {
        const eventData = res ? res : null;
        const isCalendarEvent = new CalendarEventModel('day');
        if (eventData) {
            isCalendarEvent.end = new Date(eventData.endTime + 'Z') || null;
            isCalendarEvent.id = eventData.id || null;
            isCalendarEvent.start = new Date(eventData.startTime + 'Z') || null;
            isCalendarEvent.day = eventData.day || null;
            isCalendarEvent.draggable = false;
            isCalendarEvent.title = '';
            isCalendarEvent.startTime.hours = isCalendarEvent.start.getHours();
            isCalendarEvent.startTime.minutes = isCalendarEvent.start.getMinutes();
            isCalendarEvent.endTime.hours = isCalendarEvent.end.getHours();
            isCalendarEvent.endTime.minutes = isCalendarEvent.end.getMinutes();
            isCalendarEvent.isDeleted = eventData.isDeleted;
        }
        return isCalendarEvent;
    }

    mapUser(res: any): User {
        const userData = res ? res : null;
        const isUser = new User();
        if (userData) {
            isUser.address = userData.address || '';
            isUser.address1 = userData.address1 || '';
            isUser.cityName = userData.cityName || '';
            isUser.countryId = userData.countryId || '';
            isUser.countryName = userData.countryName || '';
            isUser.createdBy = userData.createdBy || '';
            isUser.createdOn = userData.createdOn || '';
            isUser.credentials = userData.credentials || '';
            isUser.email = userData.email || '';
            isUser.employer = userData.employer || '';
            isUser.firstName = userData.firstName || '';
            isUser.id = userData.id || 0;
            isUser.isActive = userData.isActive || true;
            isUser.lastName = userData.lastName || '';
            isUser.mobileNumber = userData.mobileNumber || '';
            isUser.secretAnswer1 = userData.secretAnswer1 || '';
            isUser.secretAnswer2 = userData.secretAnswer2 || '';
            isUser.secretQuestion1 = userData.secretQuestion1 || '';
            isUser.secretQuestion2 = userData.secretQuestion2 || '';
            isUser.stateId = userData.stateId || '';
            isUser.stateName = userData.stateName || '';
            isUser.utcDSTOffset = userData.utcDSTOffsetInSeconds || 0;
            isUser.title = userData.title || '';
            isUser.updatedOn = userData.updatedOn || '';
            isUser.userGUID = userData.userGUID || '';
            isUser.zipCode = userData.zipCode || '';

            isUser.isSpecialist = userData.isSpecialist || false;
            if (isUser.isSpecialist) {
                isUser.specialist = new Specialist();
                isUser.specialist.isActive = userData.isActive;
                isUser.specialist.timeZoneDescription =
                    userData.timeZoneDescription;
            }
        }
        return isUser;
    }

    mapAppointment(res: any): any {
        const appointmentData = res ? res : null;
        const isAppointment = new Appointment();
        if (appointmentData) {
            isAppointment.currentStateName =
                appointmentData.currentStateName || '';
            isAppointment.dob = new Date(appointmentData.dob + 'Z') || null;
            isAppointment.endDate =
                new Date(appointmentData.endDate + 'Z') || null;
            isAppointment.facilityId = appointmentData.facilityId || null;
            isAppointment.id = appointmentData.id || 0;
            isAppointment.mrn = appointmentData.mrn || '';
            isAppointment.patientFirstName =
                appointmentData.patientFirstName || '';
            isAppointment.patientId = appointmentData.patientId || null;
            isAppointment.patientLastName =
                appointmentData.patientLastName || '';
            isAppointment.roomNumber = appointmentData.roomNumber || '';
            isAppointment.sessionId = appointmentData.sessionId || null;
            isAppointment.sex = appointmentData.sex || '';
            isAppointment.specialistFirstName =
                appointmentData.specialistFirstName || '';
            isAppointment.specialistId = appointmentData.specialistId || null;
            isAppointment.specialistLastName =
                appointmentData.specialistLastName || '';
            isAppointment.specialityName = appointmentData.specialityName || '';
            isAppointment.startDate =
                new Date(appointmentData.startDate + 'Z') || null;
            isAppointment.type = appointmentData.type || '';
        }
        return isAppointment;
    }

    mapAcceptedRequest(res: any): Accepted {
        const acceptedRequestData = res ? res : null;
        const isAccepted = new Accepted();
        if (acceptedRequestData) {
            isAccepted.facilityName = acceptedRequestData.facilityName || '';
            isAccepted.host = acceptedRequestData.host || null;
            isAccepted.id = acceptedRequestData.sessionId || null;
            isAccepted.platform = acceptedRequestData.platform || null;
            isAccepted.resourceId = acceptedRequestData.resourceId || 0;
            isAccepted.serialNumber = acceptedRequestData.serialNumber || '';
            isAccepted.token = acceptedRequestData.token || null;
        }
        return isAccepted;
    }
}
