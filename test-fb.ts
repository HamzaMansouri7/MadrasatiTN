import { config } from 'dotenv';
config(); // load .env

import { postToFacebook } from './src/server/facebook';

async function main() {
  console.log('Testing FB Post...');
  await postToFacebook({
    id: `test-exercise-${Date.now()}`,
    title: 'تمرين رياضيات - الكسور',
    grade: '5ème Année',
    subject: 'Math',
    kind: 'exercise',
    sharePath: '/discovery?doc=test1234'
  });
  console.log('Done!');
}

main().catch(console.error);
