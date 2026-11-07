import axios from "axios";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { queryClient } from "@/app/providers/query-client";
import { toApiError } from "./errors";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
export { ApiError, fieldErrors } from "./errors";

const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

export async function request<T>(
  method: AxiosRequestConfig["method"],
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await api.request<T>({
      ...config,
      method,
      url: path,
      data: body,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    if (
      apiError.status === 401 &&
      axios.isAxiosError(error) &&
      !AUTH_ENDPOINTS.includes(error.config?.url ?? "")
    ) {
      const { token, expireSession } = useAuthStore.getState();
      if (token && error.config?.headers.Authorization === `Bearer ${token}`) {
        expireSession();
        queryClient.clear();
      }
    }

    return Promise.reject(apiError);
  },
);
