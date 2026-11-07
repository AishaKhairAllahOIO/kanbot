import { useCallback } from "react";
import { useNavigate } from "react-router";
import { paths } from "@/shared/config/paths";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useMe } from "@/features/auth/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useLogout";

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const sessionEnd = useAuthStore((state) => state.sessionEnd);
  const { data: user, isPending } = useMe();
  const logoutSession = useLogout();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    logoutSession();
    navigate(paths.login, { replace: true });
  }, [logoutSession, navigate]);

  return {
    user: token && user ? user : null,
    isAuthenticated: Boolean(token && user),
    isLoading: Boolean(token && isPending),
    sessionExpired: sessionEnd === "expired",
    logout,
  };
}
