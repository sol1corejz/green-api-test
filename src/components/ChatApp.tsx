import { useCallback, useMemo, useState } from 'react'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import type { Chat, ChatMessage, Credentials } from '../types'
import { formatPhoneDisplay } from '../utils/phone'
import {
  loadChats,
  loadMessages,
  saveChats,
  saveMessages,
} from '../utils/storage'
import { ChatWindow } from './ChatWindow'
import { NewChatModal } from './NewChatModal'
import './ChatApp.css'

type Props = {
  credentials: Credentials
  onLogout: () => void
}

export function ChatApp({ credentials, onLogout }: Props) {
  const [chats, setChats] = useState<Chat[]>(() => loadChats())
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >(() => loadMessages())
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadChats()[0]?.chatId ?? null,
  )
  const [showNewChat, setShowNewChat] = useState(false)
  const [pollError, setPollError] = useState('')

  const activeChat = useMemo(
    () => chats.find((chat) => chat.chatId === activeChatId) ?? null,
    [chats, activeChatId],
  )

  const upsertChat = useCallback((chat: Chat) => {
    setChats((prev) => {
      const existing = prev.find((item) => item.chatId === chat.chatId)
      const next = existing
        ? prev.map((item) =>
            item.chatId === chat.chatId ? { ...item, ...chat } : item,
          )
        : [chat, ...prev]
      const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt)
      saveChats(sorted)
      return sorted
    })
  }, [])

  const appendMessage = useCallback(
    (message: ChatMessage, replaceTempId?: string) => {
      setMessagesByChat((prev) => {
        const list = prev[message.chatId] ?? []
        let nextList: ChatMessage[]

        if (replaceTempId) {
          nextList = list.map((item) =>
            item.id === replaceTempId ? message : item,
          )
        } else if (list.some((item) => item.id === message.id)) {
          nextList = list
        } else {
          nextList = [...list, message]
        }

        const next = { ...prev, [message.chatId]: nextList }
        saveMessages(next)
        return next
      })
    },
    [],
  )

  const handleIncoming = useCallback(
    (message: ChatMessage, chatMeta: Partial<Chat>) => {
      upsertChat({
        chatId: message.chatId,
        phoneNumber: chatMeta.phoneNumber ?? message.chatId,
        name: chatMeta.name ?? formatPhoneDisplay(chatMeta.phoneNumber ?? ''),
        lastMessage: message.text,
        updatedAt: message.timestamp,
      })
      appendMessage(message)
    },
    [appendMessage, upsertChat],
  )

  useNotificationPolling(credentials, true, {
    onIncomingMessage: handleIncoming,
    onError: (error) => setPollError(error.message),
  })

  const handleChatCreated = (chat: Chat) => {
    upsertChat(chat)
    setActiveChatId(chat.chatId)
    setShowNewChat(false)
  }

  const handleMessageSent = (message: ChatMessage, replaceId?: string) => {
    appendMessage(message, replaceId)

    const current = chats.find((chat) => chat.chatId === message.chatId)
    upsertChat({
      chatId: message.chatId,
      phoneNumber: current?.phoneNumber ?? '',
      name: current?.name ?? message.chatId,
      lastMessage: message.text,
      updatedAt: message.timestamp,
    })
  }

  const handleMessageFailed = (tempId: string) => {
    if (!activeChatId) return
    setMessagesByChat((prev) => {
      const list = (prev[activeChatId] ?? []).map((item) =>
        item.id === tempId ? { ...item, status: 'failed' as const } : item,
      )
      const next = { ...prev, [activeChatId]: list }
      saveMessages(next)
      return next
    })
  }

  return (
    <div className={`chat-app${activeChat ? ' has-active-chat' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-logo" aria-hidden />
            <div>
              <strong>MAX</strong>
              <span>GREEN-API чат</span>
            </div>
          </div>
          <button
            type="button"
            className="new-chat-btn"
            onClick={() => setShowNewChat(true)}
          >
            +
          </button>
        </div>

        <div className="chat-list">
          {chats.length === 0 ? (
            <p className="sidebar-empty">Создайте чат по номеру телефона</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.chatId}
                type="button"
                className={`chat-list-item${
                  chat.chatId === activeChatId ? ' active' : ''
                }`}
                onClick={() => setActiveChatId(chat.chatId)}
              >
                <div className="chat-list-avatar" aria-hidden>
                  {chat.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="chat-list-meta">
                  <strong>{chat.name}</strong>
                  <span>{chat.lastMessage || formatPhoneDisplay(chat.phoneNumber)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <button type="button" className="logout-btn" onClick={onLogout}>
          Выйти
        </button>
      </aside>

      {activeChat ? (
        <ChatWindow
          credentials={credentials}
          chat={activeChat}
          messages={messagesByChat[activeChat.chatId] ?? []}
          onMessageSent={handleMessageSent}
          onMessageFailed={handleMessageFailed}
          onBack={() => setActiveChatId(null)}
        />
      ) : (
        <div className="chat-placeholder">
          <div className="placeholder-card">
            <h2>Выберите чат</h2>
            <p>или создайте новый по номеру получателя</p>
            <button type="button" onClick={() => setShowNewChat(true)}>
              Новый чат
            </button>
          </div>
        </div>
      )}

      {pollError ? (
        <div className="poll-toast" role="status">
          Ошибка получения: {pollError}
          <button type="button" onClick={() => setPollError('')}>
            ×
          </button>
        </div>
      ) : null}

      {showNewChat ? (
        <NewChatModal
          credentials={credentials}
          onClose={() => setShowNewChat(false)}
          onCreated={handleChatCreated}
        />
      ) : null}
    </div>
  )
}
