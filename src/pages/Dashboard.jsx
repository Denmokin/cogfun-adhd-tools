import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 40 }}>
      <h2>Dashboard</h2>
      <p>Welcome {user?.displayName}</p>
      <p>{user?.email}</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link to="/aaa">AAA</Link>
        <Link to="/opea">OPEA</Link>
        <Link to="/results">Results</Link>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}