import { BaseRepository } from '../../core/database/BaseRepository.js';
import { AuthModel } from './auth.model.js';

export class AuthRepository extends BaseRepository {
  constructor() {
    super(AuthModel);
  }
}

export const authRepository = new AuthRepository();
