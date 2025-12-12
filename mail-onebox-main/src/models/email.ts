export enum EmailCategory {
  Interested = 'Interested',
  MeetingBooked = 'Meeting Booked',
  NotInterested = 'Not Interested',
  Spam = 'Spam',
  OutOfOffice = 'Out of Office',
  None = 'None',
}

export interface Email {
  account: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  date: string;
  folder: string;
  category: EmailCategory;
}