export const REGISTRATION_CAMPUSES = [
  'FGS Ravi Road Boys Campus',
  'FGS Ravi Road Girls Campus',
  'FGS Ravi Road Kids Campus',
  'FGS Edward Road (PG to Matric)',
] as const;

export type RegistrationCampus = (typeof REGISTRATION_CAMPUSES)[number];

export const PAKISTAN_TIME_ZONE = 'Asia/Karachi';
export const PAKISTAN_UTC_OFFSET = '+05:00';
export const REGISTRATION_TIME_STEP_MINUTES = 30;

function getPakistanDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PAKISTAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: lookup('year'),
    month: lookup('month'),
    day: lookup('day'),
    hour: lookup('hour'),
    minute: lookup('minute'),
    second: lookup('second'),
  };
}

function getCalendarDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPakistanNow() {
  const { year, month, day, hour, minute, second } = getPakistanDateParts(
    new Date()
  );

  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${PAKISTAN_UTC_OFFSET}`
  );
}

function getPakistanTodayKey(now = new Date()) {
  const { year, month, day } = getPakistanDateParts(now);
  return `${year}-${month}-${day}`;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function getHourLabel(hour: number, minute: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${pad(minute)} ${suffix}`;
}

function getClosingHour(date: Date) {
  const day = date.getDay();

  if (day === 5) {
    return 12;
  }

  return 14;
}

export function isRegistrationDateAvailable(date: Date, now = new Date()) {
  if (date.getDay() === 0) {
    return false;
  }

  return getCalendarDateKey(date) >= getPakistanTodayKey(now);
}

export function getRegistrationTimeOptions(date: Date, now = new Date()) {
  if (!isRegistrationDateAvailable(date, now)) {
    return [];
  }

  const options: Array<{ value: string; label: string }> = [];
  const closingHour = getClosingHour(date);
  const { year, month, day, hour, minute, second } = getPakistanDateParts(now);
  const pakistanNow = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${PAKISTAN_UTC_OFFSET}`
  );

  for (let hour = 8; hour < closingHour; hour += 1) {
    for (
      let minute = 0;
      minute < 60;
      minute += REGISTRATION_TIME_STEP_MINUTES
    ) {
      const value = `${pad(hour)}:${pad(minute)}`;
      const appointment = new Date(combinePakistanDateAndTime(date, value));
      if (appointment <= pakistanNow) {
        continue;
      }

      options.push({
        value,
        label: getHourLabel(hour, minute),
      });
    }
  }

  return options;
}

export function combinePakistanDateAndTime(date: Date, time: string) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  return `${year}-${month}-${day}T${time}:00${PAKISTAN_UTC_OFFSET}`;
}

export function isValidRegistrationAppointment(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}\+05:00$/);

  if (!match) {
    return false;
  }

  const [, datePart, timePart] = match;
  const parsed = new Date(`${datePart}T12:00:00${PAKISTAN_UTC_OFFSET}`);
  if (Number.isNaN(parsed.getTime()) || !isRegistrationDateAvailable(parsed)) {
    return false;
  }

  return getRegistrationTimeOptions(parsed).some(
    (option) => option.value === timePart
  );
}

export function formatPakistanAppointment(date: Date) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PAKISTAN_TIME_ZONE,
  }).format(date);
}
