// LLM клиент для интеграции с ИИ провайдерами
import { 
  LLMProvider, 
  ChatMessage, 
  Profile, 
  AIRecommendation, 
  User, 
  CandidateMatch, 
  Vacancy, 
  MatchExplanation, 
  Quest 
} from '@/types'
import { isFeatureEnabled, providerConfig } from '@/config/features'
import { mockUsers, allMockSkills, mockVacancies } from '@/mocks'

// Абстрактный интерфейс для LLM провайдеров
export interface LLMClient extends LLMProvider {
  isAvailable(): boolean
  getProviderInfo(): { name: string; version: string; capabilities: string[] }
}

// Реальная интеграция с SciBox
import { SciBoxLLMClient } from './sciboxLLMClient'

// Mock реализация для разработки и демо
class MockLLMClient implements LLMClient {
  private mockResponses = {
    employee: [
      "Для развития в роли Senior Frontend Developer рекомендую сосредоточиться на углублении знаний TypeScript и изучении архитектурных паттернов. Также стоит развивать навыки менторинга.",
      "Ваш профиль выглядит сильно! Для перехода на следующий уровень предлагаю изучить системный дизайн и получить опыт технического лидерства в проектах.",
      "Отличный прогресс в развитии! Рекомендую добавить в профиль информацию о последних проектах и получить сертификацию по облачным технологиям."
    ],
    hr: [
      "Для позиции Senior Full Stack Developer лучше всего подходят Александр Петров (85% совпадение) и Сергей Новиков (78% совпадение). У них есть необходимый опыт в React и Node.js.",
      "В команде есть 3 кандидата готовых к ротации. Основные скилл-гэпы: архитектурное мышление и опыт ведения проектов.",
      "Рекомендую обратить внимание на Марию Иванову для продуктовых ролей - у неё сильная аналитика и понимание пользователей."
    ],
    admin: [
      "Система показывает высокую активность пользователей. Средняя полнота профилей выросла на 15% за месяц. Рекомендую добавить новые квесты для мотивации.",
      "Анализ показывает дефицит навыков в области DevOps и машинного обучения. Стоит запустить программы обучения в этих направлениях.",
      "Геймификация работает эффективно - 78% пользователей активно участвуют в квестах. Предлагаю добавить командные челленджи."
    ]
  }

  async chat(context: string, messages: ChatMessage[]): Promise<string> {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ''
    
    // Контекстные ответы на основе ключевых слов
    if (lastMessage.includes('навык') || lastMessage.includes('skill')) {
      return this.generateSkillAdvice(context, lastMessage)
    }
    
    if (lastMessage.includes('роль') || lastMessage.includes('карьер') || lastMessage.includes('развит')) {
      return this.generateCareerAdvice(context, lastMessage)
    }
    
    if (lastMessage.includes('квест') || lastMessage.includes('задач') || lastMessage.includes('план')) {
      return this.generateQuestAdvice(context, lastMessage)
    }
    
    if (lastMessage.includes('команд') || lastMessage.includes('коллег') || lastMessage.includes('матч')) {
      return this.generateTeamAdvice(context, lastMessage)
    }
    
    // Случайный ответ из контекстных заготовок
    const contextResponses = this.mockResponses[context as keyof typeof this.mockResponses] || this.mockResponses.employee
    const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)]
    
    return randomResponse
  }

  async recommendRoles(profile: Profile): Promise<AIRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const userSkills = profile.skills
    const recommendations: AIRecommendation[] = []
    
    // Анализируем навыки и предлагаем подходящие роли
    const hasAdvancedJS = userSkills.some(s => 
      allMockSkills.find(skill => skill.id === s.skillId)?.name === 'JavaScript' && 
      ['advanced', 'expert'].includes(s.level)
    )
    
    const hasLeadership = userSkills.some(s => 
      allMockSkills.find(skill => skill.id === s.skillId)?.competencyArea === 'leadership'
    )
    
    const hasDataSkills = userSkills.some(s => 
      allMockSkills.find(skill => skill.id === s.skillId)?.category === 'data-analysis'
    )
    
    if (hasAdvancedJS && hasLeadership) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        userId: profile.userId,
        type: 'role',
        targetId: 'senior-frontend-developer',
        title: 'Senior Frontend Developer',
        description: 'Ваши навыки JavaScript и лидерские качества идеально подходят для этой роли',
        reasoning: [
          'Продвинутые знания JavaScript',
          'Есть опыт лидерства',
          'Соответствует карьерному пути'
        ],
        confidence: 0.85,
        priority: 'high',
        status: 'active',
        metadata: {
          skillsMatch: 85,
          experienceRelevant: true,
          careerProgression: true
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    if (hasDataSkills) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        userId: profile.userId,
        type: 'role',
        targetId: 'data-scientist',
        title: 'Data Scientist',
        description: 'Ваши аналитические навыки позволяют рассмотреть переход в data science',
        reasoning: [
          'Сильные аналитические навыки',
          'Понимание работы с данными',
          'Растущая область с хорошими перспективами'
        ],
        confidence: 0.72,
        priority: 'medium',
        status: 'active',
        metadata: {
          skillsMatch: 70,
          experienceRelevant: false,
          careerProgression: true
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    // Добавляем рекомендацию развития навыков
    recommendations.push({
      id: `rec-${Date.now()}-3`,
      userId: profile.userId,
      type: 'skill',
      targetId: 'leadership',
      title: 'Развитие лидерских навыков',
      description: 'Лидерские навыки откроют новые карьерные возможности',
      reasoning: [
        'Подготовка к senior ролям',
        'Расширение зоны влияния',
        'Высокий спрос на рынке'
      ],
      confidence: 0.9,
      priority: 'high',
      status: 'active',
      metadata: {
        skillImportance: 'high',
        careerImpact: 'high'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    })
    
    return recommendations
  }

  async matchCandidates(jobDescription: string, candidates: User[]): Promise<CandidateMatch[]> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const matches: CandidateMatch[] = []
    
    // Анализируем каждого кандидата
    for (const candidate of candidates) {
      const score = this.calculateMatchScore(jobDescription, candidate)
      const skillsMatch = this.analyzeSkillsMatch(jobDescription, candidate)
      const explanation = this.generateMatchExplanation(jobDescription, candidate, score)
      
      matches.push({
        userId: candidate.id,
        vacancyId: 'temp-vacancy-id',
        overallScore: score,
        skillsMatch,
        readinessLevel: score >= 80 ? 'ready' : score >= 60 ? 'developing' : 'not_ready',
        explanation,
        recommendations: explanation.recommendations,
        matchedAt: new Date()
      })
    }
    
    // Сортируем по убыванию score
    return matches.sort((a, b) => b.overallScore - a.overallScore)
  }

  async explainMatch(candidate: User, vacancy: Vacancy): Promise<MatchExplanation> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return this.generateMatchExplanation(vacancy.description, candidate, 
      this.calculateMatchScore(vacancy.description, candidate))
  }

  async generateQuests(userProfile: Profile): Promise<Quest[]> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Здесь была бы логика генерации персонализированных квестов
    // На основе анализа профиля и пробелов в навыках
    return []
  }

  isAvailable(): boolean {
    return true // Mock всегда доступен
  }

  getProviderInfo() {
    return {
      name: 'Mock LLM Provider',
      version: '1.0.0',
      capabilities: ['chat', 'recommendations', 'matching', 'quest_generation']
    }
  }

  // Приватные методы для генерации ответов
  private generateSkillAdvice(context: string, message: string): string {
    const skillAdvices = [
      "Для развития этого навыка рекомендую начать с онлайн-курсов и практических проектов.",
      "Этот навык хорошо дополнит ваш профиль. Предлагаю найти ментора или присоединиться к сообществу практиков.",
      "Отличный выбор! Этот навык востребован в индустрии. Начните с основ и постепенно углубляйтесь.",
      "Рекомендую изучать этот навык в контексте реальных проектов - так знания лучше закрепятся."
    ]
    
    return skillAdvices[Math.floor(Math.random() * skillAdvices.length)]
  }
  
  private generateCareerAdvice(context: string, message: string): string {
    const careerAdvices = [
      "Ваш карьерный путь выглядит перспективно. Рекомендую сосредоточиться на развитии soft skills и лидерских качеств.",
      "Для следующего карьерного шага важно получить опыт в смежных областях и расширить сеть профессиональных контактов.",
      "Предлагаю составить план развития на 6-12 месяцев с конкретными целями и метриками.",
      "Рассмотрите возможность менторства или участия в кросс-функциональных проектах для расширения экспертизы."
    ]
    
    return careerAdvices[Math.floor(Math.random() * careerAdvices.length)]
  }
  
  private generateQuestAdvice(context: string, message: string): string {
    const questAdvices = [
      "Рекомендую начать с квестов по развитию ключевых навыков. Они дадут быстрый результат и мотивацию.",
      "Обратите внимание на квесты по заполнению профиля - это повысит вашу видимость для HR.",
      "Советую сочетать технические квесты с развитием soft skills для комплексного роста.",
      "Командные квесты помогут улучшить коллаборацию и получить обратную связь от коллег."
    ]
    
    return questAdvices[Math.floor(Math.random() * questAdvices.length)]
  }
  
  private generateTeamAdvice(context: string, message: string): string {
    const teamAdvices = [
      "Для улучшения командной работы рекомендую участвовать в peer review и давать конструктивную обратную связь.",
      "Рассмотрите возможность менторинга junior коллег - это развивает лидерские навыки.",
      "Активное участие в командных ретроспективах поможет улучшить процессы и атмосферу.",
      "Предлагаю инициировать knowledge sharing сессии по вашей экспертизе."
    ]
    
    return teamAdvices[Math.floor(Math.random() * teamAdvices.length)]
  }
  
  private calculateMatchScore(jobDescription: string, candidate: User): number {
    // Упрощенный алгоритм подсчета совпадений
    const baseScore = 40 + Math.random() * 40 // 40-80 базовый score
    const profileBonus = candidate.profile.completeness.overall * 0.2 // До 20 бонусных баллов
    const experienceBonus = candidate.profile.experiences.length * 5 // До 15 баллов за опыт
    
    return Math.min(100, Math.round(baseScore + profileBonus + experienceBonus))
  }
  
  private analyzeSkillsMatch(jobDescription: string, candidate: User) {
    // Упрощенный анализ навыков
    return candidate.profile.skills.slice(0, 5).map(skill => {
      const skillData = allMockSkills.find(s => s.id === skill.skillId)
      
      return {
        skillId: skill.skillId,
        required: Math.random() > 0.5,
        requiredLevel: 'intermediate' as any,
        userLevel: skill.level,
        gap: Math.random() * 2 - 1, // от -1 до 1
        weight: Math.random(),
        contribution: Math.random() * 20
      }
    })
  }
  
  private generateMatchExplanation(jobDescription: string, candidate: User, score: number): MatchExplanation {
    const strengths = [
      'Сильные технические навыки',
      'Релевантный опыт работы',
      'Высокая мотивация к развитию',
      'Хорошая культурная совместимость'
    ].slice(0, Math.floor(Math.random() * 3) + 1)
    
    const gaps = [
      'Требуется дополнительное обучение по некоторым технологиям',
      'Недостаточно опыта в лидерских ролях',
      'Нужно углубить знания в предметной области'
    ].slice(0, Math.floor(Math.random() * 2) + 1)
    
    const developmentPath = [
      'Пройти курс по недостающим технологиям',
      'Получить практический опыт на проектах',
      'Найти ментора в новой области',
      'Участвовать в профильных митапах'
    ].slice(0, Math.floor(Math.random() * 3) + 2)
    
    const estimatedReadinessTime = Math.floor(Math.random() * 12) + 1
    
    return {
      overallScore: score,
      score,
      strengths,
      gaps,
      developmentPath,
      estimatedReadinessTime,
      riskFactors: score < 60 ? ['Низкий уровень готовности', 'Требуется значительное обучение'] : [],
      recommendations: [
        'Провести техническое интервью',
        'Обсудить план адаптации',
        'Назначить buddy для поддержки'
      ],
      timeToReady: `${estimatedReadinessTime} месяцев`,
      confidence: 85
    }
  }
}

// Scibox LLM клиент (для production)
class SciboxLLMClient implements LLMClient {
  private apiBase: string
  
  constructor() {
    // Используем серверный прокси вместо прямого обращения к Scibox
    this.apiBase = '/api/llm'
  }
  
  async chat(context: string, messages: ChatMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Scibox LLM не доступен')
    }
    
    try {
      // Вызов через серверный прокси
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          context,
          stream: false,
          temperature: 0.7,
          max_tokens: 4096
        }),
        signal: AbortSignal.timeout(60000)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Scibox API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      // Обрабатываем различные форматы ответов от SciBox API
      if (data.choices && data.choices.length > 0) {
        // OpenAI-совместимый формат
        const choice = data.choices[0]
        if (choice.message && choice.message.content) {
          return choice.message.content
        }
        if (choice.text) {
          return choice.text
        }
      }
      
      // Прямые поля ответа
      if (data.content) return data.content
      if (data.message) return data.message
      if (data.response) return data.response
      if (data.text) return data.text
      
      // Если есть error в ответе
      if (data.error) {
        throw new Error(`SciBox API error: ${data.error}`)
      }
      
      console.warn('Неожиданный формат ответа от SciBox:', data)
      return 'Извините, не удалось получить ответ'
      
    } catch (error) {
      console.error('Ошибка Scibox LLM:', error)
      throw error
    }
  }
  
  async recommendRoles(profile: Profile): Promise<AIRecommendation[]> {
    // Используем SciboxLLMClient для получения рекомендаций
    const sciboxClient = new SciBoxLLMClient()
    return await sciboxClient.recommendRoles(profile)
  }
  
  async matchCandidates(jobDescription: string, candidates: User[]): Promise<CandidateMatch[]> {
    // Используем mock логику для совместимости
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const matches: CandidateMatch[] = []
    
    // Если кандидаты не переданы, используем всех пользователей
    const candidatesToAnalyze = candidates.length > 0 ? candidates : mockUsers
    
    // Анализируем каждого кандидата
    for (const candidate of candidatesToAnalyze) {
      const score = this.calculateMatchScore(jobDescription, candidate)
      const skillsMatch = this.analyzeSkillsMatch(jobDescription, candidate)
      const explanation = this.generateMatchExplanation(jobDescription, candidate, score)
      
      matches.push({
        userId: candidate.id,
        vacancyId: 'temp-vacancy-id',
        overallScore: score,
        skillsMatch,
        readinessLevel: score >= 80 ? 'ready' : score >= 60 ? 'developing' : 'not_ready',
        explanation,
        recommendations: explanation.recommendations,
        matchedAt: new Date()
      })
    }
    
    // Сортируем по убыванию score
    return matches.sort((a, b) => b.overallScore - a.overallScore)
  }
  
  async explainMatch(candidate: User, vacancy: Vacancy): Promise<MatchExplanation> {
    // Используем mock логику для совместимости
    const score = this.calculateMatchScore(vacancy.description, candidate)
    return this.generateMatchExplanation(vacancy.description, candidate, score)
  }
  
  async generateQuests(userProfile: Profile): Promise<Quest[]> {
    // Реализация для Scibox
    throw new Error('Not implemented for Scibox yet')
  }
  
  async* chatStream(messages: ChatMessage[]): AsyncGenerator<{content?: string, error?: string, finished?: boolean}> {
    if (!this.isAvailable()) {
      yield { error: 'Scibox LLM не доступен' }
      return
    }
    
    try {
      const response = await fetch(`${this.apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: true,
          temperature: 0.7,
          max_tokens: 4096
        }),
        signal: AbortSignal.timeout(60000)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        yield { error: `Scibox API error: ${response.status} - ${errorData.error || 'Unknown error'}` }
        return
      }
      
      if (!response.body) {
        yield { error: 'Нет данных в ответе' }
        return
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            yield { finished: true }
            break
          }
          
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                yield { finished: true }
                return
              }
              
              try {
                 const parsed = JSON.parse(data)
                 
                 // OpenAI-совместимый формат streaming
                 if (parsed.choices && parsed.choices[0]) {
                   const choice = parsed.choices[0]
                   if (choice.delta && choice.delta.content) {
                     yield { content: choice.delta.content }
                   } else if (choice.text) {
                     yield { content: choice.text }
                   }
                 }
                 // Прямые поля для streaming
                 else if (parsed.content) {
                   yield { content: parsed.content }
                 }
                 else if (parsed.text) {
                   yield { content: parsed.text }
                 }
                 else if (parsed.token) {
                   yield { content: parsed.token }
                 }
                 // Обработка ошибок в streaming
                 else if (parsed.error) {
                   yield { error: parsed.error }
                   return
                 }
                 
               } catch (parseError) {
                 // Игнорируем ошибки парсинга отдельных чанков
                 console.warn('Ошибка парсинга SSE chunk:', parseError)
               }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      console.error('Ошибка Scibox streaming:', error)
      yield { error: error instanceof Error ? error.message : 'Неизвестная ошибка' }
    }
  }
  
  isAvailable(): boolean {
    // Проверяем доступность через feature flags
    return isFeatureEnabled('enableSciboxLLM') && !isFeatureEnabled('mockMode')
  }
  
  getProviderInfo() {
    return {
      name: 'Scibox LLM',
      version: '2.0.0',
      capabilities: ['chat', 'recommendations', 'matching', 'reasoning', 'streaming']
    }
  }
  
  private calculateMatchScore(jobDescription: string, candidate: User): number {
    // Упрощенный алгоритм подсчета совпадений
    const baseScore = 40 + Math.random() * 40 // 40-80 базовый score
    const profileBonus = candidate.profile.completeness.overall * 0.2 // До 20 бонусных баллов
    const experienceBonus = candidate.profile.experiences.length * 5 // До 15 баллов за опыт
    
    return Math.min(100, Math.round(baseScore + profileBonus + experienceBonus))
  }
  
  private analyzeSkillsMatch(jobDescription: string, candidate: User) {
    // Упрощенный анализ навыков
    return candidate.profile.skills.slice(0, 5).map(skill => {
      const skillData = allMockSkills.find(s => s.id === skill.skillId)
      
      return {
        skillId: skill.skillId,
        required: Math.random() > 0.5,
        requiredLevel: 'intermediate' as any,
        userLevel: skill.level,
        gap: Math.random() * 2 - 1, // от -1 до 1
        weight: Math.random(),
        contribution: Math.random() * 20
      }
    })
  }
  
  private generateMatchExplanation(jobDescription: string, candidate: User, score: number): MatchExplanation {
    const strengths = [
      'Сильные технические навыки',
      'Релевантный опыт работы',
      'Высокая мотивация к развитию',
      'Хорошая культурная совместимость'
    ].slice(0, Math.floor(Math.random() * 3) + 1)
    
    const gaps = [
      'Требуется дополнительное обучение по некоторым технологиям',
      'Недостаточно опыта в лидерских ролях',
      'Нужно углубить знания в предметной области'
    ].slice(0, Math.floor(Math.random() * 2) + 1)
    
    const developmentPath = [
      'Пройти курс по недостающим технологиям',
      'Получить практический опыт на проектах',
      'Найти ментора в новой области',
      'Участвовать в профильных митапах'
    ].slice(0, Math.floor(Math.random() * 3) + 2)
    
    const estimatedReadinessTime = Math.floor(Math.random() * 12) + 1
    
    return {
      overallScore: score,
      score,
      strengths,
      gaps,
      developmentPath,
      estimatedReadinessTime,
      riskFactors: score < 60 ? ['Низкий уровень готовности', 'Требуется значительное обучение'] : [],
      recommendations: [
        'Провести техническое интервью',
        'Обсудить план адаптации',
        'Назначить buddy для поддержки'
      ],
      timeToReady: `${estimatedReadinessTime} месяцев`,
      confidence: 85
    }
  }
}

// Фабрика для создания LLM клиента
export function createLLMClient(): LLMClient {
  // Используем SciBox клиент если он включен и mock режим отключен
  if (isFeatureEnabled('enableSciboxLLM') && !isFeatureEnabled('mockMode')) {
    return new SciboxLLMClient()
  } else {
    return new MockLLMClient()
  }
}

// Синглтон клиента
let llmClientInstance: LLMClient | null = null

export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = createLLMClient()
  }
  return llmClientInstance
}

// Сброс клиента (для тестов)
export function resetLLMClient(): void {
  llmClientInstance = null
}

// Функция для создания стрима чата (новый метод)
export async function* chatStream(
  messages: any[], 
  context: string = 'general'
): AsyncGenerator<string> {
  const client = getLLMClient()
  
  if (isFeatureEnabled('enableSciboxLLM') && 'chatStream' in client) {
    // Используем реальный SciBox стриминг
    const sciboxClient = client as any as SciBoxLLMClient
    
    for await (const result of sciboxClient.chatStream(messages)) {
      if (result.error) {
        throw new Error(result.error)
      }
      
      if (result.content) {
        yield result.content
      }
      
      if (result.finished) {
        break
      }
    }
  } else {
    // Mock стриминг для демо
    const response = await client.chat(context, messages)
    const words = response.split(' ')
    
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
    }
  }
}

// Сбрасываем клиент для применения изменений
resetLLMClient()
