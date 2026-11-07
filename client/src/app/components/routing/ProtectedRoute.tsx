import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/app/hooks/useAuth";
import { paths } from "@/shared/config/paths";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { buildLoginPath } from "@/app/navigation";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const sessionEnd = useAuthStore((state) => state.sessionEnd);
  const location = useLocation();

  if (!isAuthenticated) {
    const to =
      sessionEnd === "logout"
        ? paths.login
        : buildLoginPath(`${location.pathname}${location.search}`);
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
