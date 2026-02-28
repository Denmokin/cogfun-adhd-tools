import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "./lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = () => signInWithPopup(auth, googleProvider);
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
