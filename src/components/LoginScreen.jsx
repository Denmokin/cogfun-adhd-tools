import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen({ visible }) {
  if (!visible) return null;

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());

  return (
    <div id="loginScreen" style={{ display: 'flex' }}>
      <div className="login-box">
        <div className="login-header">
          <h1>AAA OPEA</h1>
          <p>Anticipatory Adaptive Awareness</p>
        </div>
        <div className="login-body">
          <p>התחבר עם חשבון Google כדי להמשיך</p>
          <button className="btn-google" onClick={handleLogin}>
            <img
              src="https://www.gstatic.com/firebasejsui/2.0.0/images/auth/google.svg"
              width="20"
              alt="Google logo"
            />
            התחבר עם Google
          </button>
        </div>
      </div>
    </div>
  );
}
