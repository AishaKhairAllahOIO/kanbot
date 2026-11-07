import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useCallback(() => {
    logout();
    queryClient.clear();
  }, [logout, queryClient]);
}
