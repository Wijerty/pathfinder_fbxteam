/**
 * SciBox LLM Client - реальная интеграция с SciBox API
 * Подключается через серверный прокси для безопасности токена
 */

import type { LlmMessage, ChatOptions, StreamResult, ChatResponse } from '@/types/llm'
import type { User, Profile, AIRecommendation, CandidateMatch, MatchExplanation } from '@/types'

export class SciBoxLLMClient {
  private apiBase: string
  private defaultOptions: ChatOptions

  constructor(apiBase: string = '/api/llm') {
    this.apiBase = apiBase
    this.defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 4096,
      stream: true,
      timeout: 60000
    }
  }

  /**
   * Стриминговый чат с токен-по-токен выводом
   */
  async* chatStream(
    messages: LlmMessage[], 
    options: ChatOptions = {}
  ): AsyncGenerator<StreamResult> {
    const opts = { ...this.defaultOptions, ...options }
    
    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          ...opts,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        yield {
          content: '',
          finished: true,
          error: error.error || `HTTP ${response.status}`
        }
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        yield {
          content: '',
          finished: true,
          error: 'Нет тела ответа'
        }
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          
          // Сохраняем последнюю неполную строку
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue

            if (trimmed === 'data: [DONE]') {
              yield { content: '', finished: true }
              return
            }

            try {
              const jsonStr = trimmed.substring(6) // убираем "data: "
              const delta = JSON.parse(jsonStr)
              
              const content = delta.choices?.[0]?.delta?.content || ''
              const finished = delta.choices?.[0]?.finish_reason !== null

              if (content) {
                yield { content, finished: false }
              }

              if (finished) {
                yield { content: '', finished: true }
                return
              }
            } catch (parseError) {
              console.warn('Ошибка парсинга SSE:', parseError, trimmed)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      yield {
        content: '',
        finished: true,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }
    }
  }

  /**
   * Обычный чат без стриминга
   */
  async chat(messages: LlmMessage[], options: ChatOptions = {}): Promise<string> {
    const opts = { ...this.defaultOptions, ...options, stream: false }
    
    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          ...opts
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('Ошибка чата с LLM:', error)
      throw error
    }
  }

  /**
   * Создание эмбеддингов
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.apiBase}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: texts
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.data.map((item: any) => item.embedding)
    } catch (error) {
      console.error('Ошибка создания эмбеддингов:', error)
      throw error
    }
  }

  /**
   * Рекомендации ролей для профиля
   */
  async recommendRoles(profile: Profile): Promise<AIRecommendation[]> {
    const prompt = this.buildRoleRecommendationPrompt(profile)
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по карьерному развитию. Анализируй профили и рекомендуй подходящие роли с обоснованием.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    try {
      const response = await this.chat(messages, { temperature: 0.3 })
      return this.parseRoleRecommendations(response)
    } catch (error) {
      console.error('Ошибка получения рекомендаций ролей:', error)
      return []
    }
  }

  /**
   * Матчинг кандидатов с вакансией
   */
  async matchCandidates(
    jobDescription: string, 
    candidates: User[]
  ): Promise<CandidateMatch[]> {
    const prompt = this.buildCandidateMatchingPrompt(jobDescription, candidates)
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по подбору персонала. Анализируй соответствие кандидатов требованиям вакансии.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    try {
      const response = await this.chat(messages, { temperature: 0.2 })
      return this.parseCandidateMatches(response, candidates)
    } catch (error) {
      console.error('Ошибка матчинга кандидатов:', error)
      return []
    }
  }

  /**
   * Объяснение совпадения кандидата с вакансией
   */
  async explainMatch(
    candidate: User, 
    jobDescription: string
  ): Promise<MatchExplanation> {
    const prompt = this.buildMatchExplanationPrompt(candidate, jobDescription)
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: 'Ты эксперт по анализу компетенций. Детально объясняй совпадения кандидатов с требованиями.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    try {
      const response = await this.chat(messages, { temperature: 0.1 })
      return this.parseMatchExplanation(response)
    } catch (error) {
      console.error('Ошибка объяснения совпадения:', error)
      return {
        overallScore: 0,
        score: 0,
        strengths: [],
        gaps: [],
        developmentPath: [],
        riskFactors: [],
        recommendations: [],
        timeToReady: 'unknown',
        confidence: 0
      }
    }
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    // В браузере всегда доступен (прокси проверит на сервере)
    return typeof window !== 'undefined'
  }

  /**
   * Информация о провайдере
   */
  getProviderInfo() {
    return {
      name: 'SciBox LLM',
      version: '1.0.0',
      capabilities: ['chat', 'streaming', 'embeddings', 'recommendations']
    }
  }

  // Приватные методы для построения промптов

  private buildRoleRecommendationPrompt(profile: Profile): string {
    return `Проанализируй профиль сотрудника и рекомендуй 3-5 подходящих ролей.

Профиль:
Навыки: ${profile.skills.map(s => s.skillId).join(', ')}
Описание: ${profile.bio || 'Не указано'}

Верни рекомендации в формате JSON:
{
  "recommendations": [
    {
      "title": "Название роли",
      "compatibility": 85,
      "reasoning": "Объяснение почему подходит",
      "nextSteps": ["Шаг 1", "Шаг 2"]
    }
  ]
}`
  }

  private buildCandidateMatchingPrompt(jobDescription: string, candidates: User[]): string {
    const candidatesInfo = candidates.map(c => ({
      id: c.id,
      name: c.email,
      skills: c.profile?.skills?.map(s => s.skillId) || [],
      bio: c.profile?.bio || 'Не указано'
    }))

    return `Найди лучших кандидатов для вакансии и оцени их совместимость.

Вакансия:
${jobDescription}

Кандидаты:
${JSON.stringify(candidatesInfo, null, 2)}

Верни результат в формате JSON:
{
  "matches": [
    {
      "candidateId": "id",
      "score": 85,
      "summary": "Краткое объяснение"
    }
  ]
}`
  }

  private buildMatchExplanationPrompt(candidate: User, jobDescription: string): string {
    return `Детально объясни совпадение кандидата с требованиями вакансии.

Кандидат: ${candidate.email}
Навыки: ${candidate.profile?.skills?.map(s => s.skillId).join(', ') || 'Не указаны'}
Описание: ${candidate.profile?.bio || 'Не указано'}

Вакансия:
${jobDescription}

Верни анализ в формате JSON:
{
  "overallScore": 85,
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "gaps": ["Пробел 1", "Пробел 2"],
  "recommendations": ["Рекомендация 1", "Рекомендация 2"],
  "timeToReady": "3 месяца",
  "confidence": 90
}`
  }

  // Методы парсинга ответов LLM

  private parseRoleRecommendations(response: string): AIRecommendation[] {
    try {
      const parsed = JSON.parse(response)
      return parsed.recommendations || []
    } catch {
      // Fallback для plain text ответов
      return [{
        id: `ai-rec-${Date.now()}`,
        userId: '',
        type: 'role' as const,
        targetId: '',
        title: 'Рекомендация ИИ',
        description: response,
        reasoning: [response],
        confidence: 0.75,
        priority: 'medium' as const,
        status: 'active' as const,
        metadata: {},
        createdAt: new Date()
      }]
    }
  }

  private parseCandidateMatches(response: string, candidates: User[]): CandidateMatch[] {
    try {
      const parsed = JSON.parse(response)
      return parsed.matches?.map((match: any) => {
        const candidate = candidates.find(c => c.id === match.candidateId)
        return candidate ? {
          candidate,
          score: match.score,
          summary: match.summary
        } : null
      }).filter(Boolean) || []
    } catch {
      return []
    }
  }

  private parseMatchExplanation(response: string): MatchExplanation {
    try {
      return JSON.parse(response)
    } catch {
      return {
        overallScore: 0,
        score: 0,
        strengths: [],
        gaps: [],
        developmentPath: [],
        riskFactors: [],
        recommendations: [response],
        timeToReady: 'unknown',
        confidence: 0
      }
    }
  }
}
