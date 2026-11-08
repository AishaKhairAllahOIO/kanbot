import { Modal } from "@/shared/components/Modal";
import { Spinner } from "@/shared/components/Spinner";

export function DialogQueryLoading({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={title}
      size="confirm"
    >
      <div className="flex justify-center py-4">
        <Spinner label={title} />
      </div>
    </Modal>
  );
}
