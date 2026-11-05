import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Sparkles } from 'lucide-react'
import { getErrorMessage } from '../../../shared/api/errors'
import type { ChatMessage } from '../../../shared/types/api'
import { Skeleton } from '../../../shared/components/Skeleton'
import { useAiChat } from '../hooks/useAiChat'
import { useAiStatus } from '../hooks/useAiStatus'
import { AiErrorState } from './AiErrorState'
import { AssistantComposer } from './AssistantComposer'
import { AssistantHeader } from './AssistantHeader'
import { AssistantMessage } from './AssistantMessage'

interface PendingAssistantPrompt {
  id: number
  projectId: string
  content: string
}

interface AssistantDrawerProps {
  open: boolean
  projectId: string | null
  activeSprintId: string | null
  pendingPrompt: PendingAssistantPrompt | null
  onOpenChange: (open: boolean) => void
  onPromptSent: (id: number) => void
  onCreateTodos: () => void
  onPlanSprint: () => void
  onSummarize: () => void
  dailyStandupPrompt: string
  dailyStandupDisabled: boolean
  dailyStandupError?: string
  onRetryDailyStandup: () => void
}

type RetryAction =
  | { type: 'send'; content: string }
  | { type: 'regenerate'; index: number }

const CHAT_STORAGE_KEY = 'kanbot:assistant-chat'

function emptyConversation() {
  return { messages: [] as ChatMessage[], draft: '' }
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<ChatMessage>
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  )
}

function loadConversation(projectId: string | null) {
  if (!projectId || typeof window === 'undefined') return emptyConversation()

  try {
    const saved = window.sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (!saved) return emptyConversation()

    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return emptyConversation()

    const value = parsed as { projectId?: unknown; messages?: unknown; draft?: unknown }
    if (value.projectId !== projectId || !Array.isArray(value.messages)) {
      return emptyConversation()
    }

    return {
      messages: value.messages.filter(isChatMessage),
      draft: typeof value.draft === 'string' ? value.draft : '',
    }
  } catch {
    return emptyConversation()
  }
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-2.5" role="status" aria-label="Loading assistant response">
      <Skeleton className="mt-0.5 size-8 shrink-0 rounded-md" />
      <div className="grid w-full max-w-[85%] gap-2 rounded-md bg-sunken px-3 py-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export function AssistantDrawer({
  open,
  projectId,
  activeSprintId,
  pendingPrompt,
  onOpenChange,
  onPromptSent,
  onCreateTodos,
  onPlanSprint,
  onSummarize,
  dailyStandupPrompt,
  dailyStandupDisabled,
  dailyStandupError,
  onRetryDailyStandup,
}: AssistantDrawerProps) {
  const [chatState, setChatState] = useState(() => ({
    projectId,
    ...loadConversation(projectId),
    error: '',
  }))
  const [animatedMessage, setAnimatedMessage] = useState<{ projectId: string; index: number } | null>(null)
  const [retry, setRetry] = useState<RetryAction | null>(null)
  const sendingRef = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)

  const statusQuery = useAiStatus()
  const chat = useAiChat(projectId ?? '')
  const { mutateAsync: sendChat } = chat
  const isSending = chat.isPending

  const messages = useMemo(
    () => chatState.projectId === projectId ? chatState.messages : [],
    [chatState.messages, chatState.projectId, projectId],
  )
  const draft = chatState.projectId === projectId ? chatState.draft : ''
  const sendError = chatState.projectId === projectId ? chatState.error : ''
  const latestAssistantIndex = messages.reduce(
    (latest, message, index) => (message.role === 'assistant' ? index : latest),
    -1,
  )

  useEffect(() => {
    setChatState((current) =>
      current.projectId === projectId
        ? current
        : { projectId, ...loadConversation(projectId), error: '' },
    )
    setAnimatedMessage(null)
    setRetry(null)
  }, [projectId])

  useEffect(() => {
    if (!chatState.projectId) return
    try {
      window.sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          projectId: chatState.projectId,
          messages: chatState.messages,
          draft: chatState.draft,
        }),
      )
    } catch {
      // Keep the conversation available in memory if browser storage is unavailable.
    }
  }, [chatState])

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' })
  }, [messages, isSending])

  const requestReply = useCallback(
    async (conversation: ChatMessage[]) => {
      const response = await sendChat({ messages: conversation })
      return response.message
    },
    [sendChat],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim()
      if (!text || !projectId || sendingRef.current || chatState.projectId !== projectId) return

      const previousMessages = chatState.messages
      const conversation: ChatMessage[] = [...previousMessages, { role: 'user', content: text }]
      sendingRef.current = true
      setRetry(null)
      setChatState({ projectId, messages: conversation, draft: '', error: '' })

      try {
        const reply = await requestReply(conversation)
        setChatState((current) =>
          current.projectId === projectId
            ? { ...current, messages: [...conversation, reply], error: '' }
            : current,
        )
        setAnimatedMessage({ projectId, index: conversation.length })
      } catch (error) {
        setChatState((current) =>
          current.projectId === projectId
            ? {
                ...current,
                messages: previousMessages,
                draft: current.draft.trim() ? current.draft : text,
                error: getErrorMessage(error),
              }
            : current,
        )
        setRetry({ type: 'send', content: text })
      } finally {
        sendingRef.current = false
      }
    },
    [chatState.messages, chatState.projectId, projectId, requestReply],
  )

  const regenerate = useCallback(
    async (index: number) => {
      if (!projectId || sendingRef.current || chatState.projectId !== projectId) return

      const conversation = chatState.messages.slice(0, index)
      if (conversation.at(-1)?.role !== 'user') return

      sendingRef.current = true
      setRetry(null)
      setChatState((current) =>
        current.projectId === projectId ? { ...current, error: '' } : current,
      )

      try {
        const reply = await requestReply(conversation)
        setChatState((current) => {
          if (current.projectId !== projectId || current.messages[index]?.role !== 'assistant') {
            return current
          }
          const nextMessages = [...current.messages]
          nextMessages[index] = reply
          return { ...current, messages: nextMessages, error: '' }
        })
        setAnimatedMessage({ projectId, index })
      } catch (error) {
        setChatState((current) =>
          current.projectId === projectId
            ? { ...current, error: getErrorMessage(error) }
            : current,
        )
        setRetry({ type: 'regenerate', index })
      } finally {
        sendingRef.current = false
      }
    },
    [chatState.messages, chatState.projectId, projectId, requestReply],
  )

  const retryLastAction = useCallback(() => {
    if (!retry) return
    if (retry.type === 'send') {
      void sendMessage(retry.content)
    } else {
      void regenerate(retry.index)
    }
  }, [regenerate, retry, sendMessage])

  const startNewChat = useCallback(() => {
    setAnimatedMessage(null)
    setRetry(null)
    setChatState({ projectId, messages: [], draft: '', error: '' })
  }, [projectId])

  useEffect(() => {
    if (!pendingPrompt) return
    if (pendingPrompt.projectId !== projectId) {
      onPromptSent(pendingPrompt.id)
      return
    }
    if (!open || isSending || chatState.projectId !== projectId) return

    const timer = window.setTimeout(() => {
      onPromptSent(pendingPrompt.id)
      void sendMessage(pendingPrompt.content)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [
    chatState.projectId,
    isSending,
    onPromptSent,
    open,
    pendingPrompt,
    projectId,
    sendMessage,
  ])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-drawer bg-overlay lg:bg-transparent" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-drawer flex max-h-dvh min-h-0 w-full max-w-[32rem] flex-col border-l border-line bg-surface shadow-modal">
          <AssistantHeader
            mock={statusQuery.data?.mode === 'mock'}
            statusLoading={statusQuery.isPending}
            onNewChat={startNewChat}
            onCreateTodos={onCreateTodos}
            onPlanSprint={onPlanSprint}
            onSummarize={onSummarize}
            summarizeDisabled={!activeSprintId}
            onDailyStandup={() => void sendMessage(dailyStandupPrompt)}
            dailyStandupDisabled={dailyStandupDisabled || !dailyStandupPrompt || isSending}
          />

          {statusQuery.isError && (
            <div className="shrink-0 border-b border-line px-4 py-2">
              <AiErrorState
                message={getErrorMessage(statusQuery.error)}
                onRetry={() => void statusQuery.refetch()}
              />
            </div>
          )}
          {dailyStandupError && (
            <div className="shrink-0 border-b border-line px-4 py-2">
              <AiErrorState
                message={dailyStandupError}
                onRetry={onRetryDailyStandup}
              />
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages.length === 0 && !isSending && (
                <div className="grid justify-items-center gap-3 py-12 text-center">
                  <span className="grid size-12 place-content-center rounded-md bg-brand-soft text-brand-ink">
                    <Sparkles aria-hidden="true" className="size-5" />
                  </span>
                  <div className="grid gap-1">
                    <p className="font-heading text-subheading font-semibold text-ink">
                      How can I help?
                    </p>
                    <p className="max-w-prose text-body text-muted">
                      Ask about your backlog, sprint, or what to work on next.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <AssistantMessage
                  key={`${index}-${message.role}-${message.content}`}
                  message={message}
                  animate={
                    animatedMessage?.projectId === projectId &&
                    animatedMessage.index === index
                  }
                  isLatest={index === latestAssistantIndex}
                  busy={isSending}
                  onRegenerate={() => void regenerate(index)}
                />
              ))}

              {isSending && <ThinkingIndicator />}
            </div>
            <div ref={endRef} />
          </div>

          <div className="shrink-0 border-t border-line px-4 py-3">
            {sendError && (
              <AiErrorState
                className="mb-3"
                message={sendError}
                onRetry={retryLastAction}
              />
            )}
            <AssistantComposer
              value={draft}
              onChange={(value) =>
                setChatState((current) =>
                  current.projectId === projectId
                    ? { ...current, draft: value }
                    : current,
                )
              }
              onSubmit={() => void sendMessage(draft)}
              disabled={isSending}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
