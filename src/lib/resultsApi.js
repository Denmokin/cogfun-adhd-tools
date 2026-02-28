import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function saveResult({ uid, tool, payload }) {
  const col = collection(db, "users", uid, "results");
  const docRef = await addDoc(col, {
    tool,                // "AAA" | "OPEA"
    payload,             // answers/scores form data
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}