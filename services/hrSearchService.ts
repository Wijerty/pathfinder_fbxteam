// Сервис поиска и матчинга для HR
import { 
  User, 
  Vacancy, 
  CandidateMatch, 
  SkillMatch, 
  MatchExplanation,
  SkillLevel,
  ReadinessLevel
} from '@/types'
import { mockUsers, allMockSkills, mockVacancies } from '@/mocks'
import { getCandidateMatchingThresholds, getReadinessLevel } from '@/config/thresholds'
import { skillWeights } from '@/config/skills'

export interface SearchFilters {
  departments?: string[]
  skills?: string[]
  experienceYears?: { min?: number; max?: number }
  skillLevels?: SkillLevel[]
  readinessForRotation?: boolean
  profileCompleteness?: { min?: number }
  lastActivity?: { days?: number }
  locations?: string[]
}

export interface SearchResult {
  users: User[]
  total: number
  filters: SearchFilters
  aggregations: {
    departments: Record<string, number>
    skills: Record<string, number>
    levels: Record<string, number>
    avgCompleteness: number
  }
}

export class HRSearchService {
  
  // === ПОИСК СОТРУДНИКОВ ===
  
  async searchEmployees(
    query: string = '',
    filters: SearchFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult> {
    let results = [...mockUsers.filter(user => user.isActive)]
    
    // Текстовый поиск
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase()
      results = results.filter(user =>
        user.firstName.toLowerCase().includes(lowercaseQuery) ||
        user.lastName.toLowerCase().includes(lowercaseQuery) ||
        user.position.toLowerCase().includes(lowercaseQuery) ||
        user.department.toLowerCase().includes(lowercaseQuery) ||
        user.profile.bio?.toLowerCase().includes(lowercaseQuery) ||
        user.profile.skills.some(skill => {
          const skillData = allMockSkills.find(s => s.id === skill.skillId)
          return skillData?.name.toLowerCase().includes(lowercaseQuery)
        })
      )
    }
    
    // Применяем фильтры
    results = this.applyFilters(results, filters)
    
    const total = results.length
    
    // Пагинация
    const paginatedResults = results.slice(offset, offset + limit)
    
    // Подсчитываем агрегации
    const aggregations = this.calculateAggregations(results)
    
    return {
      users: paginatedResults,
      total,
      filters,
      aggregations
    }
  }
  
  private applyFilters(users: User[], filters: SearchFilters): User[] {
    let filtered = users
    
    // Фильтр по отделам
    if (filters.departments && filters.departments.length > 0) {
      filtered = filtered.filter(user => 
        filters.departments!.includes(user.department)
      )
    }
    
    // Фильтр по навыкам
    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter(user =>
        filters.skills!.some(skillId =>
          user.profile.skills.some(userSkill => userSkill.skillId === skillId)
        )
      )
    }
    
    // Фильтр по опыту работы
    if (filters.experienceYears) {
      filtered = filtered.filter(user => {
        const totalExperience = this.calculateTotalExperience(user)
        
        if (filters.experienceYears!.min !== undefined && totalExperience < filters.experienceYears!.min) {
          return false
        }
        
        if (filters.experienceYears!.max !== undefined && totalExperience > filters.experienceYears!.max) {
          return false
        }
        
        return true
      })
    }
    
    // Фильтр по уровням навыков
    if (filters.skillLevels && filters.skillLevels.length > 0) {
      filtered = filtered.filter(user =>
        user.profile.skills.some(skill =>
          filters.skillLevels!.includes(skill.level)
        )
      )
    }
    
    // Фильтр по готовности к ротации
    if (filters.readinessForRotation !== undefined) {
      filtered = filtered.filter(user =>
        user.profile.readinessForRotation === filters.readinessForRotation
      )
    }
    
    // Фильтр по полноте профиля
    if (filters.profileCompleteness?.min !== undefined) {
      filtered = filtered.filter(user =>
        user.profile.completeness.overall >= filters.profileCompleteness!.min!
      )
    }
    
    // Фильтр по последней активности
    if (filters.lastActivity?.days !== undefined) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - filters.lastActivity.days)
      
      filtered = filtered.filter(user =>
        user.lastLoginAt && user.lastLoginAt >= daysAgo
      )
    }
    
    return filtered
  }
  
  private calculateTotalExperience(user: User): number {
    return user.profile.experiences.reduce((total, exp) => {
      const start = exp.startDate.getTime()
      const end = exp.endDate ? exp.endDate.getTime() : Date.now()
      const years = (end - start) / (365 * 24 * 60 * 60 * 1000)
      return total + years
    }, 0)
  }
  
  private calculateAggregations(users: User[]) {
    const departments: Record<string, number> = {}
    const skills: Record<string, number> = {}
    const levels: Record<string, number> = {}
    let totalCompleteness = 0
    
    users.forEach(user => {
      // Отделы
      departments[user.department] = (departments[user.department] || 0) + 1
      
      // Навыки
      user.profile.skills.forEach(userSkill => {
        const skill = allMockSkills.find(s => s.id === userSkill.skillId)
        if (skill) {
          skills[skill.name] = (skills[skill.name] || 0) + 1
        }
      })
      
      // Уровни должностей
      levels[user.position] = (levels[user.position] || 0) + 1
      
      // Полнота профиля
      totalCompleteness += user.profile.completeness.overall
    })
    
    return {
      departments,
      skills,
      levels,
      avgCompleteness: users.length > 0 ? Math.round(totalCompleteness / users.length) : 0
    }
  }
  
  // === МАТЧИНГ КАНДИДАТОВ ===
  
  async matchCandidatesForVacancy(
    vacancyId: string,
    options: {
      includeNotReady?: boolean
      maxResults?: number
      minScore?: number
    } = {}
  ): Promise<CandidateMatch[]> {
    const vacancy = mockVacancies.find(v => v.id === vacancyId)
    if (!vacancy) {
      throw new Error('Вакансия не найдена')
    }
    
    const {
      includeNotReady = true,
      maxResults = 50,
      minScore = getCandidateMatchingThresholds().minScore
    } = options
    
    const candidates = mockUsers.filter(user => 
      user.isActive && 
      user.role === 'employee' &&
      (includeNotReady || user.profile.readinessForRotation)
    )
    
    const matches: CandidateMatch[] = []
    
    for (const candidate of candidates) {
      const match = await this.calculateCandidateMatch(candidate, vacancy)
      
      if (match.overallScore >= minScore) {
        matches.push(match)
      }
    }
    
    // Сортируем по убыванию score
    matches.sort((a, b) => b.overallScore - a.overallScore)
    
    return matches.slice(0, maxResults)
  }
  
  async calculateCandidateMatch(candidate: User, vacancy: Vacancy): Promise<CandidateMatch> {
    const skillsMatch = this.calculateSkillsMatch(candidate, vacancy)
    const experienceScore = this.calculateExperienceScore(candidate, vacancy)
    const readinessScore = this.calculateReadinessScore(candidate)
    const culturalScore = this.calculateCulturalScore(candidate, vacancy)
    const growthScore = this.calculateGrowthScore(candidate, vacancy)
    
    const weights = getCandidateMatchingThresholds().weights
    
    const overallScore = Math.round(
      skillsMatch.reduce((sum, sm) => sum + sm.contribution, 0) * weights.skillsMatch +
      experienceScore * weights.experience +
      readinessScore * weights.readiness +
      culturalScore * weights.cultural +
      growthScore * weights.growth
    )
    
    const explanation = this.generateMatchExplanation(
      candidate, 
      vacancy, 
      { skillsMatch, experienceScore, readinessScore, culturalScore, growthScore }
    )
    
    return {
      userId: candidate.id,
      vacancyId: vacancy.id,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      skillsMatch,
      readinessLevel: getReadinessLevel(overallScore),
      explanation,
      recommendations: explanation.recommendations,
      matchedAt: new Date()
    }
  }
  
  private calculateSkillsMatch(candidate: User, vacancy: Vacancy): SkillMatch[] {
    const allRequiredSkills = [...vacancy.requiredSkills, ...vacancy.preferredSkills]
    const skillMatches: SkillMatch[] = []
    
    for (const requiredSkill of allRequiredSkills) {
      const userSkill = candidate.profile.skills.find(us => us.skillId === requiredSkill.skillId)
      
      const skillMatch: SkillMatch = {
        skillId: requiredSkill.skillId,
        required: vacancy.requiredSkills.includes(requiredSkill),
        requiredLevel: requiredSkill.level,
        userLevel: userSkill?.level,
        gap: 0,
        weight: requiredSkill.weight,
        contribution: 0
      }
      
      if (userSkill) {
        // Рассчитываем gap между требуемым и фактическим уровнем
        const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
        const requiredIndex = levels.indexOf(requiredSkill.level)
        const userIndex = levels.indexOf(userSkill.level)
        
        skillMatch.gap = requiredIndex - userIndex
        
        // Рассчитываем вклад в общий score
        if (userIndex >= requiredIndex) {
          // Навык соответствует или превышает требования
          skillMatch.contribution = requiredSkill.weight * 20 * (userIndex - requiredIndex + 1)
        } else {
          // Навык не дотягивает до требований
          skillMatch.contribution = requiredSkill.weight * 10 * Math.max(0, 1 - (requiredIndex - userIndex) * 0.3)
        }
        
        // Бонус за endorsements
        if (userSkill.endorsements > 0) {
          skillMatch.contribution *= 1.1
        }
        
        // Бонус за актуальность
        if (userSkill.lastUsed && this.isSkillFresh(userSkill.lastUsed)) {
          skillMatch.contribution *= 1.05
        }
      } else {
        // Навык отсутствует
        skillMatch.gap = 4 // Максимальный gap
        skillMatch.contribution = requiredSkill.isCritical ? -10 : -5
      }
      
      skillMatches.push(skillMatch)
    }
    
    return skillMatches
  }
  
  private calculateExperienceScore(candidate: User, vacancy: Vacancy): number {
    const totalExperience = this.calculateTotalExperience(candidate)
    const requiredMin = vacancy.experienceYears.min
    const requiredMax = vacancy.experienceYears.max
    
    let score = 50 // Базовый score
    
    if (totalExperience >= requiredMin) {
      score += 20
      
      // Бонус за опыт в диапазоне
      if (totalExperience <= requiredMax) {
        score += 20
      } else {
        // Небольшой штраф за переквалификацию
        const excess = totalExperience - requiredMax
        score -= Math.min(15, excess * 2)
      }
    } else {
      // Штраф за недостаток опыта
      const deficit = requiredMin - totalExperience
      score -= deficit * 10
    }
    
    // Бонус за релевантный опыт в том же отделе
    const relevantExp = candidate.profile.experiences.filter(exp => 
      exp.isInternal || exp.title.toLowerCase().includes(vacancy.department.toLowerCase())
    )
    
    if (relevantExp.length > 0) {
      score += 10
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  private calculateReadinessScore(candidate: User): number {
    let score = 50
    
    // Готовность к ротации
    if (candidate.profile.readinessForRotation) {
      score += 30
    }
    
    // Полнота профиля
    const completeness = candidate.profile.completeness.overall
    score += (completeness / 100) * 20
    
    // Последняя активность
    if (candidate.lastLoginAt) {
      const daysAgo = (Date.now() - candidate.lastLoginAt.getTime()) / (24 * 60 * 60 * 1000)
      if (daysAgo <= 7) {
        score += 10
      } else if (daysAgo <= 30) {
        score += 5
      }
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  private calculateCulturalScore(candidate: User, vacancy: Vacancy): number {
    let score = 70 // Базовый score (предполагаем хорошую культурную совместимость внутри компании)
    
    // Опыт работы в том же отделе
    if (candidate.department === vacancy.department) {
      score += 20
    }
    
    // Опыт внутренних проектов
    const internalExp = candidate.profile.experiences.filter(exp => exp.isInternal)
    if (internalExp.length > 0) {
      score += 10
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  private calculateGrowthScore(candidate: User, vacancy: Vacancy): number {
    let score = 50
    
    // Наличие карьерных целей
    if (candidate.profile.careerGoals.length > 0) {
      score += 20
    }
    
    // Активное обучение (на основе последних обновлений навыков)
    const recentSkillUpdates = candidate.profile.skills.filter(skill => {
      const monthsAgo = (Date.now() - skill.updatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
      return monthsAgo <= 6
    })
    
    if (recentSkillUpdates.length >= 3) {
      score += 20
    } else if (recentSkillUpdates.length >= 1) {
      score += 10
    }
    
    // Интерес к менторству или обучению
    if (candidate.profile.preferences.mentorshipInterest !== 'none') {
      score += 10
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  private generateMatchExplanation(
    candidate: User, 
    vacancy: Vacancy,
    scores: {
      skillsMatch: SkillMatch[]
      experienceScore: number
      readinessScore: number
      culturalScore: number
      growthScore: number
    }
  ): MatchExplanation {
    const strengths: string[] = []
    const gaps: string[] = []
    const developmentPath: string[] = []
    const riskFactors: string[] = []
    const recommendations: string[] = []
    
    // Анализируем навыки
    const matchedSkills = scores.skillsMatch.filter(sm => sm.userLevel && sm.gap <= 0)
    const missingSkills = scores.skillsMatch.filter(sm => !sm.userLevel)
    const underwhelming = scores.skillsMatch.filter(sm => sm.userLevel && sm.gap > 0)
    
    if (matchedSkills.length > 0) {
      strengths.push(`Владеет ${matchedSkills.length} требуемыми навыками`)
    }
    
    if (missingSkills.length > 0) {
      gaps.push(`Отсутствуют навыки: ${missingSkills.slice(0, 3).map(ms => {
        const skill = allMockSkills.find(s => s.id === ms.skillId)
        return skill?.name || ms.skillId
      }).join(', ')}`)
    }
    
    if (underwhelming.length > 0) {
      gaps.push(`Требует развития: ${underwhelming.slice(0, 3).map(us => {
        const skill = allMockSkills.find(s => s.id === us.skillId)
        return skill?.name || us.skillId
      }).join(', ')}`)
    }
    
    // Анализируем опыт
    if (scores.experienceScore >= 70) {
      strengths.push('Подходящий уровень опыта')
    } else if (scores.experienceScore < 50) {
      gaps.push('Недостаточный опыт для роли')
      riskFactors.push('Может потребовать дополнительное время на адаптацию')
    }
    
    // Анализируем готовность
    if (scores.readinessScore >= 70) {
      strengths.push('Высокая готовность к новым вызовам')
    } else {
      riskFactors.push('Низкая готовность к ротации')
    }
    
    // Генерируем план развития
    missingSkills.forEach(ms => {
      const skill = allMockSkills.find(s => s.id === ms.skillId)
      if (skill) {
        developmentPath.push(`Изучить ${skill.name}`)
      }
    })
    
    underwhelming.forEach(us => {
      const skill = allMockSkills.find(s => s.id === us.skillId)
      if (skill) {
        developmentPath.push(`Углубить знания ${skill.name}`)
      }
    })
    
    if (scores.experienceScore < 60) {
      developmentPath.push('Получить дополнительный опыт в релевантных проектах')
    }
    
    // Генерируем рекомендации
    recommendations.push('Провести техническое интервью')
    
    if (gaps.length > 0) {
      recommendations.push('Обсудить план закрытия скилл-гэпов')
    }
    
    if (candidate.profile.completeness.overall < 70) {
      recommendations.push('Попросить кандидата дополнить профиль')
    }
    
    recommendations.push('Назначить buddy для адаптации')
    
    // Оценка времени готовности
    let estimatedReadinessTime = 0
    if (missingSkills.length > 0) {
      estimatedReadinessTime += missingSkills.length * 2 // 2 месяца на навык
    }
    if (underwhelming.length > 0) {
      estimatedReadinessTime += underwhelming.length * 1 // 1 месяц на улучшение
    }
    if (scores.experienceScore < 50) {
      estimatedReadinessTime += 6 // 6 месяцев на набор опыта
    }
    
    return {
      overallScore: 75, // Базовая оценка
      score: 75,
      strengths,
      gaps,
      developmentPath,
      estimatedReadinessTime: Math.min(estimatedReadinessTime, 24), // Макс 2 года
      riskFactors,
      recommendations,
      timeToReady: `${Math.min(estimatedReadinessTime, 24)} месяцев`,
      confidence: 80
    }
  }
  
  private isSkillFresh(lastUsed: Date): boolean {
    const monthsAgo = (Date.now() - lastUsed.getTime()) / (30 * 24 * 60 * 60 * 1000)
    return monthsAgo <= 12
  }
  
  // === АНАЛИТИКА ===
  
  async getTeamAnalytics(department?: string) {
    const users = department 
      ? mockUsers.filter(u => u.department === department && u.isActive)
      : mockUsers.filter(u => u.isActive)
    
    const skillsDistribution: Record<string, { total: number; levels: Record<SkillLevel, number> }> = {}
    let totalCompleteness = 0
    let readyForRotation = 0
    
    users.forEach(user => {
      totalCompleteness += user.profile.completeness.overall
      
      if (user.profile.readinessForRotation) {
        readyForRotation++
      }
      
      user.profile.skills.forEach(userSkill => {
        const skill = allMockSkills.find(s => s.id === userSkill.skillId)
        if (skill) {
          if (!skillsDistribution[skill.name]) {
            skillsDistribution[skill.name] = {
              total: 0,
              levels: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
            }
          }
          
          skillsDistribution[skill.name].total++
          skillsDistribution[skill.name].levels[userSkill.level]++
        }
      })
    })
    
    // Топ навыки
    const topSkills = Object.entries(skillsDistribution)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([name, data]) => ({ name, ...data }))
    
    // Скилл гэпы
    const skillGaps = this.identifySkillGaps(users)
    
    return {
      totalEmployees: users.length,
      avgProfileCompleteness: Math.round(totalCompleteness / users.length),
      readyForRotationPct: Math.round((readyForRotation / users.length) * 100),
      topSkills,
      skillGaps,
      departmentDistribution: this.getDepartmentDistribution(users),
      experienceDistribution: this.getExperienceDistribution(users)
    }
  }
  
  private identifySkillGaps(users: User[]) {
    // Простая логика определения дефицитных навыков
    const skillCounts: Record<string, number> = {}
    const totalUsers = users.length
    
    allMockSkills.forEach(skill => {
      const usersWithSkill = users.filter(user =>
        user.profile.skills.some(us => us.skillId === skill.id)
      ).length
      
      const coverage = (usersWithSkill / totalUsers) * 100
      
      if (skill.isCore && coverage < 30) {
        skillCounts[skill.name] = coverage
      }
    })
    
    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 5)
      .map(([name, coverage]) => ({ skill: name, coverage: Math.round(coverage) }))
  }
  
  private getDepartmentDistribution(users: User[]) {
    const distribution: Record<string, number> = {}
    
    users.forEach(user => {
      distribution[user.department] = (distribution[user.department] || 0) + 1
    })
    
    return distribution
  }
  
  private getExperienceDistribution(users: User[]) {
    const distribution = { junior: 0, middle: 0, senior: 0 }
    
    users.forEach(user => {
      const experience = this.calculateTotalExperience(user)
      
      if (experience < 2) {
        distribution.junior++
      } else if (experience < 5) {
        distribution.middle++
      } else {
        distribution.senior++
      }
    })
    
    return distribution
  }
  
  // === ЭКСПОРТ ОТЧЕТОВ ===
  
  async generateVacancyReport(vacancyId: string) {
    const vacancy = mockVacancies.find(v => v.id === vacancyId)
    if (!vacancy) {
      throw new Error('Вакансия не найдена')
    }
    
    const matches = await this.matchCandidatesForVacancy(vacancyId, { maxResults: 100 })
    
    return {
      vacancy,
      totalCandidates: matches.length,
      readyCandidates: matches.filter(m => m.readinessLevel === 'ready').length,
      averageScore: Math.round(matches.reduce((sum, m) => sum + m.overallScore, 0) / matches.length),
      topCandidates: matches.slice(0, 5),
      skillGaps: this.analyzeVacancySkillGaps(vacancy, matches),
      generatedAt: new Date()
    }
  }
  
  private analyzeVacancySkillGaps(vacancy: Vacancy, matches: CandidateMatch[]) {
    const gaps: Record<string, { missing: number; insufficient: number }> = {}
    
    vacancy.requiredSkills.forEach(requiredSkill => {
      const skill = allMockSkills.find(s => s.id === requiredSkill.skillId)
      if (!skill) return
      
      let missing = 0
      let insufficient = 0
      
      matches.forEach(match => {
        const skillMatch = match.skillsMatch.find(sm => sm.skillId === requiredSkill.skillId)
        if (!skillMatch?.userLevel) {
          missing++
        } else if (skillMatch.gap > 0) {
          insufficient++
        }
      })
      
      gaps[skill.name] = { missing, insufficient }
    })
    
    return gaps
  }
}

// Синглтон сервиса
let hrSearchServiceInstance: HRSearchService | null = null

export function getHRSearchService(): HRSearchService {
  if (!hrSearchServiceInstance) {
    hrSearchServiceInstance = new HRSearchService()
  }
  return hrSearchServiceInstance
}
