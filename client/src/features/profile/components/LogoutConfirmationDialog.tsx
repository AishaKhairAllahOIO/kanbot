import { LogOut } from 'lucide-react'
import { useAuth } from '@/app/hooks/useAuth'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'

interface LogoutConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
}: LogoutConfirmationDialogProps) {
  const { logout } = useAuth()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Log out?"
      description="Are you sure you want to log out?"
      size="confirm"
    >
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          leadingIcon={<LogOut aria-hidden="true" className="size-4" />}
          onClick={logout}
        >
          Log out
        </Button>
      </div>
    </Modal>
  )
}
