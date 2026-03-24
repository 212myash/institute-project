import { loginUser, registerUser } from './auth-example.js';
import { startAdminRequestPolling } from './admin-notifications.js';

async function runExamples() {
  console.log('Starting frontend API examples...');

  // Example register
  // await registerUser({
  //   name: 'New Student',
  //   email: '212myashraj@gmail.com',
  //   password: 'test123',
  //   role: 'student',
  // });

  // Example login
  // await loginUser({
  //   email: '212myashraj@gmail.com',
  //   password: 'test123',
  // });

  // Example admin polling for new contact requests
  // const pollingId = startAdminRequestPolling(30000);
  // clearInterval(pollingId); // call this when leaving admin page
}

runExamples().catch((error) => {
  console.error('Example runner failed:', error.message);
});
