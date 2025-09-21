/**
 * Тесты для LLM интеграции
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SciBoxLLMClient } from '@/services/sciboxLLMClient'

// Mock fetch для тестов
global.fetch = vi.fn()

describe('SciBoxLLMClient', () => {
  let client: SciBoxLLMClient
  
  beforeEach(() => {
    client = new SciBoxLLMClient('/api/llm')
    vi.clearAllMocks()
  })

  describe('chatStream', () => {
    it('должен корректно обрабатывать SSE поток', async () => {
      const mockSSEData = [
        'data: {"choices":[{"delta":{"content":"Привет"}}]}\n',
        'data: {"choices":[{"delta":{"content":" мир"}}]}\n',
        'data: [DONE]\n'
      ]

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockReturnValueOnce({
                done: false,
                value: new TextEncoder().encode(mockSSEData[0])
              })
              .mockReturnValueOnce({
                done: false,
                value: new TextEncoder().encode(mockSSEData[1])
              })
              .mockReturnValueOnce({
                done: false,
                value: new TextEncoder().encode(mockSSEData[2])
              })
              .mockReturnValue({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      }

      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const messages = [{ role: 'user' as const, content: 'Привет' }]
      const results = []

      for await (const result of client.chatStream(messages)) {
        results.push(result)
      }

      expect(results).toEqual([
        { content: 'Привет', finished: false },
        { content: ' мир', finished: false },
        { content: '', finished: true }
      ])
    })

    it('должен обрабатывать ошибки парсинга JSON', async () => {
      const mockSSEData = [
        'data: invalid json\n',
        'data: [DONE]\n'
      ]

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockReturnValueOnce({
                done: false,
                value: new TextEncoder().encode(mockSSEData[0])
              })
              .mockReturnValueOnce({
                done: false,
                value: new TextEncoder().encode(mockSSEData[1])
              })
              .mockReturnValue({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      }

      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const messages = [{ role: 'user' as const, content: 'test' }]
      const results = []

      for await (const result of client.chatStream(messages)) {
        results.push(result)
      }

      // Должен пропустить некорректный JSON и завершиться
      expect(results).toEqual([
        { content: '', finished: true }
      ])
    })
  })

  describe('chat (non-streaming)', () => {
    it('должен возвращать текст ответа', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Тестовый ответ'
              }
            }
          ]
        })
      }

      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const messages = [{ role: 'user' as const, content: 'Тест' }]
      const result = await client.chat(messages)

      expect(result).toBe('Тестовый ответ')
      expect(fetch).toHaveBeenCalledWith('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4096,
          stream: false,
          timeout: 60000
        })
      })
    })

    it('должен обрабатывать HTTP ошибки', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: 'Rate limit exceeded'
        })
      }

      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const messages = [{ role: 'user' as const, content: 'Тест' }]
      
      await expect(client.chat(messages)).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('createEmbeddings', () => {
    it('должен возвращать векторы embeddings', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            { embedding: [0.1, 0.2, 0.3] },
            { embedding: [0.4, 0.5, 0.6] }
          ]
        })
      }

      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const result = await client.createEmbeddings(['текст1', 'текст2'])

      expect(result).toEqual([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ])
    })
  })

  describe('utility methods', () => {
    it('isAvailable должен возвращать true в браузере', () => {
      // Эмулируем браузерное окружение
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      })

      expect(client.isAvailable()).toBe(true)
    })

    it('getProviderInfo должен возвращать информацию о провайдере', () => {
      const info = client.getProviderInfo()
      
      expect(info).toEqual({
        name: 'SciBox LLM',
        version: '1.0.0',
        capabilities: ['chat', 'streaming', 'embeddings', 'recommendations']
      })
    })
  })
})

// Тесты SSE parser утилиты
describe('SSE Parser', () => {
  it('должен корректно парсить data: строки', () => {
    const lines = [
      'data: {"test": "value"}',
      'data: [DONE]',
      'invalid line',
      ': comment',
      ''
    ]

    const results = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      if (trimmed === 'data: [DONE]') {
        results.push('DONE')
        break
      }

      try {
        const jsonStr = trimmed.substring(6)
        const parsed = JSON.parse(jsonStr)
        results.push(parsed)
      } catch {
        // Игнорируем некорректный JSON
      }
    }

    expect(results).toEqual([
      { test: 'value' },
      'DONE'
    ])
  })
})

// Тесты retry логики (моделируем для API route)
describe('Retry Logic', () => {
  it('должен повторять запрос при 429 ошибке', async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Rate limited' })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'Success' } }] })
      })
    })

    global.fetch = mockFetch

    const client = new SciBoxLLMClient()
    const result = await client.chat([{ role: 'user', content: 'test' }])

    expect(callCount).toBe(3)
    expect(result).toBe('Success')
  })
})
