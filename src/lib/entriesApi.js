import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

// Entries live under users/{uid}/entries (per-user)
function entriesCol(uid) {
  return collection(db, 'users', uid, 'entries');
}

function entryDoc(uid, entryId) {
  return doc(db, 'users', uid, 'entries', entryId);
}

function opeaCol(uid, entryId) {
  return collection(db, 'users', uid, 'entries', entryId, 'opea');
}

function opeaDoc(uid, entryId, opeaId) {
  return doc(db, 'users', uid, 'entries', entryId, 'opea', opeaId);
}

export async function createEntry(uid, data) {
  const entry = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(entriesCol(uid), entry);
  return { id: ref.id, ...entry };
}

export async function updateEntry(uid, entryId, data) {
  await updateDoc(entryDoc(uid, entryId), data);
}

export async function loadEntries(uid) {
  const q = query(
    entriesCol(uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteEntry(uid, entryId) {
  const opeaSnap = await getDocs(opeaCol(uid, entryId));
  await Promise.all(opeaSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(entryDoc(uid, entryId));
}

export async function clearAllEntries(uid) {
  const entries = await loadEntries(uid);
  await Promise.all(entries.map(e => deleteEntry(uid, e.id)));
}

export async function createOpea(uid, aaaId, data) {
  const opea = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(opeaCol(uid, aaaId), opea);
  return { id: ref.id, ...opea };
}

export async function updateOpea(uid, aaaId, opeaId, data) {
  await updateDoc(opeaDoc(uid, aaaId, opeaId), data);
}

export async function loadOpea(uid, aaaId) {
  const snap = await getDocs(opeaCol(uid, aaaId));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function loadOpeaForEdit(uid, aaaId, opeaId) {
  const snap = await getDoc(opeaDoc(uid, aaaId, opeaId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
