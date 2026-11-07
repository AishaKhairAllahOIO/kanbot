import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/queryKeys";
import { useAuthStore } from "../store/auth.store";
import { authApi } from "../api/auth.api";

export function useMe() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
    meta: { handledInline: true },
    select: (data) => data.user,
  });
}
