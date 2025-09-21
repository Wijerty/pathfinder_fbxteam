/**
 * LLM Chat API Route - серверный прокси для SciBox API
 * Обеспечивает безопасность токена и стриминговую передачу
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLLMConfig, getSciBoxHeaders, getSciBoxEndpoints, SYSTEM_PROMPTS } from '@/config/llm'
import { getFeatureFlags } from '@/config/features'
import { redactPII, safeLog, sanitizeForLLM } from '@/utils/pii-redactor'
import type { ChatRequest, ChatResponse, LlmMessage, ChatContext } from '@/types/llm'

// Конфигурация retry логики
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  retryableStatuses: [429, 500, 502, 503, 504]
}

/**
 * POST /api/llm/chat - проксирование чата к SciBox API
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем конфигурацию
    const config = getLLMConfig()
    const flags = getFeatureFlags()

    if (!flags.enableSciboxLLM) {
      return NextResponse.json(
        { error: 'LLM API отключен', code: 'LLM_DISABLED' },
        { status: 503 }
      )
    }

    if (!config.apiKey) {
      safeLog('error', 'SciBox API key не настроен')
      return NextResponse.json(
        { error: 'LLM API недоступен', code: 'API_KEY_MISSING' },
        { status: 503 }
      )
    }

    // Парсим запрос
    let requestData: ChatRequest
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Неверный формат JSON', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    // Валидация
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return NextResponse.json(
        { error: 'Поле messages обязательно и должно быть массивом', code: 'INVALID_MESSAGES' },
        { status: 400 }
      )
    }

    if (requestData.messages.length === 0) {
      return NextResponse.json(
        { error: 'Список сообщений не может быть пустым', code: 'EMPTY_MESSAGES' },
        { status: 400 }
      )
    }

    // Подготавливаем сообщения с системным промптом
    const messages = prepareMessages(requestData.messages)

    // Sanitize контент если включено PII редактирование
    const sanitizedMessages = flags.enablePIIRedaction 
      ? messages.map(msg => ({
          ...msg,
          content: msg.role === 'user' ? sanitizeForLLM(msg.content).sanitized : msg.content
        }))
      : messages

    // Подготавливаем запрос к SciBox
    const sciboxRequest = {
      model: requestData.model || config.model,
      messages: sanitizedMessages,
      temperature: requestData.temperature ?? config.temperature,
      top_p: requestData.top_p ?? config.topP,
      max_tokens: requestData.max_tokens ?? config.maxTokens,
      stream: requestData.stream ?? true,
      stop: requestData.stop
    }

    // Логируем запрос (без PII)
    safeLog('info', 'LLM запрос', {
      messageCount: messages.length,
      model: sciboxRequest.model,
      stream: sciboxRequest.stream,
      timestamp: new Date().toISOString()
    })

    const endpoints = getSciBoxEndpoints(config.baseUrl)
    const headers = getSciBoxHeaders(config.apiKey)

    // Выполняем запрос с retry логикой
    if (sciboxRequest.stream) {
      return handleStreamingRequest(endpoints.chat, sciboxRequest, headers, config.timeoutMs)
    } else {
      return handleNonStreamingRequest(endpoints.chat, sciboxRequest, headers, config.timeoutMs)
    }

  } catch (error) {
    safeLog('error', 'Ошибка в LLM API route', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * Подготовка сообщений с системным промптом
 */
function prepareMessages(inputMessages: LlmMessage[]): LlmMessage[] {
  const messages = [...inputMessages]

  // Определяем контекст из query params или первого сообщения
  const context: ChatContext = 'general' // TODO: получать из headers или query

  // Если нет системного сообщения, добавляем его
  const hasSystemMessage = messages.some(msg => msg.role === 'system')
  if (!hasSystemMessage) {
    messages.unshift({
      role: 'system',
      content: SYSTEM_PROMPTS[context]
    })
  }

  return messages
}

/**
 * Обработка streaming запроса
 */
async function handleStreamingRequest(
  url: string,
  requestBody: any,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<Response> {
  
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      safeLog('error', 'SciBox API ошибка', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      return NextResponse.json(
        { 
          error: `SciBox API ошибка: ${response.statusText}`, 
          status: response.status,
          code: 'SCIBOX_ERROR'
        },
        { status: response.status }
      )
    }

    // Создаем streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.error(new Error('Нет тела ответа'))
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || !trimmed.startsWith('data: ')) continue

              if (trimmed === 'data: [DONE]') {
                controller.close()
                return
              }

              // Отправляем строку как есть - клиент сам парсит JSON
              controller.enqueue(new TextEncoder().encode(line + '\n'))
            }
          }
        } catch (error) {
          safeLog('error', 'Ошибка обработки stream', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    clearTimeout(timeout)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Таймаут запроса', code: 'TIMEOUT' },
        { status: 408 }
      )
    }

    safeLog('error', 'Ошибка запроса к SciBox', error)
    return NextResponse.json(
      { error: 'Ошибка подключения к LLM', code: 'CONNECTION_ERROR' },
      { status: 502 }
    )
  }
}

/**
 * Обработка non-streaming запроса
 */
async function handleNonStreamingRequest(
  url: string,
  requestBody: any,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<NextResponse> {
  
  let lastError: Error | null = null

  // Retry логика
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), timeoutMs)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      })

      clearTimeout(timeout)

      if (response.ok) {
        const data: ChatResponse = await response.json()
        return NextResponse.json(data)
      }

      // Проверяем, стоит ли повторять запрос
      if (RETRY_CONFIG.retryableStatuses.includes(response.status) && attempt < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        )
        
        safeLog('warn', `SciBox API ошибка ${response.status}, повтор через ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: RETRY_CONFIG.maxRetries
        })

        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Не повторяемая ошибка
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: `SciBox API ошибка: ${response.statusText}`,
          status: response.status,
          code: 'SCIBOX_ERROR',
          details: errorText
        },
        { status: response.status }
      )

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (lastError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Таймаут запроса', code: 'TIMEOUT' },
          { status: 408 }
        )
      }

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        )
        
        safeLog('warn', `Ошибка подключения, повтор через ${delay}ms`, {
          attempt: attempt + 1,
          error: lastError.message
        })

        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  // Исчерпаны все попытки
  safeLog('error', 'Все попытки подключения к SciBox исчерпаны', lastError)
  return NextResponse.json(
    { error: 'Ошибка подключения к LLM', code: 'CONNECTION_ERROR' },
    { status: 502 }
  )
}

/**
 * OPTIONS для CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
