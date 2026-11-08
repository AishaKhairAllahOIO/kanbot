import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Modal } from "@/shared/components/Modal";

export function NoPlannedSprint({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal open onOpenChange={onOpenChange} title="Start sprint" size="confirm">
      <div className="grid gap-4">
        <EmptyState
          title="No sprint is ready to start"
          description="Create a planned sprint before starting one."
        />
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
