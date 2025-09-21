// Taxonomy Slice для управления таксономией навыков и ролей
import { StateCreator } from 'zustand'
import { Skill, Role, CompetencyArea, SkillLevel } from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'
import { baseSkills } from '@/config/skills'

// Состояние таксономии
export interface TaxonomyState {
  // Навыки
  skills: Skill[]
  skillCategories: Record<string, string>
  competencyAreas: CompetencyArea[]
  
  // Роли
  roles: Role[]
  roleLevels: ('junior' | 'middle' | 'senior' | 'lead' | 'principal')[]
  
  // Настройки и пороги
  completenessThreshold: number
  skillLevelWeights: Record<SkillLevel, number>
  competencyWeights: Record<CompetencyArea, number>
  
  // Связи и рекомендации
  skillRelations: Map<string, string[]> // skillId -> related skillIds
  roleRecommendations: Map<string, string[]> // userId -> recommended roleIds
  
  // Состояние загрузки
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Действия таксономии
export interface TaxonomyActions {
  // Загрузка данных
  loadTaxonomy: () => Promise<void>
  
  // Управление навыками
  createSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateSkill: (skillId: string, updates: Partial<Skill>) => Promise<void>
  deleteSkill: (skillId: string) => Promise<void>
  addSkillRelation: (skillId: string, relatedSkillId: string) => Promise<void>
  removeSkillRelation: (skillId: string, relatedSkillId: string) => Promise<void>
  
  // Управление ролями
  createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<void>
  deleteRole: (roleId: string) => Promise<void>
  
  // Настройки порогов
  updateCompletenessThreshold: (threshold: number) => Promise<void>
  updateSkillLevelWeights: (weights: Record<SkillLevel, number>) => Promise<void>
  updateCompetencyWeights: (weights: Record<CompetencyArea, number>) => Promise<void>
  
  // Рекомендации ролей
  generateRoleRecommendations: (userId: string) => Promise<string[]>
  updateRoleRecommendations: (userId: string, recommendations: string[]) => void
  
  // Аналитика навыков
  getSkillUsageStats: () => Promise<Record<string, number>>
  getMostDemandedSkills: (limit?: number) => Skill[]
  getSkillGapAnalysis: () => Promise<Array<{
    skillId: string
    demandCount: number
    supplyCount: number
    gap: number
  }>>
  
  // Валидация
  validateRoleRequirements: (roleId: string) => Promise<boolean>
  validateSkillHierarchy: () => Promise<boolean>
  
  // Утилиты
  refreshTaxonomy: () => Promise<void>
  clearError: () => void
}

// Полный тип слайса
export type TaxonomySlice = TaxonomyState & TaxonomyActions

// Начальное состояние
const initialState: TaxonomyState = {
  skills: [],
  skillCategories: {},
  competencyAreas: ['technical', 'leadership', 'communication', 'analytical', 'creative', 'business'],
  
  roles: [],
  roleLevels: ['junior', 'middle', 'senior', 'lead', 'principal'],
  
  completenessThreshold: 70,
  skillLevelWeights: {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4
  },
  competencyWeights: {
    technical: 0.4,
    leadership: 0.25,
    analytical: 0.2,
    communication: 0.1,
    creative: 0.03,
    business: 0.02
  },
  
  skillRelations: new Map(),
  roleRecommendations: new Map(),
  
  isLoading: false,
  error: null,
  lastUpdated: null
}

// Создание taxonomy slice
export const createTaxonomySlice: StateCreator<TaxonomySlice> = (set, get) => ({
  ...initialState,

  // === ЗАГРУЗКА ДАННЫХ ===

  loadTaxonomy: async () => {
    try {
      set({ isLoading: true, error: null })

      // Загружаем навыки
      const skillsResponse = await fetch('/api/taxonomy/skills')
      if (!skillsResponse.ok) throw new Error('Не удалось загрузить навыки')
      
      const skills: Skill[] = await skillsResponse.json()

      // Загружаем роли
      const rolesResponse = await fetch('/api/taxonomy/roles')
      if (!rolesResponse.ok) throw new Error('Не удалось загрузить роли')
      
      const roles: Role[] = await rolesResponse.json()

      // Загружаем настройки
      const settingsResponse = await fetch('/api/taxonomy/settings')
      let settings = {}
      if (settingsResponse.ok) {
        settings = await settingsResponse.json()
      }

      // Строим карту связей навыков
      const skillRelations = new Map<string, string[]>()
      skills.forEach(skill => {
        skillRelations.set(skill.id, skill.relatedSkills)
      })

      // Строим карту категорий
      const skillCategories: Record<string, string> = {}
      skills.forEach(skill => {
        skillCategories[skill.category] = skill.category
      })

      set({
        skills,
        roles,
        skillCategories,
        skillRelations,
        completenessThreshold: settings.completenessThreshold || 70,
        skillLevelWeights: settings.skillLevelWeights || initialState.skillLevelWeights,
        competencyWeights: settings.competencyWeights || initialState.competencyWeights,
        isLoading: false,
        lastUpdated: new Date()
      })

    } catch (error) {
      // Fallback на базовые навыки если API не работает
      console.warn('Используем базовые навыки:', error)
      
      const skills = baseSkills.map(skill => ({
        ...skill,
        id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      const skillRelations = new Map<string, string[]>()
      skills.forEach(skill => {
        skillRelations.set(skill.id, skill.relatedSkills)
      })

      const skillCategories: Record<string, string> = {}
      skills.forEach(skill => {
        skillCategories[skill.category] = skill.category
      })

      set({
        skills,
        skillCategories,
        skillRelations,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки таксономии'
      })
    }
  },

  // === УПРАВЛЕНИЕ НАВЫКАМИ ===

  createSkill: async (skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const skill: Skill = {
        ...skillData,
        id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const response = await fetch('/api/taxonomy/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skill)
      })

      if (!response.ok) throw new Error('Не удалось создать навык')

      const createdSkill: Skill = await response.json()

      set({
        skills: [...get().skills, createdSkill],
        skillCategories: {
          ...get().skillCategories,
          [createdSkill.category]: createdSkill.category
        }
      })

      // Публикуем событие
      await publish(createEvent(
        'TAXONOMY_UPDATED',
        {
          adminId: get().getCurrentUserId(),
          entityType: 'skill',
          entityId: createdSkill.id,
          changes: { action: 'created', skill: createdSkill },
          impactedUsers: []
        },
        get().getCurrentUserId()
      ))

      return createdSkill.id

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  updateSkill: async (skillId: string, updates: Partial<Skill>) => {
    try {
      const { skills } = get()
      const skillIndex = skills.findIndex(s => s.id === skillId)
      if (skillIndex === -1) throw new Error('Навык не найден')

      const previousSkill = skills[skillIndex]
      const updatedSkill = {
        ...previousSkill,
        ...updates,
        updatedAt: new Date()
      }

      const response = await fetch(`/api/taxonomy/skills/${skillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSkill)
      })

      if (!response.ok) throw new Error('Не удалось обновить навык')

      const updatedSkills = [...skills]
      updatedSkills[skillIndex] = updatedSkill

      set({ skills: updatedSkills })

      // Обновляем связи если изменились
      if (updates.relatedSkills) {
        const newRelations = new Map(get().skillRelations)
        newRelations.set(skillId, updates.relatedSkills)
        set({ skillRelations: newRelations })
      }

      // Публикуем событие
      await publish(createEvent(
        'TAXONOMY_UPDATED',
        {
          adminId: get().getCurrentUserId(),
          entityType: 'skill',
          entityId: skillId,
          changes: { action: 'updated', previous: previousSkill, current: updatedSkill },
          impactedUsers: get().findUsersWithSkill(skillId)
        },
        get().getCurrentUserId()
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteSkill: async (skillId: string) => {
    try {
      const { skills } = get()
      const skill = skills.find(s => s.id === skillId)
      if (!skill) throw new Error('Навык не найден')

      const response = await fetch(`/api/taxonomy/skills/${skillId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Не удалось удалить навык')

      set({
        skills: skills.filter(s => s.id !== skillId)
      })

      // Удаляем из связей
      const newRelations = new Map(get().skillRelations)
      newRelations.delete(skillId)
      
      // Удаляем связи с этим навыком у других навыков
      newRelations.forEach((related, id) => {
        const filtered = related.filter(relatedId => relatedId !== skillId)
        if (filtered.length !== related.length) {
          newRelations.set(id, filtered)
        }
      })

      set({ skillRelations: newRelations })

      // Публикуем событие
      await publish(createEvent(
        'TAXONOMY_UPDATED',
        {
          adminId: get().getCurrentUserId(),
          entityType: 'skill',
          entityId: skillId,
          changes: { action: 'deleted', skill },
          impactedUsers: get().findUsersWithSkill(skillId)
        },
        get().getCurrentUserId()
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  addSkillRelation: async (skillId: string, relatedSkillId: string) => {
    try {
      const { skillRelations } = get()
      const currentRelations = skillRelations.get(skillId) || []
      
      if (currentRelations.includes(relatedSkillId)) {
        return // Связь уже существует
      }

      const newRelations = [...currentRelations, relatedSkillId]
      
      // Обновляем на сервере
      await get().updateSkill(skillId, { relatedSkills: newRelations })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления связи'
      set({ error: errorMessage })
      throw error
    }
  },

  removeSkillRelation: async (skillId: string, relatedSkillId: string) => {
    try {
      const { skillRelations } = get()
      const currentRelations = skillRelations.get(skillId) || []
      
      const newRelations = currentRelations.filter(id => id !== relatedSkillId)
      
      // Обновляем на сервере
      await get().updateSkill(skillId, { relatedSkills: newRelations })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления связи'
      set({ error: errorMessage })
      throw error
    }
  },

  // === УПРАВЛЕНИЕ РОЛЯМИ ===

  createRole: async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const role: Role = {
        ...roleData,
        id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const response = await fetch('/api/taxonomy/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role)
      })

      if (!response.ok) throw new Error('Не удалось создать роль')

      const createdRole: Role = await response.json()

      set({
        roles: [...get().roles, createdRole]
      })

      // Публикуем событие
      await publish(createEvent(
        'TAXONOMY_UPDATED',
        {
          adminId: get().getCurrentUserId(),
          entityType: 'role',
          entityId: createdRole.id,
          changes: { action: 'created', role: createdRole },
          impactedUsers: []
        },
        get().getCurrentUserId()
      ))

      return createdRole.id

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания роли'
      set({ error: errorMessage })
      throw error
    }
  },

  updateRole: async (roleId: string, updates: Partial<Role>) => {
    try {
      const { roles } = get()
      const roleIndex = roles.findIndex(r => r.id === roleId)
      if (roleIndex === -1) throw new Error('Роль не найдена')

      const previousRole = roles[roleIndex]
      const updatedRole = {
        ...previousRole,
        ...updates,
        updatedAt: new Date()
      }

      const response = await fetch(`/api/taxonomy/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRole)
      })

      if (!response.ok) throw new Error('Не удалось обновить роль')

      const updatedRoles = [...roles]
      updatedRoles[roleIndex] = updatedRole

      set({ roles: updatedRoles })

      // Публикуем событие
      await publish(createEvent(
        'ROLE_REQUIREMENTS_CHANGED',
        {
          adminId: get().getCurrentUserId(),
          roleId,
          previousRequirements: previousRole.requiredSkills,
          newRequirements: updatedRole.requiredSkills,
          affectedVacancies: get().findVacanciesWithRole(roleId)
        },
        get().getCurrentUserId()
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления роли'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteRole: async (roleId: string) => {
    try {
      const { roles } = get()
      const role = roles.find(r => r.id === roleId)
      if (!role) throw new Error('Роль не найдена')

      const response = await fetch(`/api/taxonomy/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Не удалось удалить роль')

      set({
        roles: roles.filter(r => r.id !== roleId)
      })

      // Публикуем событие
      await publish(createEvent(
        'TAXONOMY_UPDATED',
        {
          adminId: get().getCurrentUserId(),
          entityType: 'role',
          entityId: roleId,
          changes: { action: 'deleted', role },
          impactedUsers: []
        },
        get().getCurrentUserId()
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления роли'
      set({ error: errorMessage })
      throw error
    }
  },

  // === НАСТРОЙКИ ПОРОГОВ ===

  updateCompletenessThreshold: async (threshold: number) => {
    try {
      if (threshold < 0 || threshold > 100) {
        throw new Error('Порог должен быть от 0 до 100')
      }

      const previousThreshold = get().completenessThreshold

      const response = await fetch('/api/taxonomy/settings/completeness-threshold', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold })
      })

      if (!response.ok) throw new Error('Не удалось обновить порог')

      set({ completenessThreshold: threshold })

      // Публикуем событие
      await publish(createEvent(
        'THRESHOLD_CHANGED',
        {
          adminId: get().getCurrentUserId(),
          thresholdType: 'profile_completeness',
          previousValue: previousThreshold,
          newValue: threshold,
          affectedUsers: get().findAllActiveUsers()
        },
        get().getCurrentUserId()
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления порога'
      set({ error: errorMessage })
      throw error
    }
  },

  updateSkillLevelWeights: async (weights: Record<SkillLevel, number>) => {
    try {
      const response = await fetch('/api/taxonomy/settings/skill-weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights })
      })

      if (!response.ok) throw new Error('Не удалось обновить веса навыков')

      set({ skillLevelWeights: weights })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления весов навыков'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCompetencyWeights: async (weights: Record<CompetencyArea, number>) => {
    try {
      const response = await fetch('/api/taxonomy/settings/competency-weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights })
      })

      if (!response.ok) throw new Error('Не удалось обновить веса компетенций')

      set({ competencyWeights: weights })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления весов компетенций'
      set({ error: errorMessage })
      throw error
    }
  },

  // === РЕКОМЕНДАЦИИ РОЛЕЙ ===

  generateRoleRecommendations: async (userId: string) => {
    try {
      const response = await fetch(`/api/taxonomy/role-recommendations/${userId}`)
      if (!response.ok) throw new Error('Не удалось получить рекомендации ролей')

      const recommendations: string[] = await response.json()
      
      get().updateRoleRecommendations(userId, recommendations)
      
      return recommendations

    } catch (error) {
      console.error('Ошибка генерации рекомендаций ролей:', error)
      return []
    }
  },

  updateRoleRecommendations: (userId: string, recommendations: string[]) => {
    const newRecommendations = new Map(get().roleRecommendations)
    newRecommendations.set(userId, recommendations)
    set({ roleRecommendations: newRecommendations })
  },

  // === АНАЛИТИКА ===

  getSkillUsageStats: async () => {
    try {
      const response = await fetch('/api/taxonomy/analytics/skill-usage')
      if (!response.ok) throw new Error('Не удалось получить статистику навыков')

      return await response.json()

    } catch (error) {
      console.error('Ошибка получения статистики навыков:', error)
      return {}
    }
  },

  getMostDemandedSkills: (limit: number = 10) => {
    // Пока простая заглушка
    return get().skills
      .filter(skill => skill.isCore)
      .slice(0, limit)
  },

  getSkillGapAnalysis: async () => {
    try {
      const response = await fetch('/api/taxonomy/analytics/skill-gaps')
      if (!response.ok) throw new Error('Не удалось получить анализ пробелов')

      return await response.json()

    } catch (error) {
      console.error('Ошибка анализа пробелов навыков:', error)
      return []
    }
  },

  // === ВАЛИДАЦИЯ ===

  validateRoleRequirements: async (roleId: string) => {
    try {
      const { roles, skills } = get()
      const role = roles.find(r => r.id === roleId)
      if (!role) return false

      const skillIds = new Set(skills.map(s => s.id))
      
      // Проверяем, что все требуемые навыки существуют
      const validRequired = role.requiredSkills.every(req => skillIds.has(req.skillId))
      const validPreferred = role.preferredSkills.every(req => skillIds.has(req.skillId))

      return validRequired && validPreferred

    } catch (error) {
      console.error('Ошибка валидации роли:', error)
      return false
    }
  },

  validateSkillHierarchy: async () => {
    try {
      const { skills, skillRelations } = get()
      const skillIds = new Set(skills.map(s => s.id))

      // Проверяем, что все связанные навыки существуют
      for (const [skillId, related] of skillRelations) {
        if (!skillIds.has(skillId)) return false
        
        for (const relatedId of related) {
          if (!skillIds.has(relatedId)) return false
        }
      }

      return true

    } catch (error) {
      console.error('Ошибка валидации иерархии навыков:', error)
      return false
    }
  },

  // === УТИЛИТЫ ===

  refreshTaxonomy: async () => {
    await get().loadTaxonomy()
  },

  clearError: () => {
    set({ error: null })
  },

  // Приватные методы
  getCurrentUserId: () => {
    return 'current-user-id' // Заглушка
  },

  findUsersWithSkill: (skillId: string) => {
    // Здесь нужна связь с пользователями
    return []
  },

  findVacanciesWithRole: (roleId: string) => {
    // Здесь нужна связь с вакансиями
    return []
  },

  findAllActiveUsers: () => {
    // Здесь нужна связь с пользователями
    return []
  }
})

// === СЕЛЕКТОРЫ ===

export const taxonomySelectors = {
  // Навыки
  getSkills: (state: TaxonomySlice) => state.skills,
  getSkillById: (skillId: string) => (state: TaxonomySlice) => 
    state.skills.find(s => s.id === skillId),
  getSkillsByCategory: (category: string) => (state: TaxonomySlice) => 
    state.skills.filter(s => s.category === category),
  getSkillsByCompetency: (competency: CompetencyArea) => (state: TaxonomySlice) => 
    state.skills.filter(s => s.competencyArea === competency),
  getCoreSkills: (state: TaxonomySlice) => 
    state.skills.filter(s => s.isCore),
  getSkillCategories: (state: TaxonomySlice) => 
    Object.values(state.skillCategories),
  
  // Роли
  getRoles: (state: TaxonomySlice) => state.roles,
  getRoleById: (roleId: string) => (state: TaxonomySlice) => 
    state.roles.find(r => r.id === roleId),
  getRolesByDepartment: (department: string) => (state: TaxonomySlice) => 
    state.roles.filter(r => r.department === department),
  getRolesByLevel: (level: string) => (state: TaxonomySlice) => 
    state.roles.filter(r => r.level === level),
  getActiveRoles: (state: TaxonomySlice) => 
    state.roles.filter(r => r.isActive),
  
  // Связи
  getRelatedSkills: (skillId: string) => (state: TaxonomySlice) => {
    const relatedIds = state.skillRelations.get(skillId) || []
    return relatedIds.map(id => state.skills.find(s => s.id === id)).filter(Boolean)
  },
  
  // Рекомендации
  getRoleRecommendations: (userId: string) => (state: TaxonomySlice) => {
    const recommendedIds = state.roleRecommendations.get(userId) || []
    return recommendedIds.map(id => state.roles.find(r => r.id === id)).filter(Boolean)
  },
  
  // Настройки
  getCompletenessThreshold: (state: TaxonomySlice) => state.completenessThreshold,
  getSkillLevelWeights: (state: TaxonomySlice) => state.skillLevelWeights,
  getCompetencyWeights: (state: TaxonomySlice) => state.competencyWeights,
  getCompetencyAreas: (state: TaxonomySlice) => state.competencyAreas,
  getRoleLevels: (state: TaxonomySlice) => state.roleLevels,
  
  // Состояние
  isLoading: (state: TaxonomySlice) => state.isLoading,
  getError: (state: TaxonomySlice) => state.error,
  getLastUpdated: (state: TaxonomySlice) => state.lastUpdated,
  
  // Производные данные
  getSkillStats: (state: TaxonomySlice) => ({
    total: state.skills.length,
    core: state.skills.filter(s => s.isCore).length,
    categories: Object.keys(state.skillCategories).length,
    relations: state.skillRelations.size
  }),
  
  getRoleStats: (state: TaxonomySlice) => ({
    total: state.roles.length,
    active: state.roles.filter(r => r.isActive).length,
    departments: [...new Set(state.roles.map(r => r.department))].length,
    levels: [...new Set(state.roles.map(r => r.level))].length
  }),
  
  // Поиск
  searchSkills: (query: string) => (state: TaxonomySlice) => {
    const lowercaseQuery = query.toLowerCase()
    return state.skills.filter(skill => 
      skill.name.toLowerCase().includes(lowercaseQuery) ||
      skill.description.toLowerCase().includes(lowercaseQuery) ||
      skill.category.toLowerCase().includes(lowercaseQuery)
    )
  },
  
  searchRoles: (query: string) => (state: TaxonomySlice) => {
    const lowercaseQuery = query.toLowerCase()
    return state.roles.filter(role => 
      role.title.toLowerCase().includes(lowercaseQuery) ||
      role.description.toLowerCase().includes(lowercaseQuery) ||
      role.department.toLowerCase().includes(lowercaseQuery)
    )
  }
}
