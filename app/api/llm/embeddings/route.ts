/**
 * LLM Embeddings API Route - серверный прокси для SciBox embeddings
 * Создание векторных представлений текста для поиска и retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLLMConfig, getSciBoxHeaders, getSciBoxEndpoints } from '@/config/llm'
import { getFeatureFlags } from '@/config/features'
import { safeLog, sanitizeForLLM } from '@/utils/pii-redactor'
import type { EmbeddingsRequest, EmbeddingsResponse } from '@/types/llm'

// Лимиты для защиты от злоупотреблений
const MAX_INPUTS = 100
const MAX_INPUT_LENGTH = 8192

/**
 * POST /api/llm/embeddings - создание векторных представлений
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
      safeLog('error', 'SciBox API key не настроен для embeddings')
      return NextResponse.json(
        { error: 'Embeddings API недоступен', code: 'API_KEY_MISSING' },
        { status: 503 }
      )
    }

    // Парсим запрос
    let requestData: EmbeddingsRequest
    try {
      requestData = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Неверный формат JSON', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    // Валидация
    if (!requestData.input) {
      return NextResponse.json(
        { error: 'Поле input обязательно', code: 'MISSING_INPUT' },
        { status: 400 }
      )
    }

    // Нормализуем input в массив
    const inputs = Array.isArray(requestData.input) ? requestData.input : [requestData.input]

    // Проверяем лимиты
    if (inputs.length > MAX_INPUTS) {
      return NextResponse.json(
        { error: `Максимум ${MAX_INPUTS} текстов за раз`, code: 'TOO_MANY_INPUTS' },
        { status: 400 }
      )
    }

    // Проверяем длину каждого текста
    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index]
      if (typeof input !== 'string') {
        return NextResponse.json(
          { error: `Элемент ${index} должен быть строкой`, code: 'INVALID_INPUT_TYPE' },
          { status: 400 }
        )
      }

      if (input.length > MAX_INPUT_LENGTH) {
        return NextResponse.json(
          { 
            error: `Элемент ${index} слишком длинный (макс. ${MAX_INPUT_LENGTH} символов)`, 
            code: 'INPUT_TOO_LONG' 
          },
          { status: 400 }
        )
      }
    }

    // Sanitize контент если включено PII редактирование
    const sanitizedInputs = flags.enablePIIRedaction 
      ? inputs.map(input => sanitizeForLLM(input).sanitized)
      : inputs

    // Подготавливаем запрос к SciBox
    const sciboxRequest: EmbeddingsRequest = {
      model: requestData.model || config.embeddingsModel,
      input: sanitizedInputs.length === 1 ? sanitizedInputs[0] : sanitizedInputs,
      encoding_format: requestData.encoding_format || 'float'
    }

    // Логируем запрос (без содержимого)
    safeLog('info', 'Embeddings запрос', {
      inputCount: sanitizedInputs.length,
      model: sciboxRequest.model,
      encoding_format: sciboxRequest.encoding_format,
      timestamp: new Date().toISOString()
    })

    const endpoints = getSciBoxEndpoints(config.baseUrl)
    const headers = getSciBoxHeaders(config.apiKey)

    // Выполняем запрос
    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), config.timeoutMs)

    try {
      const response = await fetch(endpoints.embeddings, {
        method: 'POST',
        headers,
        body: JSON.stringify(sciboxRequest),
        signal: abortController.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text()
        safeLog('error', 'SciBox Embeddings API ошибка', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        return NextResponse.json(
          { 
            error: `SciBox Embeddings ошибка: ${response.statusText}`, 
            status: response.status,
            code: 'SCIBOX_EMBEDDINGS_ERROR'
          },
          { status: response.status }
        )
      }

      const data: EmbeddingsResponse = await response.json()

      // Логируем успешный ответ
      safeLog('info', 'Embeddings успешно созданы', {
        embeddingCount: data.data.length,
        dimensions: data.data[0]?.embedding.length || 0,
        usage: data.usage
      })

      return NextResponse.json(data)

    } catch (error) {
      clearTimeout(timeout)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Таймаут запроса embeddings', code: 'TIMEOUT' },
          { status: 408 }
        )
      }

      safeLog('error', 'Ошибка запроса embeddings к SciBox', error)
      return NextResponse.json(
        { error: 'Ошибка подключения к Embeddings API', code: 'CONNECTION_ERROR' },
        { status: 502 }
      )
    }

  } catch (error) {
    safeLog('error', 'Ошибка в Embeddings API route', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
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
