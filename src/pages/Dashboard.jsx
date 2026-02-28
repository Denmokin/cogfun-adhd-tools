import { Link } from "react-router-dom";
import { useAuth } from "@/auth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="card">
          <h2>🧠 AAA + OPEA</h2>
          <p>שלום {user?.displayName || user?.email}</p>
          <p style={{ marginTop: 12, color: 'var(--text-2)' }}>
            Anticipatory Adaptive Awareness · Occupational Performance Experience Analysis
          </p>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/aaa" className="btn-edit" style={{ display: 'inline-block' }}>
              📌 AAA – מודעות מנבאת מסתגלת
            </Link>
            <Link to="/opea" className="btn-opea" style={{ display: 'inline-block' }}>
              📋 OPEA – ניתוח התנסות תפקודית
            </Link>
            <Link to="/results" className="btn-logout" style={{ display: 'inline-block', textDecoration: 'none' }}>
              📊 תוצאות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
