import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, from, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in error:", err);
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-box">
          <div className="login-header">
            <div className="login-spinner" />
            <h1>🧠 AAA + OPEA</h1>
            <p>טוען...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1>🧠 AAA + OPEA</h1>
          <p>Anticipatory Adaptive Awareness</p>
        </div>
        <div className="login-body">
          <p>כדי לגשת לטפסים יש להתחבר עם חשבון Google</p>
          <button
            type="button"
            className="btn btn-google"
            onClick={handleSignIn}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              width={20}
              height={20}
            />
            התחבר עם Google
          </button>
        </div>
      </div>
    </div>
  );
}
