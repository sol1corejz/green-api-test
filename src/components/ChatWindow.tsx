import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendMessage } from '../api/greenApi'
import type { Chat, ChatMessage, Credentials } from '../types'
import { formatPhoneDisplay } from '../utils/phone'
import './ChatWindow.css'

type Props = {
  credentials: Credentials
  chat: Chat
  messages: ChatMessage[]
  onMessageSent: (message: ChatMessage, replaceId?: string) => void
  onMessageFailed: (tempId: string) => void
  onBack?: () => void
}

export function ChatWindow({
  credentials,
  chat,
  messages,
  onMessageSent,
  onMessageFailed,
  onBack,
}: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chat.chatId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const message = text.trim()
    if (!message || sending) return

    const tempId = `temp-${Date.now()}`
    const optimistic: ChatMessage = {
      id: tempId,
      chatId: chat.chatId,
      text: message,
      timestamp: Date.now(),
      direction: 'outgoing',
      status: 'pending',
    }

    onMessageSent(optimistic)
    setText('')
    setSending(true)

    try {
      const { idMessage } = await sendMessage(
        credentials,
        chat.chatId,
        message,
      )
      onMessageSent(
        {
          ...optimistic,
          id: idMessage,
          status: 'sent',
        },
        tempId,
      )
    } catch {
      onMessageFailed(tempId)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        {onBack ? (
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            aria-label="Назад к чатам"
          >
            ←
          </button>
        ) : null}
        <div className="chat-avatar" aria-hidden>
          {chat.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2>{chat.name}</h2>
          <p>{formatPhoneDisplay(chat.phoneNumber)}</p>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 ? (
          <div className="messages-empty">Напишите первое сообщение</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`bubble bubble-${message.direction}${
                message.status === 'failed' ? ' bubble-failed' : ''
              }`}
            >
              <p>{message.text}</p>
              <time>
                {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {message.status === 'pending' ? ' · …' : ''}
                {message.status === 'failed' ? ' · ошибка' : ''}
              </time>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение"
          maxLength={4000}
        />
        <button type="submit" disabled={!text.trim() || sending} aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              fill="currentColor"
              d="M3.4 20.6 21 12 3.4 3.4l.1 6.8L15 12 3.5 13.8z"
            />
          </svg>
        </button>
      </form>
    </section>
  )
}
