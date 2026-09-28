import { useState, type FormEvent } from 'react'
import { checkAccount } from '../api/greenApi'
import type { Chat, Credentials } from '../types'
import { formatPhoneDisplay, isValidPhone, normalizePhone } from '../utils/phone'
import './NewChatModal.css'

type Props = {
  credentials: Credentials
  onClose: () => void
  onCreated: (chat: Chat) => void
}

export function NewChatModal({ credentials, onClose, onCreated }: Props) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!isValidPhone(phone)) {
      setError('Введите номер РФ (+7…) или РБ (+375…)')
      return
    }

    setLoading(true)
    try {
      const digits = normalizePhone(phone)
      const result = await checkAccount(credentials, digits)

      if (!result.exist || !result.chatId) {
        throw new Error('Аккаунт MAX на этом номере не найден')
      }

      onCreated({
        chatId: result.chatId,
        phoneNumber: digits,
        name: formatPhoneDisplay(digits),
        updatedAt: Date.now(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header>
          <h2>Новый чат</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <label className="field">
          <span>Номер телефона получателя</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="79991234567"
            autoFocus
            required
          />
        </label>

        {error ? <div className="modal-error">{error}</div> : null}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Проверка…' : 'Создать чат'}
        </button>
      </form>
    </div>
  )
}
