import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { getErrorMessage } from "../../../shared/api/errors";
import type { Sprint, SprintBoardResponse } from "../../../shared/types/api";
import { Button } from "../../../shared/components/Button";
import { Field, SelectInput } from "../../../shared/components/Field";
import { Modal } from "../../../shared/components/Modal";
import { useSummarizeSprint } from "../../ai/hooks/useSummarizeSprint";
import { AiErrorState } from "../../ai/components/AiErrorState";
import { useCompleteSprint } from "../../sprints/hooks/useCompleteSprint";

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
  const doneCount = board.columns.done.length;
  const notDoneCount = Object.values(board.columns).flat().length - doneCount;

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
      <form className="grid gap-4" onSubmit={complete}>
        <p className="rounded-sm bg-sunken p-3 text-body font-medium">
          {doneCount} done, {notDoneCount} not done
        </p>
        <Field id="unfinished-destination" label="Move unfinished todos to">
          <SelectInput
            id="unfinished-destination"
            value={moveUnfinishedTo}
            onChange={(event) => setMoveUnfinishedTo(event.target.value)}
          >
            <option value="backlog">Backlog</option>
            {plannedSprints.map((planned) => (
              <option key={planned.id} value={planned.id}>
                {planned.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <label className="flex items-start gap-2 text-small text-ink">
          <input
            type="checkbox"
            checked={generateSummary}
            disabled={sprintCompleted}
            onChange={(event) => setGenerateSummary(event.target.checked)}
            className="mt-0.5 size-4 accent-brand"
          />
          Generate AI summary
        </label>
        <p className="text-caption text-muted">
          AI can make mistakes. Review before saving.
        </p>
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        {summaryError && (
          <AiErrorState message={summaryError} onRetry={() => void retrySummary()} />
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
