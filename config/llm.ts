/**
 * LLM Configuration для SciBox интеграции
 * Настройки подключения к OpenAI-совместимому API
 */

export interface LLMConfig {
  baseUrl: string
  apiKey: string
  model: string
  embeddingsModel: string
  timeoutMs: number
  maxTokens: number
  temperature: number
  topP: number
  enabled: boolean
}

/**
 * Получить конфигурацию LLM из переменных окружения
 */
export function getLLMConfig(): LLMConfig {
  const config: LLMConfig = {
    baseUrl: process.env.SCIBOX_BASE_URL || 'https://llm.t1v.scibox.tech/v1',
    apiKey: process.env.SCIBOX_API_KEY || 'sk-grkhdq183nJiyI7rd96pFw',
    model: process.env.SCIBOX_MODEL || 'Qwen2.5-72B-Instruct-AWQ',
    embeddingsModel: process.env.SCIBOX_EMBEDDINGS_MODEL || 'bge-m3',
    timeoutMs: parseInt(process.env.SCIBOX_TIMEOUT_MS || '60000'),
    maxTokens: parseInt(process.env.SCIBOX_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.SCIBOX_TEMPERATURE || '0.7'),
    topP: parseFloat(process.env.SCIBOX_TOP_P || '0.9'),
    enabled: process.env.NEXT_PUBLIC_ENABLE_SCIBOX_LLM === 'true'
  }

  return config
}

/**
 * Валидация конфигурации LLM
 */
export function validateLLMConfig(config: LLMConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.baseUrl) {
    errors.push('SCIBOX_BASE_URL is required')
  }

  if (!config.apiKey && config.enabled) {
    errors.push('SCIBOX_API_KEY is required when LLM is enabled')
  }

  if (!config.model) {
    errors.push('SCIBOX_MODEL is required')
  }

  if (config.timeoutMs <= 0) {
    errors.push('SCIBOX_TIMEOUT_MS must be positive')
  }

  if (config.maxTokens <= 0) {
    errors.push('SCIBOX_MAX_TOKENS must be positive')
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('SCIBOX_TEMPERATURE must be between 0 and 2')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Получить заголовки для запросов к SciBox API
 */
export function getSciBoxHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PathFinder-AI-HR/1.0'
  }
}

/**
 * URL endpoints для различных API SciBox
 */
export function getSciBoxEndpoints(baseUrl: string) {
  // Убираем trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  return {
    chat: `${cleanBaseUrl}/chat/completions`,
    embeddings: `${cleanBaseUrl}/embeddings`,
    models: `${cleanBaseUrl}/models`
  }
}

/**
 * Дефолтные system промпты для разных ролей
 */
export const SYSTEM_PROMPTS = {
  employee: `Ты — ИИ-консультант PathFinder для сотрудников компании. 

Твои задачи:
- Помогать с развитием карьеры и планированием обучения
- Анализировать навыки и предлагать роли
- Мотивировать к выполнению квестов и получению бейджей
- Давать конкретные, actionable советы

Принципы:
- Используй данные из профиля пользователя
- Предлагай конкретные шаги развития
- Поддерживай мотивацию и позитивный тон
- Ссылайся на внутренние ресурсы компании

Отвечай кратко, по делу, с примерами.`,

  hr: `Ты — ИИ-консультант PathFinder для HR-специалистов.

Твои задачи:
- Анализировать совместимость кандидатов с ролями
- Выявлять скилл-гэпы в командах
- Предлагать стратегии развития талантов
- Помогать с планированием найма и ротации

Принципы:
- Основывайся на данных и метриках
- Объясняй свои рекомендации
- Учитывай бизнес-потребности
- Предлагай варианты решений

Отвечай профессионально, с конкретными рекомендациями.`,

  admin: `Ты — ИИ-консультант PathFinder для администраторов системы.

Твои задачи:
- Анализировать системные метрики и тренды
- Помогать с настройкой таксономии навыков
- Предлагать оптимизации процессов
- Выявлять проблемы в данных

Принципы:
- Фокус на системной эффективности
- Предлагай технические решения
- Анализируй качество данных
- Мысли стратегически

Отвечай технически грамотно, с обоснованием.`,

  general: `Ты — ИИ-консультант PathFinder, корпоративной системы управления талантами.

Помогаешь с:
- Развитием навыков и карьеры
- Поиском и оценкой талантов  
- Планированием обучения
- Анализом HR-метрик

Всегда профессионально, конкретно и по делу.`
} as const

export type SystemPromptRole = keyof typeof SYSTEM_PROMPTS
