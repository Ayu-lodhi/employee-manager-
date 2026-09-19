import { startScheduler } from './jobs/scheduler.js';
import { startNotificationWorker } from './workers/notification.worker.js';
import { startCertificateWorker } from './workers/certificate.worker.js';

console.log('Starting TBI Background Workers...');

async function main() {
  await startScheduler();
  startNotificationWorker();
  startCertificateWorker();
  console.log('All workers and schedulers running.');
}

main().catch(err => {
  console.error('Worker failed to start', err);
  process.exit(1);
});
