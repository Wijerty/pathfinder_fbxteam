// Сервис ИИ-анализа для HR подбора сотрудников
import { 
  HREmployeeData, 
  getUnifiedHREmployeeData,
  getHREmployeesBySkill,
  getHREmployeesByDepartment 
} from '@/mocks/users'
import { SciBoxLLMClient } from './sciboxLLMClient'

export interface AIAnalysisRequest {
  query: string // Текстовый запрос HR
  maxResults?: number
  minMatchScore?: number
}

export interface ExtractedRequirements {
  skills: {
    name: string
    level: number // 1-5
    required: boolean
    weight: number // 0-1
  }[]
  experience: {
    min?: number
    max?: number
    areas?: string[]
  }
  department?: string
  position?: string
  level?: 'junior' | 'middle' | 'senior' | 'lead'
  readinessForRotation?: boolean
  keywords: string[]
}

export interface EmployeeMatch {
  employee: HREmployeeData
  score: number // 0-100
  matchDetails: {
    skillsMatch: {
      matched: string[]
      missing: string[]
      overqualified: string[]
      skillScore: number
    }
    experienceMatch: {
      score: number
      details: string
    }
    departmentMatch: boolean
    levelMatch: boolean
    rotationMatch: boolean
  }
  explanation: string
  recommendations: string[]
}

export interface AISearchResult {
  matches: EmployeeMatch[]
  requirements: ExtractedRequirements
  searchSummary: string
  totalCandidates: number
}

export class HRAIService {
  private llmClient: SciBoxLLMClient
  private requirementsCache: Map<string, ExtractedRequirements> = new Map()

  constructor() {
    this.llmClient = new SciBoxLLMClient()
  }

  /**
   * Основная функция ИИ-поиска сотрудников
   */
  async searchEmployees(request: AIAnalysisRequest): Promise<AISearchResult> {
    try {
      // 1. Извлекаем требования из текстового запроса
      const requirements = await this.extractRequirements(request.query)
      
      // 2. Получаем всех сотрудников
      const allEmployees = getUnifiedHREmployeeData()
      
      // 3. Фильтруем и оцениваем кандидатов
      const matches = await this.matchEmployees(allEmployees, requirements)
      
      // 4. Сортируем по релевантности
      const sortedMatches = matches
        .filter(match => match.score >= (request.minMatchScore || 30))
        .sort((a, b) => b.score - a.score)
        .slice(0, request.maxResults || 10)
      
      // 5. Генерируем сводку поиска
      const searchSummary = await this.generateSearchSummary(request.query, requirements, sortedMatches)
      
      return {
        matches: sortedMatches,
        requirements,
        searchSummary,
        totalCandidates: allEmployees.length
      }
    } catch (error) {
      console.error('Ошибка ИИ-поиска:', error)
      throw error
    }
  }

  /**
   * Извлечение требований из текстового запроса с помощью ИИ
   */
  private async extractRequirements(query: string): Promise<ExtractedRequirements> {
    // Проверяем кэш
    const cacheKey = query.toLowerCase().trim()
    if (this.requirementsCache.has(cacheKey)) {
      return this.requirementsCache.get(cacheKey)!
    }

    const prompt = `
Анализируй следующий запрос HR и извлеки структурированные требования к кандидату:

"${query}"

Верни результат в формате JSON:
{
  "skills": [
    {
      "name": "React",
      "level": 4,
      "required": true,
      "weight": 0.8
    }
  ],
  "experience": {
    "min": 3,
    "max": 7,
    "areas": ["frontend", "web development"]
  },
  "department": "Engineering",
  "position": "Frontend Developer",
  "level": "senior",
  "readinessForRotation": false,
  "keywords": ["react", "typescript", "frontend"]
}

Учитывай:
- Уровни навыков: 1-начинающий, 2-базовый, 3-средний, 4-продвинутый, 5-эксперт
- Веса навыков: 0.1-0.3 желательно, 0.4-0.7 важно, 0.8-1.0 критично
- Извлекай все упомянутые технологии, инструменты, методологии
`

    try {
      const response = await this.llmClient.chat([
        {
          role: 'system',
          content: 'Ты эксперт по анализу HR запросов. Извлекай структурированные требования из текста.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], { temperature: 0.1 })

      const parsed = JSON.parse(response)
      const requirements = this.validateRequirements(parsed)
      
      // Сохраняем в кэш
      this.requirementsCache.set(cacheKey, requirements)
      
      return requirements
    } catch (error) {
      console.error('Ошибка извлечения требований:', error)
      // Возвращаем базовые требования при ошибке
      const fallbackRequirements = this.extractRequirementsFallback(query)
      this.requirementsCache.set(cacheKey, fallbackRequirements)
      return fallbackRequirements
    }
  }

  /**
   * Сопоставление сотрудников с требованиями
   */
  private async matchEmployees(
    employees: HREmployeeData[], 
    requirements: ExtractedRequirements
  ): Promise<EmployeeMatch[]> {
    const matches: EmployeeMatch[] = []

    for (const employee of employees) {
      const match = await this.calculateEmployeeMatch(employee, requirements)
      matches.push(match)
    }

    return matches
  }

  /**
   * Расчет соответствия конкретного сотрудника требованиям
   */
  private async calculateEmployeeMatch(
    employee: HREmployeeData, 
    requirements: ExtractedRequirements
  ): Promise<EmployeeMatch> {
    // Анализ навыков
    const skillsMatch = this.analyzeSkillsMatch(employee, requirements.skills)
    
    // Анализ опыта
    const experienceMatch = this.analyzeExperienceMatch(employee, requirements.experience)
    
    // Анализ отдела
    const departmentMatch = !requirements.department || 
      employee.department.toLowerCase().includes(requirements.department.toLowerCase())
    
    // Анализ уровня
    const levelMatch = !requirements.level || employee.level === requirements.level
    
    // Анализ готовности к ротации
    const rotationMatch = requirements.readinessForRotation === undefined || 
      employee.readinessForRotation === requirements.readinessForRotation

    // Расчет общего скора
    const score = this.calculateOverallScore({
      skillsMatch,
      experienceMatch,
      departmentMatch,
      levelMatch,
      rotationMatch
    })

    // Генерация объяснения
    const explanation = this.generateMatchExplanation(employee, requirements, {
      skillsMatch,
      experienceMatch,
      departmentMatch,
      levelMatch,
      rotationMatch
    })

    // Генерация рекомендаций
    const recommendations = this.generateRecommendations(employee, requirements, skillsMatch)

    return {
      employee,
      score,
      matchDetails: {
        skillsMatch,
        experienceMatch,
        departmentMatch,
        levelMatch,
        rotationMatch
      },
      explanation,
      recommendations
    }
  }

  /**
   * Анализ соответствия навыков с улучшенным алгоритмом
   */
  private analyzeSkillsMatch(employee: HREmployeeData, requiredSkills: ExtractedRequirements['skills']) {
    const matched: string[] = []
    const missing: string[] = []
    const overqualified: string[] = []
    
    let totalScore = 0
    let totalWeight = 0

    // Создаем карту синонимов для более точного сопоставления
    const skillSynonyms: { [key: string]: string[] } = {
      'react': ['reactjs', 'react.js', 'реакт'],
      'javascript': ['js', 'джаваскрипт', 'javascript'],
      'typescript': ['ts', 'тайпскрипт'],
      'python': ['питон', 'пайтон'],
      'node.js': ['nodejs', 'node', 'нода'],
      'vue': ['vue.js', 'vuejs', 'вью'],
      'angular': ['angularjs', 'ангуляр'],
      'docker': ['докер', 'контейнеризация'],
      'kubernetes': ['k8s', 'кубернетес'],
      'postgresql': ['postgres', 'постгрес'],
      'mongodb': ['mongo', 'монго']
    }

    const findSkillMatch = (reqSkillName: string, empSkillName: string): boolean => {
      const reqLower = reqSkillName.toLowerCase()
      const empLower = empSkillName.toLowerCase()
      
      // Прямое совпадение
      if (reqLower === empLower || reqLower.includes(empLower) || empLower.includes(reqLower)) {
        return true
      }
      
      // Проверка синонимов
      for (const [key, synonyms] of Object.entries(skillSynonyms)) {
        if ((key === reqLower || synonyms.includes(reqLower)) && 
            (key === empLower || synonyms.includes(empLower))) {
          return true
        }
      }
      
      return false
    }

    for (const reqSkill of requiredSkills) {
      const empSkill = employee.skills.find(s => 
        findSkillMatch(reqSkill.name, s.skillName)
      )

      totalWeight += reqSkill.weight

      if (empSkill) {
        matched.push(empSkill.skillName)
        
        // Улучшенная система оценки уровня навыков
        const levelDiff = empSkill.numericLevel - reqSkill.level
        if (levelDiff >= 0) {
          // Полное соответствие или превышение
          totalScore += reqSkill.weight * 100
          if (levelDiff > 1) {
            overqualified.push(empSkill.skillName)
          }
        } else {
          // Частичное соответствие - пропорциональная оценка
          const partialScore = Math.max(0, (empSkill.numericLevel / reqSkill.level) * 0.7)
          totalScore += reqSkill.weight * partialScore * 100
        }
      } else {
        // Навык отсутствует
        if (reqSkill.required) {
          missing.push(reqSkill.name)
        }
      }
    }

    // Нормализуем итоговый скор
    const skillScore = totalWeight > 0 ? Math.min(100, totalScore / totalWeight) : 0

    return {
      matched,
      missing,
      overqualified,
      skillScore: Math.round(skillScore)
    }
  }

  /**
   * Улучшенный анализ соответствия опыта
   */
  private analyzeExperienceMatch(employee: HREmployeeData, experienceReq: ExtractedRequirements['experience']) {
    let score = 100
    let details = 'Опыт соответствует требованиям'

    // Проверяем общий опыт работы
    if (experienceReq.min !== undefined) {
      if (employee.experience < experienceReq.min) {
        const deficit = experienceReq.min - employee.experience
        score = Math.max(0, 100 - (deficit * 20)) // Снижаем на 20% за каждый недостающий год
        details = `Недостаточно опыта: ${employee.experience} лет из требуемых ${experienceReq.min}+`
      }
    }

    if (experienceReq.max !== undefined && employee.experience > experienceReq.max) {
      const excess = employee.experience - experienceReq.max
      if (excess > 3) {
        score = Math.max(70, score - (excess * 5)) // Небольшое снижение за переквалификацию
        details = `Возможна переквалификация: ${employee.experience} лет опыта`
      }
    }

    // Проверяем соответствие областей опыта
    if (experienceReq.areas && experienceReq.areas.length > 0) {
      const employeeAreas = [
        employee.department.toLowerCase(),
        employee.position.toLowerCase(),
        ...employee.skills.map(s => s.skillName.toLowerCase())
      ]
      
      const matchedAreas = experienceReq.areas.filter(area => 
        employeeAreas.some(empArea => 
          empArea.includes(area.toLowerCase()) || area.toLowerCase().includes(empArea)
        )
      )
      
      if (matchedAreas.length === 0) {
        score = Math.max(30, score * 0.6) // Значительное снижение за несоответствие области
        details = `Опыт в другой области: ${employee.department}`
      } else if (matchedAreas.length < experienceReq.areas.length) {
        score = Math.max(60, score * 0.8) // Частичное соответствие
        details = `Частичное соответствие области опыта`
      }
    }

    return {
      score: Math.round(score),
      details
    }
  }

  /**
   * Улучшенный расчет общего скора с весовыми коэффициентами
   */
  private calculateOverallScore(matchDetails: any): number {
    const weights = {
      skills: 0.4,        // 40% - навыки самое важное
      experience: 0.25,   // 25% - опыт
      department: 0.15,   // 15% - отдел
      level: 0.1,         // 10% - уровень
      rotation: 0.1       // 10% - готовность к ротации
    }

    let totalScore = 0
    
    // Навыки
    totalScore += matchDetails.skillsMatch.skillScore * weights.skills
    
    // Опыт
    totalScore += matchDetails.experienceMatch.score * weights.experience
    
    // Отдел
    totalScore += (matchDetails.departmentMatch ? 100 : 50) * weights.department
    
    // Уровень
    totalScore += (matchDetails.levelMatch ? 100 : 70) * weights.level
    
    // Ротация
    totalScore += (matchDetails.rotationMatch ? 100 : 80) * weights.rotation

    // Бонусы за превосходство
    if (matchDetails.skillsMatch.overqualified.length > 0) {
      totalScore += Math.min(10, matchDetails.skillsMatch.overqualified.length * 2)
    }

    return Math.min(100, Math.round(totalScore))
  }

  /**
   * Улучшенная генерация объяснения соответствия
   */
  private generateMatchExplanation(
    employee: HREmployeeData, 
    requirements: ExtractedRequirements, 
    matchDetails: any
  ): string {
    const explanations: string[] = []
    
    // Анализ навыков
    if (matchDetails.skillsMatch.matched.length > 0) {
      explanations.push(`✅ Соответствующие навыки: ${matchDetails.skillsMatch.matched.slice(0, 3).join(', ')}`)
    }
    
    if (matchDetails.skillsMatch.missing.length > 0) {
      explanations.push(`❌ Недостающие навыки: ${matchDetails.skillsMatch.missing.slice(0, 3).join(', ')}`)
    }
    
    if (matchDetails.skillsMatch.overqualified.length > 0) {
      explanations.push(`⭐ Превосходящие навыки: ${matchDetails.skillsMatch.overqualified.slice(0, 2).join(', ')}`)
    }
    
    // Анализ опыта
    explanations.push(`📊 ${matchDetails.experienceMatch.details}`)
    
    // Анализ отдела и уровня
    if (matchDetails.departmentMatch) {
      explanations.push(`🏢 Подходящий отдел: ${employee.department}`)
    } else if (requirements.department) {
      explanations.push(`🔄 Другой отдел: ${employee.department} (требуется ${requirements.department})`)
    }
    
    if (matchDetails.levelMatch) {
      explanations.push(`📈 Соответствующий уровень: ${employee.level}`)
    }
    
    return explanations.join('\n')
  }

  /**
   * Улучшенная генерация рекомендаций
   */
  private generateRecommendations(
    employee: HREmployeeData, 
    requirements: ExtractedRequirements, 
    skillsMatch: any
  ): string[] {
    const recommendations: string[] = []
    
    // Рекомендации по недостающим навыкам
    if (skillsMatch.missing.length > 0) {
      recommendations.push(`Рекомендуется обучение: ${skillsMatch.missing.slice(0, 3).join(', ')}`)
    }
    
    // Рекомендации по использованию сильных сторон
    if (skillsMatch.overqualified.length > 0) {
      recommendations.push(`Может быть ментором по: ${skillsMatch.overqualified.slice(0, 2).join(', ')}`)
    }
    
    // Рекомендации по карьерному росту
    if (employee.level === 'junior' && requirements.level === 'senior') {
      recommendations.push('Рассмотреть для программы развития до senior уровня')
    }
    
    // Рекомендации по ротации
    if (employee.readinessForRotation && !requirements.readinessForRotation) {
      recommendations.push('Готов к ротации - можно рассмотреть для других проектов')
    }
    
    return recommendations
  }

  /**
    * Улучшенная генерация сводки поиска с детальной аналитикой
    */
   private async generateSearchSummary(
     query: string, 
     requirements: ExtractedRequirements, 
     matches: EmployeeMatch[]
   ): Promise<string> {
     if (matches.length === 0) {
       return `По запросу "${query}" подходящих кандидатов не найдено. Рекомендуется расширить критерии поиска или рассмотреть обучение существующих сотрудников.`
     }

     const topMatches = matches.slice(0, 3)
     const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length
     const excellentMatches = matches.filter(m => m.score >= 80).length
     const goodMatches = matches.filter(m => m.score >= 60 && m.score < 80).length
     const potentialMatches = matches.filter(m => m.score >= 40 && m.score < 60).length

     let summary = `По запросу "${query}" найдено ${matches.length} кандидатов. `
     summary += `Средний балл соответствия: ${avgScore.toFixed(1)}%. `
     
     if (excellentMatches > 0) {
       summary += `Отличных кандидатов: ${excellentMatches}. `
     }
     if (goodMatches > 0) {
       summary += `Хороших кандидатов: ${goodMatches}. `
     }
     if (potentialMatches > 0) {
       summary += `Потенциальных кандидатов: ${potentialMatches}. `
     }

     if (topMatches.length > 0) {
       summary += `Топ кандидаты: ${topMatches.map(m => `${m.employee.fullName} (${m.score}%)`).join(', ')}.`
     }

     return summary
   }

  /**
   * Валидация извлеченных требований
   */
  private validateRequirements(requirements: any): ExtractedRequirements {
    return {
      skills: Array.isArray(requirements.skills) ? requirements.skills : [],
      experience: requirements.experience || {},
      department: requirements.department,
      position: requirements.position,
      level: requirements.level,
      readinessForRotation: requirements.readinessForRotation,
      keywords: Array.isArray(requirements.keywords) ? requirements.keywords : []
    }
  }

  /**
   * Fallback извлечение требований при ошибке ИИ
   */
  private extractRequirementsFallback(query: string): ExtractedRequirements {
    const lowerQuery = query.toLowerCase()
    const skills: ExtractedRequirements['skills'] = []
    const keywords: string[] = []

    // Простое извлечение популярных технологий
    const techKeywords = [
      'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'c#', 'php',
      'node.js', 'express', 'django', 'spring', 'laravel', 'docker', 'kubernetes', 'aws',
      'postgresql', 'mysql', 'mongodb', 'redis', 'git', 'figma', 'photoshop'
    ]

    techKeywords.forEach(tech => {
      if (lowerQuery.includes(tech)) {
        skills.push({
          name: tech,
          level: 3, // Средний уровень по умолчанию
          required: true,
          weight: 0.7
        })
        keywords.push(tech)
      }
    })

    return {
      skills,
      experience: {},
      keywords
    }
  }
}

// Экспорт экземпляра сервиса
export const hrAIService = new HRAIService()