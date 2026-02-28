import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/auth";
import AuthedLayout from "./layout/AuthedLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AAAPage from "./pages/AAAPage";
import OPEAPage from "./pages/OPEAPage";
import Results from "./pages/Results";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AuthedLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<AAAPage />} />
        <Route path="/aaa" element={<AAAPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/opea" element={<OPEAPage />} />
        <Route path="/results" element={<Results />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}