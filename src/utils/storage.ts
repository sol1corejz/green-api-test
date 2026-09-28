import type { Chat, ChatMessage, Credentials } from '../types'

const CREDENTIALS_KEY = 'max-chat-credentials'
const CHATS_KEY = 'max-chat-chats'
const MESSAGES_KEY = 'max-chat-messages'

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Credentials>
    if (!parsed.idInstance || !parsed.apiTokenInstance) return null
    return {
      idInstance: parsed.idInstance,
      apiTokenInstance: parsed.apiTokenInstance,
    }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function clearCredentials(): void {
  localStorage.removeItem(CREDENTIALS_KEY)
}

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY)
    return raw ? (JSON.parse(raw) as Chat[]) : []
  } catch {
    return []
  }
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

export function loadMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {}
  } catch {
    return {}
  }
}

export function saveMessages(messages: Record<string, ChatMessage[]>): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages))
}
