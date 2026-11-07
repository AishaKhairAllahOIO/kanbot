import type { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className="z-popover max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-64 break-words overflow-y-auto rounded-sm bg-raised px-2 py-1 text-caption text-ink shadow-pop"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-raised" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
