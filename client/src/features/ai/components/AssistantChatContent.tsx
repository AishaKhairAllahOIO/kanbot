import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Bot } from 'lucide-react'
import { getErrorMessage } from '../../../shared/api/errors'
import type { ChatMessage } from '../../../shared/types/api'
import { useAiChat } from '../hooks/useAiChat'
import { AiErrorState } from './AiErrorState'
import { AssistantComposer } from './AssistantComposer'
import { AssistantMessage } from './AssistantMessage'

interface PendingAssistantPrompt {
  id: number
  projectId: string
  content: string
  todoReference?: TodoReference
}

interface TodoReference {
  todoId: string
  key: string
}

interface AssistantChatContentProps {
  active: boolean
  projectId: string | null
  pageContext: 'backlog' | 'board' | 'other'
  pendingPrompt: PendingAssistantPrompt | null
  onPromptSent: (id: number) => void
  newChatActionRef: { current: (() => void) | null }
  onOpenTodo: (todoId: string) => void
}

type RetryAction =
  | { type: 'send'; content: string; todoReference?: TodoReference }
  | { type: 'regenerate'; index: number }

const LEGACY_CHAT_STORAGE_KEY = 'kanbot:assistant-chat'

function getChatStorageKey(projectId: string) {
  return `${LEGACY_CHAT_STORAGE_KEY}:${encodeURIComponent(projectId)}`
}

function emptyConversation() {
  return { messages: [] as ChatMessage[], draft: '', todoReferences: {} as Record<number, TodoReference> }
}

function isTodoReference(value: unknown): value is TodoReference {
  if (!value || typeof value !== 'object') return false
  const reference = value as Partial<TodoReference>
  return typeof reference.todoId === 'string' && typeof reference.key === 'string'
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
    const storageKey = getChatStorageKey(projectId)
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      return parseConversation(saved, projectId)
    }

    const legacySaved = window.sessionStorage.getItem(LEGACY_CHAT_STORAGE_KEY)
    if (!legacySaved) return emptyConversation()

    const conversation = parseConversation(legacySaved, projectId)
    if (conversation.messages.length > 0 || conversation.draft || Object.keys(conversation.todoReferences).length > 0) {
      window.localStorage.setItem(storageKey, JSON.stringify({
        projectId,
        ...conversation,
      }))
    }
    return conversation
  } catch {
    return emptyConversation()
  }
}

function parseConversation(saved: string, projectId: string) {
  try {
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return emptyConversation()

    const value = parsed as {
      projectId?: unknown
      messages?: unknown
      draft?: unknown
      todoReferences?: unknown
    }
    if (value.projectId !== projectId || !Array.isArray(value.messages)) {
      return emptyConversation()
    }

    return {
      messages: value.messages.filter(isChatMessage),
      draft: typeof value.draft === 'string' ? value.draft : '',
      todoReferences:
        value.todoReferences && typeof value.todoReferences === 'object'
          ? Object.fromEntries(
              Object.entries(value.todoReferences).filter((entry): entry is [string, TodoReference] =>
                isTodoReference(entry[1]),
              ),
            )
          : {},
    }
  } catch {
    return emptyConversation()
  }
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-2.5" role="status" aria-label="Thinking">
      <span className="mt-0.5 grid size-8 shrink-0 place-content-center rounded-md bg-brand-soft text-brand-ink">
        <Bot aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-h-8 items-center gap-1.5 py-1.5 text-small font-medium text-brand-ink">
        <span>Thinking</span>
        <span aria-hidden="true" className="flex items-center gap-0.5">
          <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
          <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
          <span className="size-1 animate-bounce rounded-full bg-current" />
        </span>
      </div>
    </div>
  )
}

export function AssistantChatContent({
  active,
  projectId,
  pageContext,
  pendingPrompt,
  onPromptSent,
  newChatActionRef,
  onOpenTodo,
}: AssistantChatContentProps) {
  const [chatState, setChatState] = useState(() => ({
    projectId,
    ...loadConversation(projectId),
    error: '',
  }))
  const [storageError, setStorageError] = useState('')
  const [animatedMessage, setAnimatedMessage] = useState<{ projectId: string; index: number } | null>(null)
  const [retry, setRetry] = useState<RetryAction | null>(null)
  const sendingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesContentRef = useRef<HTMLDivElement>(null)
  const shouldStickToBottomRef = useRef(true)
  const composerRef = useRef<HTMLTextAreaElement>(null)

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
  const suggestedPrompts = pageContext === 'backlog'
    ? [
        'Which backlog items should I prioritize next, and why?',
        'Find gaps or duplicates in my backlog.',
        'Help me break down a backlog item into smaller tasks.',
      ]
    : pageContext === 'board'
      ? [
          'Summarize sprint progress and what is still at risk.',
          'Which tasks need attention to keep the sprint on track?',
          'What should the team focus on next?',
        ]
      : []

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
      window.localStorage.setItem(
        getChatStorageKey(chatState.projectId),
        JSON.stringify({
          projectId: chatState.projectId,
          messages: chatState.messages,
          draft: chatState.draft,
          todoReferences: chatState.todoReferences,
        }),
      )
      setStorageError('')
    } catch {
      setStorageError('Chat history could not be saved in this browser.')
    }
  }, [chatState])

  useLayoutEffect(() => {
    if (!active) return
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    shouldStickToBottomRef.current = true
    scrollContainer.scrollTop = scrollContainer.scrollHeight
  }, [active, projectId])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const messagesContent = messagesContentRef.current
    if (!active || !scrollContainer || !messagesContent) return

    const resizeObserver = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    })
    resizeObserver.observe(messagesContent)

    return () => resizeObserver.disconnect()
  }, [active, projectId])

  const requestReply = useCallback(
    async (conversation: ChatMessage[]) => {
      const response = await sendChat({ messages: conversation })
      return response.message
    },
    [sendChat],
  )

  const sendMessage = useCallback(
    async (content: string, todoReference?: TodoReference) => {
      const text = content.trim()
      if (!text || !projectId || sendingRef.current || chatState.projectId !== projectId) return

      const previousMessages = chatState.messages
      const conversation: ChatMessage[] = [...previousMessages, { role: 'user', content: text }]
      sendingRef.current = true
      setRetry(null)
      const todoReferences = { ...chatState.todoReferences }
      if (todoReference) todoReferences[previousMessages.length] = todoReference
      setChatState({ projectId, messages: conversation, draft: '', error: '', todoReferences })

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
                todoReferences: chatState.todoReferences,
              }
            : current,
        )
        setRetry({ type: 'send', content: text, todoReference })
      } finally {
        sendingRef.current = false
      }
    },
    [chatState.messages, chatState.projectId, chatState.todoReferences, projectId, requestReply],
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
      void sendMessage(retry.content, retry.todoReference)
    } else {
      void regenerate(retry.index)
    }
  }, [regenerate, retry, sendMessage])

  const startNewChat = useCallback(() => {
    setAnimatedMessage(null)
    setRetry(null)
    setChatState({ projectId, messages: [], draft: '', error: '', todoReferences: {} })
  }, [projectId])

  useEffect(() => {
    newChatActionRef.current = startNewChat
    return () => {
      if (newChatActionRef.current === startNewChat) {
        newChatActionRef.current = null
      }
    }
  }, [newChatActionRef, startNewChat])

  useEffect(() => {
    if (!pendingPrompt) return
    if (pendingPrompt.projectId !== projectId) {
      onPromptSent(pendingPrompt.id)
      return
    }
    if (!active || isSending || chatState.projectId !== projectId) return

    const timer = window.setTimeout(() => {
      onPromptSent(pendingPrompt.id)
      void sendMessage(pendingPrompt.content, pendingPrompt.todoReference)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [
    chatState.projectId,
    isSending,
    onPromptSent,
    active,
    pendingPrompt,
    projectId,
    sendMessage,
  ])

  return (
    <div className="ai-chat-content flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={(event) => {
          const element = event.currentTarget
          shouldStickToBottomRef.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <= 48
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        <div ref={messagesContentRef} className="space-y-4">
          {messages.length === 0 && !isSending && (
            <div className="grid justify-items-center gap-3 py-12 text-center">
              <span className="grid size-12 place-content-center rounded-md bg-brand-soft text-brand-ink">
                <Bot aria-hidden="true" className="size-5" />
              </span>
              <div className="grid gap-1">
                <p className="font-heading text-subheading font-semibold text-ink">
                  How can I help?
                </p>
                <p className="max-w-prose text-body text-muted">
                  Ask about your backlog, sprint, or what to work on next.
                </p>
              </div>
              {suggestedPrompts.length > 0 && (
                <div className="grid max-w-lg gap-2">
                  <p className="text-caption font-medium text-muted">Try asking</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setChatState((current) =>
                            current.projectId === projectId
                              ? { ...current, draft: prompt }
                              : current,
                          )
                          composerRef.current?.focus()
                        }}
                        className="rounded-full border border-line bg-surface px-3 py-1.5 text-small text-muted transition-colors hover:border-brand-soft-line hover:bg-brand-soft hover:text-brand-ink"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <AssistantMessage
              key={`${index}-${message.role}-${message.content}`}
              message={message}
              todoReference={chatState.todoReferences[index]}
              onOpenTodo={onOpenTodo}
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
      </div>

      <div className="shrink-0 border-t border-line px-4 py-3">
        {sendError && (
          <AiErrorState
            className="mb-3"
            message={sendError}
            onRetry={retryLastAction}
          />
        )}
        {storageError && (
          <p role="alert" className="mb-3 text-caption text-danger">{storageError}</p>
        )}
        <AssistantComposer
          textareaRef={composerRef}
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
    </div>
  )
}
