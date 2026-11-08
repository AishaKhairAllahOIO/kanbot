import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";

export function SprintLoadError({
  message,
  onRetry,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Sprint could not be loaded"
      size="confirm"
    >
      <div className="grid gap-4">
        <EmptyState
          title="Sprint could not be loaded"
          description={message}
          error
          action={<Button onClick={onRetry}>Try again</Button>}
        />
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
