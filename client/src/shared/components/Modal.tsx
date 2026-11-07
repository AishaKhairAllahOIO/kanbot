import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'confirm' | 'form' | 'wide' | 'details'
  bodyClassName?: string
  panelClassName?: string
}

const widths = {
  confirm: 'max-w-dialog-confirm',
  form: 'max-w-dialog-form',
  wide: 'max-w-dialog-wide',
  details: 'max-w-dialog-details',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'form',
  bodyClassName = 'min-h-0 flex-1 overflow-y-auto px-6 py-5',
  panelClassName = '',
}: ModalProps) {
  return (
    <Dialog.Root modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-dialog bg-overlay" />
        <Dialog.Content className={`dialog-panel ${widths[size]} ${panelClassName}`}>
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="grid min-w-0 gap-1">
              <Dialog.Title className="break-words font-heading text-heading font-semibold tracking-tight">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-small text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button type="button" className="rounded-sm p-2 text-muted hover:bg-sunken" aria-label="Close dialog">
                <X aria-hidden="true" className="size-4" />
              </button>
            </Dialog.Close>
          </header>
          <div className={bodyClassName}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
