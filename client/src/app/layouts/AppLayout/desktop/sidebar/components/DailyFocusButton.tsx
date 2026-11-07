import { useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Modal } from '@/shared/components/Modal'
import { DailyQuote } from './DailyQuote'

export function DailyFocusButton({
  className,
  showLabel = false,
}: {
  className: string
  showLabel?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Open daily focus"
        title="Daily focus"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Lightbulb aria-hidden="true" className="size-5 shrink-0 text-star" />
        {showLabel && <span>Daily focus</span>}
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Daily focus"
        size="confirm"
        bodyClassName="min-h-0 flex-1 px-5 py-4"
      >
        <DailyQuote />
      </Modal>
    </>
  )
}
