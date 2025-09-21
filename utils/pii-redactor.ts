/**
 * PII Redactor - утилита для скрытия персональных данных в логах
 * Простая реализация для защиты чувствительной информации
 */

export interface PIIRedactionResult {
  redacted: string
  foundPII: Array<{
    type: 'email' | 'phone' | 'ssn' | 'name' | 'custom'
    original: string
    redacted: string
    position: number
  }>
}

// Паттерны для поиска PII
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(?:\+7|8)[\s\-]?\(?9\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|\+\d{1,3}[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
  // Паттерн для ФИО (простая эвристика)
  russianName: /\b[А-Я][а-я]{2,}\s+[А-Я][а-я]{2,}(?:\s+[А-Я][а-я]{2,})?\b/g,
  englishName: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g
} as const

type PIIType = keyof typeof PII_PATTERNS

/**
 * Редактирует PII в тексте, заменяя на звездочки
 */
export function redactPII(text: string, options: {
  enabledTypes?: PIIType[]
  placeholder?: string
  preserveLength?: boolean
} = {}): PIIRedactionResult {
  const {
    enabledTypes = Object.keys(PII_PATTERNS) as PIIType[],
    placeholder = '[REDACTED]',
    preserveLength = false
  } = options

  let redactedText = text
  const foundPII: PIIRedactionResult['foundPII'] = []

  // Обрабатываем каждый тип PII
  for (const type of enabledTypes) {
    const pattern = PII_PATTERNS[type]
    let match: RegExpExecArray | null

    // Сбрасываем lastIndex для глобального regex
    pattern.lastIndex = 0

    while ((match = pattern.exec(text)) !== null) {
      const original = match[0]
      let replacement: string

      if (preserveLength) {
        // Сохраняем длину, заменяя символы на *
        replacement = '*'.repeat(original.length)
      } else {
        replacement = placeholder
      }

      foundPII.push({
        type: type as PIIRedactionResult['foundPII'][0]['type'],
        original,
        redacted: replacement,
        position: match.index
      })

      // Заменяем найденное PII
      redactedText = redactedText.replace(original, replacement)
    }
  }

  return {
    redacted: redactedText,
    foundPII
  }
}

/**
 * Быстрая проверка на наличие PII без редактирования
 */
export function containsPII(text: string, types?: PIIType[]): boolean {
  const enabledTypes = types || (Object.keys(PII_PATTERNS) as PIIType[])
  
  return enabledTypes.some(type => {
    const pattern = PII_PATTERNS[type]
    pattern.lastIndex = 0
    return pattern.test(text)
  })
}

/**
 * Безопасное логирование с автоматическим редактированием PII
 */
export function safeLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const shouldRedact = process.env.ENABLE_PII_REDACTION === 'true'
  
  if (shouldRedact) {
    const redactedMessage = redactPII(message).redacted
    const redactedData = data ? redactPII(JSON.stringify(data)).redacted : undefined
    
    console[level](redactedMessage, redactedData ? JSON.parse(redactedData) : data)
  } else {
    console[level](message, data)
  }
}

/**
 * Middleware для редактирования PII в request/response логах
 */
export function createPIIRedactionMiddleware(options: {
  redactRequestBody?: boolean
  redactResponseBody?: boolean
  redactHeaders?: boolean
} = {}) {
  const {
    redactRequestBody = true,
    redactResponseBody = true,
    redactHeaders = true
  } = options

  return {
    redactRequest: (req: any) => {
      const redacted: any = { ...req }

      if (redactHeaders && req.headers) {
        redacted.headers = { ...req.headers }
        // Редактируем чувствительные заголовки
        if (redacted.headers.authorization) {
          redacted.headers.authorization = '[REDACTED]'
        }
      }

      if (redactRequestBody && req.body) {
        const bodyStr = JSON.stringify(req.body)
        redacted.body = JSON.parse(redactPII(bodyStr).redacted)
      }

      return redacted
    },

    redactResponse: (res: any) => {
      if (!redactResponseBody) return res

      const redacted = { ...res }
      if (res.body) {
        const bodyStr = JSON.stringify(res.body)
        redacted.body = JSON.parse(redactPII(bodyStr).redacted)
      }

      return redacted
    }
  }
}

/**
 * Специализированное редактирование для чат сообщений
 */
export function redactChatMessage(content: string): string {
  // Для чат сообщений используем более агрессивное редактирование
  const result = redactPII(content, {
    enabledTypes: ['email', 'phone', 'russianName', 'englishName'],
    placeholder: '[СКРЫТО]',
    preserveLength: false
  })

  return result.redacted
}

/**
 * Проверка безопасности контента перед отправкой в LLM
 */
export function sanitizeForLLM(content: string): {
  sanitized: string
  hasPII: boolean
  redactedItems: number
} {
  const result = redactPII(content, {
    enabledTypes: ['email', 'phone', 'ssn', 'creditCard'],
    placeholder: '[ЛИЧНЫЕ_ДАННЫЕ]'
  })

  return {
    sanitized: result.redacted,
    hasPII: result.foundPII.length > 0,
    redactedItems: result.foundPII.length
  }
}
