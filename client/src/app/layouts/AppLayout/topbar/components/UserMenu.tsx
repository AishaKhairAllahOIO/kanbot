import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link } from "react-router";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useProfilePhoto } from "@/features/profile/hooks/useProfilePhoto";
import { LogoutConfirmationDialog } from "@/features/auth/components/LogoutConfirmationDialog";
import { paths } from "@/shared/config/paths";
import { prefetchRoute } from "@/app/providers/router/routeModules";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileStatusBadge } from "@/features/profile/components/ProfileStatusBadge";

export function UserMenu() {
  const { user } = useAuth();
  const { photo } = useProfilePhoto();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const name = user?.name ?? "Account";

  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Profile menu"
              className="topbar-action flex min-w-0 items-center gap-1 rounded-sm p-1 text-start hover:bg-sunken"
            >
              <span className="relative size-9 shrink-0 overflow-visible rounded-full">
                <ProfileAvatar name={name} photo={photo} />
                <ProfileStatusBadge />
              </span>
              <span className="flex min-w-0 max-w-24 flex-col sm:max-w-32">
              <span className="truncate text-caption font-medium text-ink">
                {name}
              </span>
              <span className="truncate text-caption text-muted">
                {user?.email ?? ""}
              </span>
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-popover rounded-md border border-line bg-surface p-1 shadow-pop"
            >
            <DropdownMenu.Item asChild>
              <Link
                to={paths.profile}
                onPointerEnter={() => prefetchRoute(paths.profile)}
                onFocus={() => prefetchRoute(paths.profile)}
                className="flex min-h-10 items-center gap-2 rounded-sm px-3 text-small text-ink outline-none hover:bg-sunken focus:bg-sunken"
              >
                <UserRound aria-hidden="true" className="size-4" />
                Profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                setOpen(false);
                setConfirmLogout(true);
              }}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-sm px-3 text-small text-danger outline-none hover:bg-sunken focus:bg-sunken"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Log out
            </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <LogoutConfirmationDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
      />
    </>
  );
}
