import { postToFacebook } from './src/server/facebook';

async function test() {
  console.log('Starting album test...');
  const res = await postToFacebook({
    id: 'test-album-' + Date.now(),
    title: 'تمارين تطبيقية حول الكسور والأعداد العشرية',
    grade: '5ème Année',
    subject: 'Math',
    trimester: 'Trimestre 1',
    topic: 'الكسور العشرية',
    authorName: 'Madrasti Admin',
    authorRole: 'admin',
    exerciseCount: 4,
    kind: 'sheet',
    sharePath: '/discovery?doc=test-album',
    thumb: '/uploads/1790893842048-73258a1a.jpg'
  });
  console.log('Result FB Post ID:', res);
}
test().catch(console.error);
