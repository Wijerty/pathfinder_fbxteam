/**
 * TypeScript типы для LLM интеграции с SciBox API
 */

// Базовые типы сообщений
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Запрос к чату
export interface ChatRequest {
  messages: LlmMessage[]
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
  stop?: string[]
}

// Ответ от чата (non-streaming)
export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: LlmMessage
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Streaming delta
export interface ChatDelta {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

// Запрос эмбеддингов
export interface EmbeddingsRequest {
  model: string
  input: string | string[]
  encoding_format?: 'float' | 'base64'
}

// Ответ эмбеддингов
export interface EmbeddingsResponse {
  object: string
  data: Array<{
    object: string
    index: number
    embedding: number[]
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// Ошибка API
export interface LlmError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
  status?: number
}

// Конфигурация чата
export interface ChatOptions {
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string[]
  stream?: boolean
  timeout?: number
}

// Результат стриминга
export interface StreamResult {
  content: string
  finished: boolean
  error?: string
}

// Контекст для системного промпта
export type ChatContext = 'employee' | 'hr' | 'admin' | 'general'

// Метаданные сообщения для логирования
export interface MessageMetadata {
  userId?: string
  sessionId?: string
  context?: ChatContext
  timestamp: Date
  tokenCount?: number
  model?: string
}

// PII типы для редактирования
export interface PIIRedactionResult {
  redacted: string
  foundPII: Array<{
    type: 'email' | 'phone' | 'ssn' | 'custom'
    original: string
    redacted: string
    position: number
  }>
}

// Стратегии retry
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableStatuses: number[]
}

// Клиент LLM (абстракция)
export interface LlmClient {
  chat(messages: LlmMessage[], options?: ChatOptions): Promise<ChatResponse>
  chatStream(messages: LlmMessage[], options?: ChatOptions): AsyncGenerator<StreamResult>
  createEmbeddings(texts: string[]): Promise<number[][]>
  isAvailable(): boolean
  getModel(): string
}

// Фабрика для создания клиентов
export interface LlmClientFactory {
  createClient(config: any): LlmClient
  supportedProviders(): string[]
}

// Статистика использования
export interface UsageStats {
  requestCount: number
  tokenCount: number
  errorCount: number
  avgResponseTime: number
  lastUsed: Date
}

// Настройки безопасности
export interface SecurityConfig {
  enablePIIRedaction: boolean
  enableContentFiltering: boolean
  enableAuditLogging: boolean
  maxMessageLength: number
  allowedRoles: ChatContext[]
}
