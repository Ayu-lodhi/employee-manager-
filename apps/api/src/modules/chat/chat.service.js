import { chatRepository } from './chat.repository.js';
import { logger } from '../../core/utils/logger.js';

export class ChatService {
  constructor(repository = chatRepository) {
    this.repository = repository;
  }

  async getById(id) {
    return this.repository.findById(id);
  }
}

export const chatService = new ChatService();
