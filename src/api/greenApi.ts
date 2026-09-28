import type { Credentials, GreenApiNotification } from '../types'

function buildPath(
  credentials: Credentials,
  method: string,
  suffix = '',
): string {
  return `/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${suffix}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/green-api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: unknown }).message)
        : text || `HTTP ${response.status}`
    throw new Error(message)
  }

  return data as T
}

export async function getStateInstance(
  credentials: Credentials,
): Promise<{ stateInstance: string }> {
  return request(buildPath(credentials, 'getStateInstance'))
}

export async function configureHttpApiReceiving(
  credentials: Credentials,
): Promise<void> {
  await request(buildPath(credentials, 'setSettings'), {
    method: 'POST',
    body: JSON.stringify({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      stateWebhook: 'yes',
    }),
  })
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
): Promise<{ exist: boolean; chatId?: string }> {
  const normalized = Number(phoneNumber.replace(/\D/g, ''))
  return request(buildPath(credentials, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify({ phoneNumber: normalized }),
  })
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<{ idMessage: string }> {
  return request(buildPath(credentials, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 5,
): Promise<GreenApiNotification | null> {
  const path = `${buildPath(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`
  return request(path)
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<{ result: boolean }> {
  return request(
    buildPath(credentials, 'deleteNotification', `/${receiptId}`),
    { method: 'DELETE' },
  )
}
