// Profile Slice для управления профилем пользователя
import { StateCreator } from 'zustand'
import { 
  Profile, 
  UserSkill, 
  SkillLevel, 
  Experience, 
  Education, 
  Certification,
  ProfilePreferences,
  ProfileCompleteness,
  LearningResource
} from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'
import { progressConfig } from '@/config/gamification'

// Состояние профиля
export interface ProfileState {
  profile: Profile | null
  isLoading: boolean
  isSaving: boolean
  lastUpdated: Date | null
  error: string | null
  
  // Кэш для быстрого доступа
  skillsMap: Map<string, UserSkill>
  skillGaps: Array<{
    skillId: string
    skillName: string
    currentLevel?: SkillLevel
    targetLevel: SkillLevel
    priority: 'low' | 'medium' | 'high'
    courses: LearningResource[]
  }>
  
  // Статистика
  stats: {
    totalSkills: number
    endorsements: number
    completeness: number
    experienceYears: number
    readinessScore: number
  }
}

// Действия профиля
export interface ProfileActions {
  // Загрузка и сохранение
  loadProfile: (userId: string) => Promise<void>
  saveProfile: () => Promise<void>
  
  // Управление навыками
  addSkill: (skill: Omit<UserSkill, 'addedAt' | 'updatedAt'>) => Promise<void>
  updateSkill: (skillId: string, updates: Partial<UserSkill>) => Promise<void>
  removeSkill: (skillId: string) => Promise<void>
  endorseSkill: (skillId: string, endorserId: string, endorserName: string) => Promise<void>
  
  // Управление опытом
  addExperience: (experience: Omit<Experience, 'id'>) => Promise<void>
  updateExperience: (experienceId: string, updates: Partial<Experience>) => Promise<void>
  removeExperience: (experienceId: string) => Promise<void>
  
  // Управление образованием
  addEducation: (education: Omit<Education, 'id'>) => Promise<void>
  updateEducation: (educationId: string, updates: Partial<Education>) => Promise<void>
  removeEducation: (educationId: string) => Promise<void>
  
  // Управление сертификатами
  addCertification: (certification: Omit<Certification, 'id'>) => Promise<void>
  updateCertification: (certificationId: string, updates: Partial<Certification>) => Promise<void>
  removeCertification: (certificationId: string) => Promise<void>
  
  // Управление предпочтениями
  updatePreferences: (preferences: Partial<ProfilePreferences>) => Promise<void>
  
  // Управление целями
  addCareerGoal: (goal: string) => Promise<void>
  removeCareerGoal: (index: number) => Promise<void>
  updateCareerGoals: (goals: string[]) => Promise<void>
  
  // Управление био
  updateBio: (bio: string) => Promise<void>
  
  // Утилиты
  recalculateCompleteness: () => void
  refreshProfile: () => Promise<void>
  clearError: () => void
  analyzeSkillGaps: (targetRoleId?: string) => void
}

// Полный тип слайса
export type ProfileSlice = ProfileState & ProfileActions

// Начальное состояние
const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  isSaving: false,
  lastUpdated: null,
  error: null,
  skillsMap: new Map(),
  skillGaps: [],
  stats: {
    totalSkills: 0,
    endorsements: 0,
    completeness: 0,
    experienceYears: 0,
    readinessScore: 0
  }
}

// Создание profile slice
export const createProfileSlice: StateCreator<ProfileSlice> = (set, get) => ({
  ...initialState,

  // === ЗАГРУЗКА И СОХРАНЕНИЕ ===

  loadProfile: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Здесь будет запрос к API
      // Пока используем заглушку
      const response = await fetch(`/api/profile/${userId}`)
      if (!response.ok) throw new Error('Не удалось загрузить профиль')
      
      const profile: Profile = await response.json()
      
      // Обновляем состояние
      set({ 
        profile,
        isLoading: false,
        lastUpdated: new Date()
      })

      // TODO: Обновляем кэш и статистику
      // get().updateCache()
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки профиля'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  saveProfile: async () => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      set({ isSaving: true, error: null })

      // Запрос к API
      const response = await fetch(`/api/profile/${profile.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (!response.ok) throw new Error('Не удалось сохранить профиль')

      set({ 
        isSaving: false,
        lastUpdated: new Date()
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения профиля'
      set({ 
        isSaving: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // === УПРАВЛЕНИЕ НАВЫКАМИ ===

  addSkill: async (skillData: Omit<UserSkill, 'addedAt' | 'updatedAt'>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const newSkill: UserSkill = {
        ...skillData,
        addedAt: new Date(),
        updatedAt: new Date()
      }

      // Проверяем, не существует ли уже такой навык
      const existingSkillIndex = profile.skills.findIndex(s => s.skillId === skillData.skillId)
      
      if (existingSkillIndex >= 0) {
        throw new Error('Навык уже добавлен в профиль')
      }

      // Добавляем навык
      const updatedProfile = {
        ...profile,
        skills: [...profile.skills, newSkill],
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // Публикуем событие
      await publish(createEvent(
        'SKILL_ADDED',
        {
          userId: profile.userId,
          skill: newSkill,
          source: 'manual'
        },
        profile.userId
      ))

      // TODO: Обновляем кэш и статистику
      // get().updateCache()
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  updateSkill: async (skillId: string, updates: Partial<UserSkill>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const skillIndex = profile.skills.findIndex(s => s.skillId === skillId)
      if (skillIndex === -1) throw new Error('Навык не найден')

      const oldSkill = profile.skills[skillIndex]
      const updatedSkill = {
        ...oldSkill,
        ...updates,
        updatedAt: new Date()
      }

      const updatedSkills = [...profile.skills]
      updatedSkills[skillIndex] = updatedSkill

      const updatedProfile = {
        ...profile,
        skills: updatedSkills,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // Публикуем событие если изменился уровень
      if (updates.level && updates.level !== oldSkill.level) {
        await publish(createEvent(
          'SKILL_LEVEL_CHANGED',
          {
            userId: profile.userId,
            skillId,
            previousLevel: oldSkill.level,
            newLevel: updates.level,
            source: 'manual'
          },
          profile.userId
        ))
      }

      // TODO: Обновляем кэш и статистику
      // get().updateCache()
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  removeSkill: async (skillId: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const skillIndex = profile.skills.findIndex(s => s.skillId === skillId)
      if (skillIndex === -1) throw new Error('Навык не найден')

      const removedSkill = profile.skills[skillIndex]
      const updatedSkills = profile.skills.filter(s => s.skillId !== skillId)

      const updatedProfile = {
        ...profile,
        skills: updatedSkills,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // Публикуем событие
      await publish(createEvent(
        'SKILL_REMOVED',
        {
          userId: profile.userId,
          skillId,
          removedSkill
        },
        profile.userId
      ))

      // TODO: Обновляем кэш и статистику
      // get().updateCache()
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  endorseSkill: async (skillId: string, endorserId: string, endorserName: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const skillIndex = profile.skills.findIndex(s => s.skillId === skillId)
      if (skillIndex === -1) throw new Error('Навык не найден')

      const skill = profile.skills[skillIndex]
      
      // Проверяем, не подтверждал ли уже этот пользователь
      if (skill.verifiedBy?.includes(endorserId)) {
        throw new Error('Вы уже подтвердили этот навык')
      }

      const updatedSkill = {
        ...skill,
        endorsements: skill.endorsements + 1,
        verifiedBy: [...(skill.verifiedBy || []), endorserId],
        updatedAt: new Date()
      }

      const updatedSkills = [...profile.skills]
      updatedSkills[skillIndex] = updatedSkill

      const updatedProfile = {
        ...profile,
        skills: updatedSkills,
        updatedAt: new Date()
      }

      set({ profile: updatedProfile })

      // Публикуем событие
      await publish(createEvent(
        'SKILL_ENDORSED',
        {
          userId: profile.userId,
          skillId,
          endorserId,
          endorserName
        },
        profile.userId
      ))

      // TODO: Обновляем статистику
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка подтверждения навыка'
      set({ error: errorMessage })
      throw error
    }
  },

  // === УПРАВЛЕНИЕ ОПЫТОМ ===

  addExperience: async (experienceData: Omit<Experience, 'id'>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const newExperience: Experience = {
        ...experienceData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const updatedProfile = {
        ...profile,
        experiences: [...profile.experiences, newExperience],
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // TODO: Обновляем статистику
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления опыта'
      set({ error: errorMessage })
      throw error
    }
  },

  updateExperience: async (experienceId: string, updates: Partial<Experience>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const expIndex = profile.experiences.findIndex(e => e.id === experienceId)
      if (expIndex === -1) throw new Error('Опыт работы не найден')

      const updatedExperiences = [...profile.experiences]
      updatedExperiences[expIndex] = {
        ...updatedExperiences[expIndex],
        ...updates
      }

      const updatedProfile = {
        ...profile,
        experiences: updatedExperiences,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // TODO: Обновляем статистику
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления опыта'
      set({ error: errorMessage })
      throw error
    }
  },

  removeExperience: async (experienceId: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        experiences: profile.experiences.filter(e => e.id !== experienceId),
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

      // TODO: Обновляем статистику
      // get().updateStats()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления опыта'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ОБРАЗОВАНИЕ ===

  addEducation: async (educationData: Omit<Education, 'id'>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const newEducation: Education = {
        ...educationData,
        id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const updatedProfile = {
        ...profile,
        education: [...profile.education, newEducation],
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления образования'
      set({ error: errorMessage })
      throw error
    }
  },

  updateEducation: async (educationId: string, updates: Partial<Education>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const eduIndex = profile.education.findIndex(e => e.id === educationId)
      if (eduIndex === -1) throw new Error('Образование не найдено')

      const updatedEducation = [...profile.education]
      updatedEducation[eduIndex] = {
        ...updatedEducation[eduIndex],
        ...updates
      }

      const updatedProfile = {
        ...profile,
        education: updatedEducation,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления образования'
      set({ error: errorMessage })
      throw error
    }
  },

  removeEducation: async (educationId: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        education: profile.education.filter(e => e.id !== educationId),
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления образования'
      set({ error: errorMessage })
      throw error
    }
  },

  // === СЕРТИФИКАТЫ ===

  addCertification: async (certificationData: Omit<Certification, 'id'>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const newCertification: Certification = {
        ...certificationData,
        id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const updatedProfile = {
        ...profile,
        certifications: [...profile.certifications, newCertification],
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления сертификата'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCertification: async (certificationId: string, updates: Partial<Certification>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const certIndex = profile.certifications.findIndex(c => c.id === certificationId)
      if (certIndex === -1) throw new Error('Сертификат не найден')

      const updatedCertifications = [...profile.certifications]
      updatedCertifications[certIndex] = {
        ...updatedCertifications[certIndex],
        ...updates
      }

      const updatedProfile = {
        ...profile,
        certifications: updatedCertifications,
        updatedAt: new Date()
      }

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления сертификата'
      set({ error: errorMessage })
      throw error
    }
  },

  removeCertification: async (certificationId: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        certifications: profile.certifications.filter(c => c.id !== certificationId),
        updatedAt: new Date()
      }

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления сертификата'
      set({ error: errorMessage })
      throw error
    }
  },

  // === ПРЕДПОЧТЕНИЯ ===

  updatePreferences: async (preferences: Partial<ProfilePreferences>) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        preferences: {
          ...profile.preferences,
          ...preferences
        },
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления предпочтений'
      set({ error: errorMessage })
      throw error
    }
  },

  // === КАРЬЕРНЫЕ ЦЕЛИ ===

  addCareerGoal: async (goal: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      if (profile.careerGoals.includes(goal)) {
        throw new Error('Такая цель уже есть в списке')
      }

      const updatedProfile = {
        ...profile,
        careerGoals: [...profile.careerGoals, goal],
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления цели'
      set({ error: errorMessage })
      throw error
    }
  },

  removeCareerGoal: async (index: number) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      if (index < 0 || index >= profile.careerGoals.length) {
        throw new Error('Неверный индекс цели')
      }

      const updatedGoals = [...profile.careerGoals]
      updatedGoals.splice(index, 1)

      const updatedProfile = {
        ...profile,
        careerGoals: updatedGoals,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления цели'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCareerGoals: async (goals: string[]) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        careerGoals: goals,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления целей'
      set({ error: errorMessage })
      throw error
    }
  },

  // === БИО ===

  updateBio: async (bio: string) => {
    try {
      const { profile } = get()
      if (!profile) throw new Error('Профиль не загружен')

      const updatedProfile = {
        ...profile,
        bio,
        updatedAt: new Date()
      }

      // Пересчитываем полноту профиля
      updatedProfile.completeness = calculateCompleteness(updatedProfile)

      set({ profile: updatedProfile })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления описания'
      set({ error: errorMessage })
      throw error
    }
  },

  // === УТИЛИТЫ ===

  recalculateCompleteness: () => {
    const { profile } = get()
    if (!profile) return

    const updatedProfile = {
      ...profile,
      completeness: calculateCompleteness(profile)
    }

    set({ profile: updatedProfile })
    // get().updateStats()
  },

  refreshProfile: async () => {
    const { profile } = get()
    if (!profile) return

    await get().loadProfile(profile.userId)
  },

  clearError: () => {
    set({ error: null })
  },

  analyzeSkillGaps: (targetRoleId?: string) => {
    const { profile } = get()
    if (!profile) return

    // Здесь будет логика анализа пробелов в навыках
    // Пока заглушка
    const skillGaps: any[] = []
    set({ skillGaps })
  },

  // Приватные методы (через замыкание)
  updateCache: () => {
    const { profile } = get()
    if (!profile) return

    const skillsMap = new Map()
    profile.skills.forEach(skill => {
      skillsMap.set(skill.skillId, skill)
    })

    set({ skillsMap })
  },

  updateStats: () => {
    const { profile } = get()
    if (!profile) return

    const stats = {
      totalSkills: profile.skills.length,
      endorsements: profile.skills.reduce((sum, skill) => sum + skill.endorsements, 0),
      completeness: profile.completeness.overall,
      experienceYears: calculateTotalExperience(profile),
      readinessScore: profile.readinessForRotation ? 100 : profile.completeness.overall
    }

    set({ stats })
  }
})

// === СЕЛЕКТОРЫ ===

export const profileSelectors = {
  // Основные селекторы
  getProfile: (state: ProfileSlice) => state.profile,
  isLoading: (state: ProfileSlice) => state.isLoading,
  isSaving: (state: ProfileSlice) => state.isSaving,
  getError: (state: ProfileSlice) => state.error,
  getStats: (state: ProfileSlice) => state.stats,
  
  // Навыки
  getSkills: (state: ProfileSlice) => state.profile?.skills || [],
  getSkillsMap: (state: ProfileSlice) => state.skillsMap,
  getSkill: (skillId: string) => (state: ProfileSlice) => state.skillsMap.get(skillId),
  getSkillsByCategory: (category: string) => (state: ProfileSlice) => 
    state.profile?.skills.filter(skill => 
      // Здесь нужна связь с таксономией навыков
      true
    ) || [],
  
  // Полнота профиля
  getCompleteness: (state: ProfileSlice) => state.profile?.completeness,
  getCompletenessOverall: (state: ProfileSlice) => state.profile?.completeness.overall || 0,
  isProfileComplete: (state: ProfileSlice) => {
    const completeness = state.profile?.completeness
    return completeness ? completeness.overall >= completeness.threshold : false
  },
  
  // Готовность
  isReadyForRotation: (state: ProfileSlice) => state.profile?.readinessForRotation || false,
  
  // Пробелы в навыках
  getSkillGaps: (state: ProfileSlice) => state.skillGaps,
  hasSkillGaps: (state: ProfileSlice) => state.skillGaps.length > 0,
  
  // Опыт и образование
  getExperiences: (state: ProfileSlice) => state.profile?.experiences || [],
  getEducation: (state: ProfileSlice) => state.profile?.education || [],
  getCertifications: (state: ProfileSlice) => state.profile?.certifications || [],
  
  // Предпочтения
  getPreferences: (state: ProfileSlice) => state.profile?.preferences,
  getCareerGoals: (state: ProfileSlice) => state.profile?.careerGoals || [],
  
  // Производные данные
  getTopSkills: (limit: number = 5) => (state: ProfileSlice) => {
    const skills = state.profile?.skills || []
    return skills
      .sort((a, b) => b.endorsements - a.endorsements)
      .slice(0, limit)
  },
  
  getRecentSkills: (days: number = 30) => (state: ProfileSlice) => {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const skills = state.profile?.skills || []
    return skills.filter(skill => skill.addedAt >= cutoff)
  }
}

// === УТИЛИТЫ ===

function calculateCompleteness(profile: Profile): ProfileCompleteness {
  // Это упрощенная версия расчета
  // В реальности используется логика из ProfileService
  const sections = {
    basicInfo: profile.bio ? 80 : 20,
    skills: Math.min(100, (profile.skills.length / 3) * 100),
    experience: Math.min(100, (profile.experiences.length / 1) * 100),
    education: Math.min(100, ((profile.education.length + profile.certifications.length) / 1) * 100),
    goals: Math.min(100, (profile.careerGoals.length / 2) * 100),
    preferences: profile.preferences.careerInterests.length > 0 ? 80 : 20
  }

  const overall = Math.round(
    Object.entries(sections).reduce((sum, [key, value]) => {
      const weight = progressConfig.sectionWeights[key as keyof typeof progressConfig.sectionWeights]
      return sum + (value * weight)
    }, 0)
  )

  return {
    overall,
    sections,
    missingFields: [],
    recommendations: [],
    threshold: 70,
    lastCalculatedAt: new Date()
  }
}

function calculateTotalExperience(profile: Profile): number {
  return profile.experiences.reduce((total, exp) => {
    const start = exp.startDate.getTime()
    const end = exp.endDate ? exp.endDate.getTime() : Date.now()
    const years = (end - start) / (365 * 24 * 60 * 60 * 1000)
    return total + years
  }, 0)
}
