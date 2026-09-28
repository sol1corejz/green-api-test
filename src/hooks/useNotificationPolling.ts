import { useEffect, useRef } from 'react'
import { deleteNotification, receiveNotification } from '../api/greenApi'
import type { Chat, ChatMessage, Credentials } from '../types'

type Handlers = {
  onIncomingMessage: (message: ChatMessage, chatMeta: Partial<Chat>) => void
  onError?: (error: Error) => void
}

export function useNotificationPolling(
  credentials: Credentials | null,
  enabled: boolean,
  handlers: Handlers,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!credentials || !enabled) return

    let cancelled = false

    const poll = async () => {
      while (!cancelled) {
        try {
          const notification = await receiveNotification(credentials, 20)
          if (cancelled) break

          if (!notification) continue

          const { body, receiptId } = notification

          if (
            body.typeWebhook === 'incomingMessageReceived' &&
            body.senderData?.chatId
          ) {
            const text =
              body.messageData?.textMessageData?.textMessage ??
              body.messageData?.extendedTextMessageData?.text ??
              ''

            const type = body.messageData?.typeMessage
            if (
              text &&
              (type === 'textMessage' || type === 'extendedTextMessage')
            ) {
              const phone = body.senderData.senderPhoneNumber
                ? String(body.senderData.senderPhoneNumber)
                : body.senderData.chatId

              handlersRef.current.onIncomingMessage(
                {
                  id: body.idMessage,
                  chatId: body.senderData.chatId,
                  text,
                  timestamp: body.timestamp * 1000,
                  direction: 'incoming',
                },
                {
                  chatId: body.senderData.chatId,
                  name:
                    body.senderData.senderContactName ||
                    body.senderData.senderName ||
                    body.senderData.chatName ||
                    phone,
                  phoneNumber: phone,
                },
              )
            }
          }

          await deleteNotification(credentials, receiptId)
        } catch (error) {
          if (cancelled) break
          handlersRef.current.onError?.(
            error instanceof Error ? error : new Error(String(error)),
          )
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [credentials, enabled])
}
