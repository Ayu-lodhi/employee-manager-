import { notificationsRepository } from './notifications.repository.js';
import { logger } from '../../core/utils/logger.js';

export class NotificationsService {
  constructor(repository = notificationsRepository) {
    this.repository = repository;
  }

  async getById(id) {
    return this.repository.findById(id);
  }
}

export const notificationsService = new NotificationsService();
