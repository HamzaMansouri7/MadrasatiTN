/**
 * One-off migration script for Teacher Cards in Firestore.
 * Removes deprecated fields (coursesCount, exercisesCount, rating, reviewsCount, verifiedBadge)
 * and sets default verified: 'none' where missing.
 * 
 * Run with: npx tsx scripts/migrate-teacher-cards.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  // Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials if deployed on server
  initializeApp();
}

const db = getFirestore();

async function migrateTeacherCards() {
  console.log('Starting teacher cards migration...');
  const snapshot = await db.collection('teachers').get();
  
  console.log(`Found ${snapshot.docs.length} teacher documents.`);
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates: Record<string, any> = {
      coursesCount: FieldValue.delete(),
      exercisesCount: FieldValue.delete(),
      rating: FieldValue.delete(),
      reviewsCount: FieldValue.delete(),
      studentsCount: FieldValue.delete(),
      verifiedBadge: FieldValue.delete(),
      updatedAt: Date.now(),
    };

    if (!data['verified']) {
      updates['verified'] = 'none';
    }
    if (!data['displayName'] && data['name']) {
      updates['displayName'] = data['name'];
    }

    await doc.ref.update(updates);
    count++;
  }

  console.log(`Successfully migrated ${count} teacher documents.`);
}

migrateTeacherCards().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
