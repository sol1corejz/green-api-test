import { useState, type FormEvent } from 'react'
import {
  configureHttpApiReceiving,
  getStateInstance,
} from '../api/greenApi'
import type { Credentials } from '../types'
import './LoginForm.css'

type Props = {
  onSuccess: (credentials: Credentials) => void
}

export function LoginForm({ onSuccess }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    try {
      const { stateInstance } = await getStateInstance(credentials)
      if (stateInstance !== 'authorized' && stateInstance !== 'suspended') {
        throw new Error(
          `Инстанс в статусе «${stateInstance}». Авторизуйте его в личном кабинете GREEN-API.`,
        )
      }

      try {
        await configureHttpApiReceiving(credentials)
      } catch {
        // Settings may already be correct; receiving still works if webhookUrl is empty.
      }

      onSuccess(credentials)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow" aria-hidden />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo" aria-hidden>
            <span />
          </div>
          <h1>MAX</h1>
          <p>Вход через GREEN-API</p>
        </div>

        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="3100123456"
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Токен из личного кабинета"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <div className="login-error">{error}</div> : null}

        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
