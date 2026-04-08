import { combinePakistanDateAndTime } from '@/lib/registration';

function getNextRegistrationDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);

  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

export function createFutureRegistrationAppointmentAt() {
  return combinePakistanDateAndTime(getNextRegistrationDate(), '08:00');
}

export function createFutureRegistrationAppointmentDate() {
  return new Date(createFutureRegistrationAppointmentAt());
}
