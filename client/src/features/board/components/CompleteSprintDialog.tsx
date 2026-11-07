import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { getErrorMessage } from "@/shared/api/errors";
import type { Sprint, SprintBoardResponse } from "@/shared/types/api";
import { Button } from "@/shared/components/Button";
import { Modal } from "@/shared/components/Modal";
import { useSummarizeSprint } from "@/features/ai/hooks/useSummarizeSprint";
import { AiErrorState } from "@/features/ai/components/AiErrorState";
import { useCompleteSprint } from "@/features/sprints/hooks/useCompleteSprint";

interface CompleteSprintDialogProps {
  open: boolean;
  sprint: Sprint;
  board: SprintBoardResponse;
  plannedSprints: Sprint[];
  onOpenChange: (open: boolean) => void;
}

export function CompleteSprintDialog({
  open,
  sprint,
  board,
  plannedSprints,
  onOpenChange,
}: CompleteSprintDialogProps) {
  const navigate = useNavigate();
  const sprintMutations = useCompleteSprint(sprint.projectId);
  const summarizeSprint = useSummarizeSprint();
  const [moveUnfinishedTo, setMoveUnfinishedTo] = useState("backlog");
  const [generateSummary, setGenerateSummary] = useState(false);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [sprintCompleted, setSprintCompleted] = useState(false);
  const allTodos = Object.values(board.columns).flat();
  const doneCount = board.columns.done.length;
  const notDoneCount = allTodos.length - doneCount;
  const totalPoints = allTodos.reduce(
    (sum, todo) => sum + (todo.storyPoints ?? 0),
    0,
  );
  const donePoints = board.columns.done.reduce(
    (sum, todo) => sum + (todo.storyPoints ?? 0),
    0,
  );

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSummaryError("");
    try {
      await sprintMutations.mutateAsync({
        sprintId: sprint.id,
        body: { moveUnfinishedTo },
      });
      if (generateSummary) {
        setSprintCompleted(true);
        try {
          await summarizeSprint.mutateAsync(sprint.id);
        } catch (summaryError) {
          setSummaryError(getErrorMessage(summaryError));
          return;
        }
      }
      onOpenChange(false);
      navigate(`/projects/${sprint.projectId}/sprints`);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }

  async function retrySummary() {
    setSummaryError("");
    try {
      await summarizeSprint.mutateAsync(sprint.id);
      onOpenChange(false);
      navigate(`/projects/${sprint.projectId}/sprints`);
    } catch (cause) {
      setSummaryError(getErrorMessage(cause));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setError("");
      setSummaryError("");
      setSprintCompleted(false);
      setGenerateSummary(false);
      setMoveUnfinishedTo("backlog");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={`Complete ${sprint.name}`}
      description="Choose where unfinished todos should go."
      size="form"
    >
      <form className="grid gap-5" onSubmit={complete}>
        <div className="grid gap-1">
          <p className="text-body font-medium text-ink">
            {doneCount} todos done, {notDoneCount} not finished
          </p>
          <p className="text-small text-muted">
            {donePoints} of {totalPoints} story points completed.
          </p>
        </div>

        <fieldset className="grid gap-3">
          <legend className="mb-3 text-small font-medium text-ink">
            Move unfinished to:
          </legend>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <label className="flex items-center gap-2 text-body text-ink">
              <input
                type="radio"
                name="unfinished-destination"
                value="backlog"
                checked={moveUnfinishedTo === "backlog"}
                onChange={(event) => setMoveUnfinishedTo(event.target.value)}
                className="size-4 accent-brand"
              />
              Backlog
            </label>
            {plannedSprints.map((planned) => (
              <label
                key={planned.id}
                className="flex items-center gap-2 text-body text-ink"
              >
                <input
                  type="radio"
                  name="unfinished-destination"
                  value={planned.id}
                  checked={moveUnfinishedTo === planned.id}
                  onChange={(event) => setMoveUnfinishedTo(event.target.value)}
                  className="size-4 accent-brand"
                />
                {planned.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-1 border-t border-line pt-4">
          <label className="flex items-center gap-2 text-body text-ink">
            <input
              type="checkbox"
              checked={generateSummary}
              disabled={sprintCompleted}
              onChange={(event) => setGenerateSummary(event.target.checked)}
              className="size-4 accent-brand"
            />
            Generate AI summary
          </label>
          <p className="ps-6 text-caption text-muted">
            Opens the summary in Sprints history. AI can make mistakes, review
            before saving.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        {summaryError && (
          <AiErrorState
            message={summaryError}
            onRetry={() => void retrySummary()}
          />
        )}

        <footer className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={sprintMutations.isPending || summarizeSprint.isPending}
            disabled={sprintCompleted}
          >
            Complete sprint
          </Button>
        </footer>
      </form>
    </Modal>
  );
}