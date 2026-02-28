import { Outlet } from "react-router-dom";
import Topbar from "../components/Topbar";
import { useAuth } from "@/auth";
import { useTheme } from "@/hooks";

export default function AuthedLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page">
      <Topbar
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
