export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone)
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 12 && digits.startsWith('375')) {
    return `+375 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`
  }
  return digits ? `+${digits}` : phone
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input)
  return (
    (digits.length === 11 && digits.startsWith('7')) ||
    (digits.length === 12 && digits.startsWith('375'))
  )
}
