import { Task } from 'src/database/entity/core-app/task.entity';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';

@EventSubscriber()
export class TaskSubscriber implements EntitySubscriberInterface<Task> {
  listenTo() {
    return Task;
  }

  afterInsert(event: InsertEvent<Task>) {
    console.log(`[${event.connection.options.schema}] Task Inserted:`, event.entity);
  }

  afterUpdate(event: UpdateEvent<Task>) {
    console.log(`[${event.connection.options.schema}] Task Updated:`, event.entity);
  }

  afterRemove(event: RemoveEvent<Task>) {
    console.log(`[${event.connection.options.schema}] Task Deleted:`, event.entityId);
  }
}
