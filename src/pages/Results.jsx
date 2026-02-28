import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";

export default function Results() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "users", user.uid, "results"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user.uid]);

  return (
    <div style={{ padding: 40 }}>
      <h2>Results</h2>

      {items.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.id} style={{ marginBottom: 10 }}>
              <b>{r.tool}</b>{" "}
              — {r.createdAt?.toDate?.().toLocaleString?.() || "…"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}