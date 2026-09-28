export type Credentials = {
  idInstance: string
  apiTokenInstance: string
}

export type Chat = {
  chatId: string
  phoneNumber: string
  name: string
  lastMessage?: string
  updatedAt: number
}

export type ChatMessage = {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
  status?: 'pending' | 'sent' | 'failed'
}

export type GreenApiNotification = {
  receiptId: number
  body: {
    typeWebhook: string
    timestamp: number
    idMessage: string
    senderData?: {
      chatId: string
      chatName?: string
      sender?: string
      senderName?: string
      senderContactName?: string
      senderPhoneNumber?: number
    }
    messageData?: {
      typeMessage: string
      textMessageData?: {
        textMessage: string
      }
      extendedTextMessageData?: {
        text: string
      }
    }
  }
}
