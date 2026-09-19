import { BaseRepository } from '../../core/database/BaseRepository.js';
import { EventsModel } from './events.model.js';

export class EventsRepository extends BaseRepository {
  constructor() {
    super(EventsModel);
  }
}

export const eventsRepository = new EventsRepository();
