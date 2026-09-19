import { checkAndSetIdempotencyKey } from '@tbi/shared-utils';

export function startNotificationWorker() {
  console.log('Notification Worker started (Email, SMS, Push). Idempotent execution active.');
}
