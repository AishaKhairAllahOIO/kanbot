import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ProfileStatusClearAfter } from '../hooks/ProfileStatusContext'
import { useProfileStatus } from '../hooks/useProfileStatus'
import { ProfileAvatar } from './ProfileAvatar'
import {
  getProfileStatusLabel,
  profileStatusClearAfterOptions,
  profileStatuses,
} from '../config/profileStatuses'

export function ProfileStatusPicker({
  name,
  photo,
  avatarClassName = 'size-16',
  compact = false,
}: {
  name: string
  photo: string | null
  avatarClassName?: string
  compact?: boolean
}) {
  const { value, error, setStatus, clearStatus } = useProfileStatus()
  const [selectedClearAfter, setSelectedClearAfter] =
    useState<ProfileStatusClearAfter>(value?.clearAfter ?? '1h')
  const activeStatus = profileStatuses.find(({ id }) => id === value?.status)
  const ActiveIcon = activeStatus?.icon
  const clearAfterLabel =
    profileStatusClearAfterOptions.find(({ value: option }) => option === selectedClearAfter)?.label ?? '1 hour'

  return (
    <DropdownMenu.Root>
      <div className={`relative shrink-0 ${compact ? 'size-8' : avatarClassName}`}>
        <ProfileAvatar
          name={name}
          photo={photo}
          className={compact ? '' : 'text-heading font-semibold'}
        />
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={`Set status. Current: ${getProfileStatusLabel(value?.status)}`}
            className={`absolute grid place-content-center rounded-full border-2 border-surface shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              compact ? '-bottom-0.5 -end-0.5 size-3.5' : 'bottom-0 end-0 size-6'
            } ${activeStatus?.color ?? 'bg-muted'}`}
          >
            {!compact && ActiveIcon && (
              <ActiveIcon aria-hidden="true" className="size-3.5 text-white" />
            )}
            {!compact && !activeStatus && (
              <span aria-hidden="true" className="size-2 rounded-full bg-surface" />
            )}
          </button>
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="z-popover w-64 rounded-md border border-line bg-raised p-1.5 shadow-pop"
        >
          <DropdownMenu.Label className="px-2.5 pb-1.5 pt-2 text-caption font-medium text-muted">
            What are you up to?
          </DropdownMenu.Label>
          {profileStatuses.map(({ id, label, color, icon: Icon }) => (
            <DropdownMenu.Item
              key={id}
              onSelect={() => setStatus(id, selectedClearAfter)}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-small text-ink outline-none hover:bg-sunken focus:bg-sunken"
            >
              <span className={`grid size-8 shrink-0 place-content-center rounded-full text-white ${color}`}>
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1">{label}</span>
              {value?.status === id && (
                <Check aria-hidden="true" className="size-4 text-brand-ink" />
              )}
            </DropdownMenu.Item>
          ))}
          {value && (
            <>
              <DropdownMenu.Separator className="my-1.5 h-px bg-line" />
              <DropdownMenu.Item
                onSelect={clearStatus}
                className="flex min-h-9 cursor-pointer items-center rounded-sm px-2.5 text-small text-muted outline-none hover:bg-sunken hover:text-ink focus:bg-sunken"
              >
                Clear status
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1.5 h-px bg-line" />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className="flex min-h-9 cursor-pointer items-center justify-between rounded-sm px-2.5 text-small text-muted outline-none hover:bg-sunken hover:text-ink focus:bg-sunken">
              <span>Clear after</span>
              <span>{clearAfterLabel}</span>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={6}
                className="z-popover min-w-40 rounded-md border border-line bg-raised p-1 shadow-pop"
              >
                {profileStatusClearAfterOptions.map(({ value: option, label }) => (
                  <DropdownMenu.Item
                    key={option}
                    onSelect={() => setSelectedClearAfter(option)}
                    className="flex min-h-9 cursor-pointer items-center justify-between rounded-sm px-2.5 text-small text-ink outline-none hover:bg-sunken focus:bg-sunken"
                  >
                    {label}
                    {selectedClearAfter === option && (
                      <Check aria-hidden="true" className="size-4 text-brand-ink" />
                    )}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          {error && (
            <p role="alert" className="px-2.5 pb-1 pt-2 text-caption text-danger">
              {error}
            </p>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
