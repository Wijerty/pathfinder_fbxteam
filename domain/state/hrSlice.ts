// HR Slice для управления вакансиями и матчингом кандидатов
import { StateCreator } from 'zustand'
import { 
  Vacancy, 
  VacancyStatus, 
  CandidateMatch, 
  User, 
  MatchExplanation,
  RequiredSkill,
  ReadinessLevel
} from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'

// Фильтры для поиска
export interface VacancyFilters {
  status: VacancyStatus[]
  departments: string[]
  locations: string[]
  workTypes: ('remote' | 'office' | 'hybrid')[]
  experienceRange: {
    min: number
    max: number
  }
  salaryRange: {
    min: number
    max: number
  }
  dateRange: {
    from?: Date
    to?: Date
  }
  searchText: string
}

export interface CandidateFilters {
  departments: string[]
  readinessLevels: ReadinessLevel[]
  completenessRange: {
    min: number
    max: number
  }
  experienceRange: {
    min: number
    max: number
  }
  skills: string[]
  excludeSkills: string[]
  searchText: string
}

// Состояние HR
export interface HrState {
  // Вакансии
  vacancies: Vacancy[]
  vacancyFilters: VacancyFilters
  filteredVacancies: Vacancy[]
  selectedVacancy: Vacancy | null
  
  // Кандидаты и матчинг
  candidateMatches: Map<string, CandidateMatch[]> // vacancyId -> matches
  candidateFilters: CandidateFilters
  allCandidates: User[]
  filteredCandidates: User[]
  selectedCandidate: User | null
  
  // Рекомендации и аналитика
  topMatches: CandidateMatch[]
  matchingInsights: {
    totalCandidates: number
    readyCandidates: number
    averageMatchScore: number
    topSkillGaps: Array<{
      skillId: string
      skillName: string
      gapCount: number
      candidates: string[]
    }>
  }
  
  // Состояние загрузки
  isLoadingVacancies: boolean
  isLoadingCandidates: boolean
  isCalculatingMatches: boolean
  error: string | null
  
  // Кэш для производительности
  lastMatchCalculation: Date | null
  matchCalculationInProgress: Set<string>
}

// Действия HR
export interface HrActions {
  // Управление вакансиями
  loadVacancies: () => Promise<void>
  createVacancy: (vacancy: Omit<Vacancy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateVacancy: (vacancyId: string, updates: Partial<Vacancy>) => Promise<void>
  deleteVacancy: (vacancyId: string) => Promise<void>
  closeVacancy: (vacancyId: string, reason: string) => Promise<void>
  
  // Фильтрация вакансий
  setVacancyFilters: (filters: Partial<VacancyFilters>) => void
  clearVacancyFilters: () => void
  applyVacancyFilters: () => void
  
  // Управление кандидатами
  loadCandidates: () => Promise<void>
  setCandidateFilters: (filters: Partial<CandidateFilters>) => void
  clearCandidateFilters: () => void
  applyCandidateFilters: () => void
  
  // Матчинг
  calculateMatches: (vacancyId: string, forceRecalculate?: boolean) => Promise<void>
  calculateAllMatches: () => Promise<void>
  getMatchExplanation: (userId: string, vacancyId: string) => Promise<MatchExplanation>
  
  // Рекомендации
  generateCandidateRecommendations: (vacancyId: string, limit?: number) => Promise<CandidateMatch[]>
  generateVacancyRecommendations: (userId: string, limit?: number) => Promise<Vacancy[]>
  
  // Аналитика
  generateMatchingInsights: () => void
  exportMatchingReport: (vacancyId?: string) => Promise<Blob>
  
  // Выбор
  selectVacancy: (vacancy: Vacancy | null) => void
  selectCandidate: (candidate: User | null) => void
  
  // Утилиты
  refreshData: () => Promise<void>
  clearError: () => void
}

// Полный тип слайса
export type HrSlice = HrState & HrActions

// Начальные фильтры
const initialVacancyFilters: VacancyFilters = {
  status: ['active'],
  departments: [],
  locations: [],
  workTypes: [],
  experienceRange: { min: 0, max: 20 },
  salaryRange: { min: 0, max: 1000000 },
  dateRange: {},
  searchText: ''
}

const initialCandidateFilters: CandidateFilters = {
  departments: [],
  readinessLevels: [],
  completenessRange: { min: 0, max: 100 },
  experienceRange: { min: 0, max: 20 },
  skills: [],
  excludeSkills: [],
  searchText: ''
}

// Начальное состояние
const initialState: HrState = {
  vacancies: [],
  vacancyFilters: initialVacancyFilters,
  filteredVacancies: [],
  selectedVacancy: null,
  
  candidateMatches: new Map(),
  candidateFilters: initialCandidateFilters,
  allCandidates: [],
  filteredCandidates: [],
  selectedCandidate: null,
  
  topMatches: [],
  matchingInsights: {
    totalCandidates: 0,
    readyCandidates: 0,
    averageMatchScore: 0,
    topSkillGaps: []
  },
  
  isLoadingVacancies: false,
  isLoadingCandidates: false,
  isCalculatingMatches: false,
  error: null,
  
  lastMatchCalculation: null,
  matchCalculationInProgress: new Set()
}

// Создание HR slice
export const createHrSlice: StateCreator<HrSlice> = (set, get) => ({
  ...initialState,

  // === УПРАВЛЕНИЕ ВАКАНСИЯМИ ===

  loadVacancies: async () => {
    try {
      set({ isLoadingVacancies: true, error: null })

      const response = await fetch('/api/hr/vacancies')
      if (!response.ok) throw new Error('Не удалось загрузить вакансии')
      
      const vacancies: Vacancy[] = await response.json()
      
      set({ 
        vacancies,
        isLoadingVacancies: false 
      })

      // Применяем фильтры
      get().applyVacancyFilters()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки вакансий'
      set({ 
        isLoadingVacancies: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  createVacancy: async (vacancyData: Omit<Vacancy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const vacancy: Vacancy = {
        ...vacancyData,
        id: `vacancy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const response = await fetch('/api/hr/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacancy)
      })

      if (!response.ok) throw new Error('Не удалось создать вакансию')

      const createdVacancy: Vacancy = await response.json()

      set({ 
        vacancies: [...get().vacancies, createdVacancy]
      })

      // Публикуем событие
      await publish(createEvent(
        'VACANCY_ADDED',
        {
          vacancyId: createdVacancy.id,
          vacancy: createdVacancy,
          createdBy: 'current-user', // TODO: получить из auth
          autoMatch: true
        },
        'current-user' // TODO: получить из auth
      ))

      // Применяем фильтры
      get().applyVacancyFilters()

      // Автоматически рассчитываем матчинг
      await get().calculateMatches(createdVacancy.id)

      return createdVacancy.id

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания вакансии'
      set({ error: errorMessage })
      throw error
    }
  },

  updateVacancy: async (vacancyId: string, updates: Partial<Vacancy>) => {
    try {
      const { vacancies } = get()
      const vacancyIndex = vacancies.findIndex(v => v.id === vacancyId)
      if (vacancyIndex === -1) throw new Error('Вакансия не найдена')

      const previousVacancy = vacancies[vacancyIndex]
      const updatedVacancy = {
        ...previousVacancy,
        ...updates,
        updatedAt: new Date()
      }

      const response = await fetch(`/api/hr/vacancies/${vacancyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVacancy)
      })

      if (!response.ok) throw new Error('Не удалось обновить вакансию')

      const updatedVacancies = [...vacancies]
      updatedVacancies[vacancyIndex] = updatedVacancy

      set({ vacancies: updatedVacancies })

      // TODO: Проверяем, требуется ли пересчет матчинга
      const requiresRematch = true // get().checkIfRematchRequired(previousVacancy, updates)

      // Публикуем событие
      await publish(createEvent(
        'VACANCY_EDITED',
        {
          vacancyId,
          changes: updates,
          editedBy: 'current-user', // TODO: получить из auth
          previousVersion: previousVacancy,
          requiresRematch
        },
        'current-user' // TODO: получить из auth
      ))

      // Применяем фильтры
      get().applyVacancyFilters()

      // Пересчитываем матчинг если нужно
      if (requiresRematch) {
        await get().calculateMatches(vacancyId, true)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления вакансии'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteVacancy: async (vacancyId: string) => {
    try {
      const response = await fetch(`/api/hr/vacancies/${vacancyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Не удалось удалить вакансию')

      set({ 
        vacancies: get().vacancies.filter(v => v.id !== vacancyId),
        candidateMatches: new Map(Array.from(get().candidateMatches).filter(([id]) => id !== vacancyId))
      })

      // Применяем фильтры
      get().applyVacancyFilters()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления вакансии'
      set({ error: errorMessage })
      throw error
    }
  },

  closeVacancy: async (vacancyId: string, reason: string) => {
    try {
      await get().updateVacancy(vacancyId, { 
        status: 'closed' 
      })

      // Публикуем событие закрытия
      await publish(createEvent(
        'VACANCY_CLOSED',
        {
          vacancyId,
          closedBy: 'current-user', // TODO: получить из auth
          reason,
          closedAt: new Date()
        },
        'current-user' // TODO: получить из auth
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка закрытия вакансии'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ФИЛЬТРАЦИЯ ВАКАНСИЙ ===

  setVacancyFilters: (filters: Partial<VacancyFilters>) => {
    set({ 
      vacancyFilters: { 
        ...get().vacancyFilters, 
        ...filters 
      }
    })
    get().applyVacancyFilters()
  },

  clearVacancyFilters: () => {
    set({ vacancyFilters: initialVacancyFilters })
    get().applyVacancyFilters()
  },

  applyVacancyFilters: () => {
    const { vacancies, vacancyFilters } = get()
    
    const filtered = vacancies.filter(vacancy => {
      // Фильтр по статусу
      if (vacancyFilters.status.length > 0 && !vacancyFilters.status.includes(vacancy.status)) {
        return false
      }

      // Фильтр по департаменту
      if (vacancyFilters.departments.length > 0 && !vacancyFilters.departments.includes(vacancy.department)) {
        return false
      }

      // Фильтр по локации
      if (vacancyFilters.locations.length > 0 && !vacancyFilters.locations.includes(vacancy.location)) {
        return false
      }

      // Фильтр по типу работы
      if (vacancyFilters.workTypes.length > 0 && !vacancyFilters.workTypes.includes(vacancy.workType)) {
        return false
      }

      // Фильтр по опыту
      const minExp = vacancy.experienceYears.min
      const maxExp = vacancy.experienceYears.max
      if (maxExp < vacancyFilters.experienceRange.min || minExp > vacancyFilters.experienceRange.max) {
        return false
      }

      // Фильтр по зарплате
      if (vacancy.salaryRange) {
        const minSalary = vacancy.salaryRange.min
        const maxSalary = vacancy.salaryRange.max
        if (maxSalary < vacancyFilters.salaryRange.min || minSalary > vacancyFilters.salaryRange.max) {
          return false
        }
      }

      // Фильтр по дате
      if (vacancyFilters.dateRange.from && vacancy.createdAt < vacancyFilters.dateRange.from) {
        return false
      }
      if (vacancyFilters.dateRange.to && vacancy.createdAt > vacancyFilters.dateRange.to) {
        return false
      }

      // Текстовый поиск
      if (vacancyFilters.searchText) {
        const searchText = vacancyFilters.searchText.toLowerCase()
        const searchFields = [
          vacancy.title,
          vacancy.description,
          vacancy.department,
          vacancy.location,
          ...vacancy.requirements
        ].join(' ').toLowerCase()
        
        if (!searchFields.includes(searchText)) {
          return false
        }
      }

      return true
    })

    set({ filteredVacancies: filtered })
  },

  // === УПРАВЛЕНИЕ КАНДИДАТАМИ ===

  loadCandidates: async () => {
    try {
      set({ isLoadingCandidates: true, error: null })

      const response = await fetch('/api/hr/candidates')
      if (!response.ok) throw new Error('Не удалось загрузить кандидатов')
      
      const candidates: User[] = await response.json()
      
      set({ 
        allCandidates: candidates,
        isLoadingCandidates: false 
      })

      // Применяем фильтры
      get().applyCandidateFilters()

      // Обновляем аналитику
      get().generateMatchingInsights()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки кандидатов'
      set({ 
        isLoadingCandidates: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  setCandidateFilters: (filters: Partial<CandidateFilters>) => {
    set({ 
      candidateFilters: { 
        ...get().candidateFilters, 
        ...filters 
      }
    })
    get().applyCandidateFilters()
  },

  clearCandidateFilters: () => {
    set({ candidateFilters: initialCandidateFilters })
    get().applyCandidateFilters()
  },

  applyCandidateFilters: () => {
    const { allCandidates, candidateFilters } = get()
    
    const filtered = allCandidates.filter(candidate => {
      // Фильтр по департаменту
      if (candidateFilters.departments.length > 0 && !candidateFilters.departments.includes(candidate.department)) {
        return false
      }

      // Фильтр по готовности
      // TODO: Получить ReadinessLevel из профиля

      // Фильтр по полноте профиля
      const completeness = candidate.profile.completeness.overall
      if (completeness < candidateFilters.completenessRange.min || completeness > candidateFilters.completenessRange.max) {
        return false
      }

      // TODO: Фильтр по опыту
      // const totalExperience = get().calculateUserExperience(candidate)
      // if (totalExperience < candidateFilters.experienceRange.min || totalExperience > candidateFilters.experienceRange.max) {
      //   return false
      // }

      // Фильтр по навыкам (должны включать)
      if (candidateFilters.skills.length > 0) {
        const userSkillIds = candidate.profile.skills.map(s => s.skillId)
        const hasRequiredSkills = candidateFilters.skills.every(skillId => userSkillIds.includes(skillId))
        if (!hasRequiredSkills) {
          return false
        }
      }

      // Фильтр по навыкам (исключить)
      if (candidateFilters.excludeSkills.length > 0) {
        const userSkillIds = candidate.profile.skills.map(s => s.skillId)
        const hasExcludedSkills = candidateFilters.excludeSkills.some(skillId => userSkillIds.includes(skillId))
        if (hasExcludedSkills) {
          return false
        }
      }

      // Текстовый поиск
      if (candidateFilters.searchText) {
        const searchText = candidateFilters.searchText.toLowerCase()
        const searchFields = [
          candidate.firstName,
          candidate.lastName,
          candidate.displayName,
          candidate.position,
          candidate.department,
          candidate.profile.bio || '',
          ...candidate.profile.skills.map(s => s.skillId),
          ...candidate.profile.careerGoals
        ].join(' ').toLowerCase()
        
        if (!searchFields.includes(searchText)) {
          return false
        }
      }

      return true
    })

    set({ filteredCandidates: filtered })
  },

  // === МАТЧИНГ ===

  calculateMatches: async (vacancyId: string, forceRecalculate: boolean = false) => {
    try {
      const { candidateMatches, matchCalculationInProgress } = get()
      
      // Проверяем, не идет ли уже расчет
      if (matchCalculationInProgress.has(vacancyId)) {
        return
      }

      // Проверяем кэш
      if (!forceRecalculate && candidateMatches.has(vacancyId)) {
        return
      }

      set({ 
        isCalculatingMatches: true,
        matchCalculationInProgress: new Set([...Array.from(matchCalculationInProgress), vacancyId])
      })

      const response = await fetch(`/api/hr/vacancies/${vacancyId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Не удалось рассчитать матчинг')

      const matches: CandidateMatch[] = await response.json()

      // Сортируем по score
      const sortedMatches = matches.sort((a, b) => b.overallScore - a.overallScore)

      // Обновляем кэш
      const newMatches = new Map(candidateMatches)
      newMatches.set(vacancyId, sortedMatches)

      set({ 
        candidateMatches: newMatches,
        isCalculatingMatches: false,
        lastMatchCalculation: new Date(),
        matchCalculationInProgress: new Set(Array.from(matchCalculationInProgress).filter(id => id !== vacancyId))
      })

      // Публикуем событие
      await publish(createEvent(
        'MATCH_RECALCULATED',
        {
          vacancyId,
          trigger: 'manual',
          newMatches: sortedMatches,
          changedMatches: []
        },
        'current-user' // TODO: получить из auth
      ))

      // TODO: Обновляем топ матчи
      // get().updateTopMatches()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка расчета матчинга'
      set({ 
        isCalculatingMatches: false,
        error: errorMessage,
        matchCalculationInProgress: new Set(Array.from(get().matchCalculationInProgress).filter(id => id !== vacancyId))
      })
      throw error
    }
  },

  calculateAllMatches: async () => {
    try {
      const { filteredVacancies } = get()
      
      for (const vacancy of filteredVacancies) {
        if (vacancy.status === 'active') {
          await get().calculateMatches(vacancy.id, true)
        }
      }

    } catch (error) {
      console.error('Ошибка массового расчета матчинга:', error)
    }
  },

  getMatchExplanation: async (userId: string, vacancyId: string): Promise<MatchExplanation> => {
    try {
      const response = await fetch(`/api/hr/match-explanation/${userId}/${vacancyId}`)
      if (!response.ok) throw new Error('Не удалось получить объяснение матчинга')
      
      return await response.json()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка получения объяснения'
      set({ error: errorMessage })
      throw error
    }
  },

  // === РЕКОМЕНДАЦИИ ===

  generateCandidateRecommendations: async (vacancyId: string, limit: number = 5): Promise<CandidateMatch[]> => {
    try {
      // Сначала рассчитываем матчинг если нужно
      await get().calculateMatches(vacancyId)

      const matches = get().candidateMatches.get(vacancyId) || []
      
      // Возвращаем топ кандидатов
      return matches
        .filter(match => match.overallScore >= 70) // Минимальный порог
        .slice(0, limit)

    } catch (error) {
      console.error('Ошибка генерации рекомендаций кандидатов:', error)
      return []
    }
  },

  generateVacancyRecommendations: async (userId: string, limit: number = 5): Promise<Vacancy[]> => {
    try {
      const response = await fetch(`/api/hr/vacancy-recommendations/${userId}?limit=${limit}`)
      if (!response.ok) throw new Error('Не удалось получить рекомендации вакансий')
      
      return await response.json()

    } catch (error) {
      console.error('Ошибка генерации рекомендаций вакансий:', error)
      return []
    }
  },

  // === АНАЛИТИКА ===

  generateMatchingInsights: () => {
    const { allCandidates, candidateMatches, filteredVacancies } = get()
    
    const totalCandidates = allCandidates.length
    const readyCandidates = allCandidates.filter(c => c.profile.readinessForRotation).length
    
    // Рассчитываем средний score по всем матчам
    let totalScore = 0
    let matchCount = 0
    
    candidateMatches.forEach(matches => {
      matches.forEach(match => {
        totalScore += match.overallScore
        matchCount++
      })
    })
    
    const averageMatchScore = matchCount > 0 ? totalScore / matchCount : 0
    
    // Анализируем пробелы в навыках
    const skillGaps = new Map<string, { count: number; candidates: Set<string> }>()
    
    candidateMatches.forEach((matches, vacancyId) => {
      matches.forEach(match => {
        match.skillsMatch.forEach(skillMatch => {
          if (skillMatch.gap > 0) { // Есть пробел
            const existing = skillGaps.get(skillMatch.skillId) || { count: 0, candidates: new Set() }
            existing.count++
            existing.candidates.add(match.userId)
            skillGaps.set(skillMatch.skillId, existing)
          }
        })
      })
    })
    
    const topSkillGaps = Array.from(skillGaps.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([skillId, data]) => ({
        skillId,
        skillName: skillId, // TODO: Получить название из таксономии
        gapCount: data.count,
        candidates: Array.from(data.candidates)
      }))

    set({
      matchingInsights: {
        totalCandidates,
        readyCandidates,
        averageMatchScore,
        topSkillGaps
      }
    })
  },

  exportMatchingReport: async (vacancyId?: string): Promise<Blob> => {
    try {
      const url = vacancyId 
        ? `/api/hr/reports/matching/${vacancyId}`
        : '/api/hr/reports/matching'
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Не удалось сгенерировать отчет')
      
      return await response.blob()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка экспорта отчета'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ВЫБОР ===

  selectVacancy: (vacancy: Vacancy | null) => {
    set({ selectedVacancy: vacancy })
  },

  selectCandidate: (candidate: User | null) => {
    set({ selectedCandidate: candidate })
  },

  // === УТИЛИТЫ ===

  refreshData: async () => {
    await Promise.all([
      get().loadVacancies(),
      get().loadCandidates()
    ])
  },

  clearError: () => {
    set({ error: null })
  },

  // Приватные методы
  getCurrentUserId: () => {
    return 'current-user-id' // Заглушка
  },

  checkIfRematchRequired: (previousVacancy: Vacancy, updates: Partial<Vacancy>): boolean => {
    // Проверяем изменения, требующие пересчета матчинга
    const criticalFields = [
      'requiredSkills',
      'preferredSkills', 
      'requirements',
      'experienceYears',
      'department'
    ]
    
    return criticalFields.some(field => 
      updates.hasOwnProperty(field) && 
      JSON.stringify(updates[field as keyof Vacancy]) !== JSON.stringify(previousVacancy[field as keyof Vacancy])
    )
  },

  calculateUserExperience: (user: User): number => {
    return user.profile.experiences.reduce((total, exp) => {
      const start = exp.startDate.getTime()
      const end = exp.endDate ? exp.endDate.getTime() : Date.now()
      const years = (end - start) / (365 * 24 * 60 * 60 * 1000)
      return total + years
    }, 0)
  },

  updateTopMatches: () => {
    const { candidateMatches } = get()
    
    const allMatches: CandidateMatch[] = []
    candidateMatches.forEach(matches => {
      allMatches.push(...matches)
    })
    
    const topMatches = allMatches
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10)
    
    set({ topMatches })
  }
})

// === СЕЛЕКТОРЫ ===

export const hrSelectors = {
  // Вакансии
  getVacancies: (state: HrSlice) => state.filteredVacancies,
  getAllVacancies: (state: HrSlice) => state.vacancies,
  getSelectedVacancy: (state: HrSlice) => state.selectedVacancy,
  getVacancyById: (id: string) => (state: HrSlice) => 
    state.vacancies.find(v => v.id === id),
  getActiveVacancies: (state: HrSlice) => 
    state.vacancies.filter(v => v.status === 'active'),
  
  // Кандидаты
  getCandidates: (state: HrSlice) => state.filteredCandidates,
  getAllCandidates: (state: HrSlice) => state.allCandidates,
  getSelectedCandidate: (state: HrSlice) => state.selectedCandidate,
  getCandidateById: (id: string) => (state: HrSlice) => 
    state.allCandidates.find(c => c.id === id),
  
  // Матчинг
  getMatchesForVacancy: (vacancyId: string) => (state: HrSlice) => 
    state.candidateMatches.get(vacancyId) || [],
  getTopMatches: (state: HrSlice) => state.topMatches,
  getMatchForCandidate: (userId: string, vacancyId: string) => (state: HrSlice) => {
    const matches = state.candidateMatches.get(vacancyId) || []
    return matches.find(m => m.userId === userId)
  },
  
  // Аналитика
  getMatchingInsights: (state: HrSlice) => state.matchingInsights,
  getAverageMatchScore: (state: HrSlice) => state.matchingInsights.averageMatchScore,
  getTopSkillGaps: (state: HrSlice) => state.matchingInsights.topSkillGaps,
  
  // Фильтры
  getVacancyFilters: (state: HrSlice) => state.vacancyFilters,
  getCandidateFilters: (state: HrSlice) => state.candidateFilters,
  
  // Состояние
  isLoadingVacancies: (state: HrSlice) => state.isLoadingVacancies,
  isLoadingCandidates: (state: HrSlice) => state.isLoadingCandidates,
  isCalculatingMatches: (state: HrSlice) => state.isCalculatingMatches,
  getError: (state: HrSlice) => state.error,
  
  // Производные данные
  getVacancyStats: (state: HrSlice) => {
    const vacancies = state.vacancies
    return {
      total: vacancies.length,
      active: vacancies.filter(v => v.status === 'active').length,
      draft: vacancies.filter(v => v.status === 'draft').length,
      closed: vacancies.filter(v => v.status === 'closed').length,
      onHold: vacancies.filter(v => v.status === 'on_hold').length
    }
  },
  
  getCandidateStats: (state: HrSlice) => {
    const candidates = state.allCandidates
    return {
      total: candidates.length,
      ready: candidates.filter(c => c.profile.readinessForRotation).length,
      highCompleteness: candidates.filter(c => c.profile.completeness.overall >= 80).length,
      departments: Array.from(new Set(candidates.map(c => c.department))).length
    }
  }
}
