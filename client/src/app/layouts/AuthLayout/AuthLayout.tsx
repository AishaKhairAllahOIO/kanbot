import { Outlet } from "react-router";
import { Logo } from "@/shared/components/Logo";

export function AuthLayout() {
  return (
    <main className="grid h-full min-h-0 overflow-y-auto place-items-center px-4 py-10">
      <div className="theme-card w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 flex items-center justify-center gap-4">
          <Logo size={64} />
          <div className="flex flex-col items-start">
            <span className="font-heading text-[2.5rem] font-bold leading-none tracking-tight">
              Kanbot
            </span>
            <span className="mt-2 text-small leading-none text-muted">
              Your sprint board with an AI teammate.
            </span>
          </div>
        </div>

        <Outlet />
      </div>
    </main>
  );
}