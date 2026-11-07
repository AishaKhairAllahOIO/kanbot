import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Mail,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";
import { getErrorMessage } from "@/shared/api/errors";
import { Topbar } from "@/app/layouts/AppLayout/shared/topbar/Topbar";
import { ProfileStatusPicker } from "../components/ProfileStatusPicker";
import { useProfilePhoto } from "../hooks/useProfilePhoto";
import { useMe } from "@/features/auth/hooks/useMe";
import { copyText } from "@/features/ai/utils/clipboard";
import { Tooltip } from "@/shared/components/Tooltip";
import { MyWeekSection } from "../components/MyWeekSection";
import { ReminderSettingsCard } from "@/features/notifications/components/ReminderSettingsCard";

export function ProfilePage() {
  const { user, isLoading } = useAuth();
  const meQuery = useMe();
  const { photo, error, savePhoto, removePhoto } = useProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [copiedField, setCopiedField] = useState<"name" | "email" | null>(null);
  const [copyError, setCopyError] = useState("");
  const copyTimeout = useRef<number | null>(null);
  const [removePhotoOpen, setRemovePhotoOpen] = useState(false);

  useEffect(
    () => () => {
      if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current);
    },
    [],
  );

  async function copyProfileValue(
    value: string,
    label: string,
    field: "name" | "email",
  ) {
    if (copyTimeout.current !== null) window.clearTimeout(copyTimeout.current);
    const copied = await copyText(value);
    setCopyStatus(copied ? `${label} copied.` : `Could not copy ${label.toLowerCase()}.`);
    setCopiedField(copied ? field : null);
    setCopyError(copied ? "" : label);
    copyTimeout.current = window.setTimeout(() => {
      setCopiedField(null);
      setCopyError("");
      copyTimeout.current = null;
    }, 2000);
  }

  if (isLoading) return <Topbar title="Profile" />;

  if (!user) {
    return (
      <>
        <Topbar title="Profile" />
        <main className="page-gutter">
          <EmptyState
            title="Profile could not be loaded"
            description={getErrorMessage(
              meQuery.error ?? new Error("Your account is unavailable."),
            )}
            error
            action={
              <Button onClick={() => void meQuery.refetch()}>Try again</Button>
            }
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Profile" />
      <main className="page-gutter mx-auto grid w-full max-w-4xl gap-6 py-6 pb-10">
        <header className="grid gap-1 border-b border-line pb-5">
          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-brand-ink">
            <UserRound aria-hidden="true" className="size-4" />
            Account settings
          </div>
          <h1 className="font-heading text-title font-semibold tracking-tight text-ink">
            Your profile
          </h1>
          <p className="max-w-2xl text-body text-muted">
            Manage how you appear in Kanbot and personalize your workspace.
          </p>
        </header>

        <section
          aria-labelledby="profile-identity-heading"
          className="theme-card relative isolate overflow-hidden rounded-lg border border-line"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-brand-soft via-surface to-info/10">
            <svg
              viewBox="0 0 1440 180"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full text-brand-ink"
            >
              <path
                d="M0 108c190-43 300 32 486 15s267-47 457-26 322 59 497 25v58H0Z"
                fill="currentColor"
                opacity=".11"
              />
              <path
                d="M0 132c188-35 303 20 493 10s302-38 470-25 284 53 477 27v37H0Z"
                fill="currentColor"
                opacity=".14"
              />
              <path
                d="M0 153c184-20 305 10 501 3s300-20 470-12 283 32 469 16v22H0Z"
                fill="currentColor"
                opacity=".1"
              />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="relative shrink-0 self-center rounded-full bg-surface p-1 shadow-card sm:self-auto">
              <ProfileStatusPicker
                name={user.name}
                photo={photo}
                avatarClassName="size-28 sm:size-36"
              />
            </div>

            <div className="grid min-w-0 flex-1 justify-items-center gap-4 text-center sm:justify-items-start sm:text-start">
              <div className="min-w-0">
                <p className="mb-1 text-caption font-medium text-brand-ink">KANBOT ACCOUNT</p>
                <h2
                  id="profile-identity-heading"
                  className="flex min-w-0 items-center justify-center gap-1 font-heading text-heading font-semibold text-ink sm:justify-start sm:text-title"
                >
                  <span className="truncate">{user.name}</span>
                  <Tooltip
                    content={
                      copiedField === "name"
                        ? "Copied"
                        : copyError === "Full name"
                          ? "Could not copy full name"
                          : "Copy full name"
                    }
                  >
                    <button
                      type="button"
                      aria-label={copiedField === "name" ? "Copied" : "Copy full name"}
                      onClick={() => void copyProfileValue(user.name, "Full name", "name")}
                      className="grid size-8 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-brand-ink"
                    >
                      {copiedField === "name" ? (
                        <Check aria-hidden="true" className="size-4 text-success" />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </Tooltip>
                </h2>
                <p className="mt-1 flex min-w-0 items-center justify-center gap-1.5 text-small text-muted sm:justify-start">
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                  <Tooltip
                    content={
                      copiedField === "email"
                        ? "Copied"
                        : copyError === "Email address"
                          ? "Could not copy email address"
                          : "Copy email address"
                    }
                  >
                    <button
                      type="button"
                      aria-label={copiedField === "email" ? "Copied" : "Copy email address"}
                      onClick={() => void copyProfileValue(user.email, "Email address", "email")}
                      className="grid size-8 shrink-0 place-content-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-brand-ink"
                    >
                      {copiedField === "email" ? (
                        <Check aria-hidden="true" className="size-4 text-success" />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </Tooltip>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Button
                  type="button"
                  leadingIcon={<Upload aria-hidden="true" className="size-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo ? "Change photo" : "Upload photo"}
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    leadingIcon={<X aria-hidden="true" className="size-4" />}
                    onClick={() => setRemovePhotoOpen(true)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
            aria-label="Choose a profile photo"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void savePhoto(file);
              event.currentTarget.value = "";
            }}
          />

          {error && (
            <p role="alert" className="border-t border-danger/20 bg-danger/5 px-5 py-3 text-small text-danger sm:px-7">
              {error}
            </p>
          )}
        </section>
        <MyWeekSection />
        <ReminderSettingsCard />
        <Modal
          open={removePhotoOpen}
          onOpenChange={setRemovePhotoOpen}
          title="Remove profile photo?"
          description="Your photo will be removed from this browser. You can upload another one at any time."
          size="confirm"
        >
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setRemovePhotoOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                removePhoto();
                setRemovePhotoOpen(false);
              }}
            >
              Remove photo
            </Button>
          </div>
        </Modal>
        <p className="sr-only" role="status" aria-live="polite">{copyStatus}</p>
      </main>
    </>
  );
}
