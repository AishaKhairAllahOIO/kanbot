import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "../../../shared/api/errors";
import { queryKeys } from "../../../shared/api/queryKeys";
import { useAuthStore } from "../store/auth.store";
import type { AuthResponse, LoginRequest } from "../../../shared/types/api";
import { authApi } from "../api/auth.api";

export function useLogin() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation<AuthResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    meta: { handledInline: true },
    onSuccess: ({ token, user }) => {
      queryClient.setQueryData(queryKeys.auth.me, { user });
      setToken(token);
    },
  });
}
