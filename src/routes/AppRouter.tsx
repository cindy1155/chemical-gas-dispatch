import { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

const authStorageKey = "chemical-gas-dispatch-auth";
const authRoleStorageKey = "chemical-gas-dispatch-role";
const authExpiresAtStorageKey = "chemical-gas-dispatch-auth-expires-at";
type AuthRole = "管理員" | "調度員" | "司機";

const clearAuthSession = () => {
  window.localStorage.removeItem(authStorageKey);
  window.localStorage.removeItem(authRoleStorageKey);
  window.localStorage.removeItem(authExpiresAtStorageKey);
};

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: AuthRole[];
  children: ReactElement;
}) {
  const isAuthenticated = window.localStorage.getItem(authStorageKey) === "authenticated";
  const currentRole = window.localStorage.getItem(authRoleStorageKey) as AuthRole | null;
  const expiresAt = Number(window.localStorage.getItem(authExpiresAtStorageKey) || "0");
  const isSessionActive = expiresAt > Date.now();

  if (!isAuthenticated || !currentRole || !isSessionActive || !allowedRoles.includes(currentRole)) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["管理員", "調度員"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
