import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AAAPage from "./pages/AAAPage";
import OPEAPage from "./pages/OPEAPage";
import Results from "./pages/Results";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/aaa" element={<RequireAuth><AAAPage /></RequireAuth>} />
      <Route path="/opea" element={<RequireAuth><OPEAPage /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}