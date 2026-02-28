import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "./lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          // Create user doc if missing
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            await setDoc(userRef, {
              name: u.displayName ?? "",
              email: u.email ?? "",
              photoURL: u.photoURL ?? "",
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (e) {
        // If rules block this, you'll see it in console
        console.error("AuthContext user doc error:", e);
      }

      setUser(u ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      logout: () => signOut(auth),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}