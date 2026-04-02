import { doc, setDoc, getDoc, collection, 
    query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { REVISION_INTERVALS } from '../config';

export async function scheduleRevision(userId, noteId) {
const docId = `${userId}_${noteId}`;
const ref = doc(db, 'revisionSchedule', docId);
const existing = await getDoc(ref);
const count = existing.exists() 
? (existing.data().revisionCount || 0) : 0;
const daysAhead = REVISION_INTERVALS[
Math.min(count, REVISION_INTERVALS.length - 1)
];
const nextDate = new Date();
nextDate.setDate(nextDate.getDate() + daysAhead);
const nextStr = nextDate.toISOString().split('T')[0];
await setDoc(ref, {
userId, noteId,
nextRevision: nextStr,
revisionCount: count + 1,
lastRevised: new Date().toISOString()
});
return nextStr;
}

export async function getDueRevisions(userId) {
const today = new Date().toISOString().split('T')[0];
const q = query(
collection(db, 'revisionSchedule'),
where('userId', '==', userId),
where('nextRevision', '<=', today)
);
const snap = await getDocs(q);
return snap.docs.map(d => d.data());
}

export async function getNextRevisionDate(userId, noteId) {
const ref = doc(db, 'revisionSchedule', `${userId}_${noteId}`);
const snap = await getDoc(ref);
return snap.exists() ? snap.data().nextRevision : null;
}