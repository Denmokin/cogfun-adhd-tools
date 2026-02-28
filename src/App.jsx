import { useEffect, useState } from "react";
import { auth, googleProvider } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>COGFUN ADHD Tools</h1>
        <button onClick={() => signInWithPopup(auth, googleProvider)}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Welcome {user.displayName}</h2>
      <p>{user.email}</p>
      <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
}