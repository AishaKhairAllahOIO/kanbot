import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Field, TextInput } from "@/shared/components/Field";
import { toApiError } from "@/shared/api/errors";
import { paths } from "@/shared/config/paths";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLogin } from "../hooks/useLogin";
import { loginSchema, type LoginValues } from "../schemas/auth.schemas";
import { applyServerErrors } from "../utils/applyServerErrors";

export function LoginForm() {
  const sessionExpired = useAuthStore(
    (state) => state.sessionEnd === "expired",
  );
  const login = useLogin();
  const [formError, setFormError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    try {
      await login.mutateAsync(values);
    } catch (error) {
      const apiError = toApiError(error);
      if (!applyServerErrors(apiError, ["email", "password"], setError)) {
        setFormError(apiError.message);
      }
    }
  });

  return (
    <div className="grid gap-6">
      <h1 className="text-center font-heading text-title font-semibold text-ink">
        Welcome back
      </h1>
      {formError ? (
        <Alert>{formError}</Alert>
      ) : (
        sessionExpired && (
          <Alert variant="warning">
            Your session has expired. Please log in again.
          </Alert>
        )
      )}
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <Field id="email" label="Email" error={errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <div className="relative">
            <TextInput
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={login.isPending}
          className="w-full"
        >
          Log in
        </Button>
      </form>
      <p className="text-center text-small text-ink">
        No account?{" "}
        <Link to={paths.register} className="underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
