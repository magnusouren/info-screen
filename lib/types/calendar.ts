export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  calendar: string;
  color?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
}
