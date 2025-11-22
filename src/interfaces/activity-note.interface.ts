import { LeadActivity } from 'src/database/entities/core-app-entities/lead-activity.entity';
import { Note } from 'src/database/entities/core-app-entities/note.entity';

export interface ActivityWithNote {
  activity: LeadActivity;
  note: Note | null;
}
