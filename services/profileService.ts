// Сервис для работы с профилями пользователей
import { 
  User, 
  Profile, 
  UserSkill, 
  Experience, 
  Education, 
  Certification,
  ProfileCompleteness,
  ProfilePreferences
} from '@/types'
import { mockUsers, getUserById } from '@/mocks'
import { progressConfig } from '@/config/gamification'
import { getProfileCompletenessThreshold } from '@/config/thresholds'

export class ProfileService {
  
  // CRUD операции для профиля
  async getProfile(userId: string): Promise<Profile | null> {
    const user = getUserById(userId)
    return user?.profile || null
  }
  
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    // Обновляем профиль
    user.profile = {
      ...user.profile,
      ...updates,
      updatedAt: new Date()
    }
    
    // Пересчитываем полноту профиля
    user.profile.completeness = this.calculateCompleteness(user.profile)
    
    return user.profile
  }
  
  // Работа с навыками
  async addSkill(userId: string, skill: Omit<UserSkill, 'addedAt' | 'updatedAt'>): Promise<UserSkill> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const newSkill: UserSkill = {
      ...skill,
      addedAt: new Date(),
      updatedAt: new Date()
    }
    
    // Проверяем, не существует ли уже такой навык
    const existingSkillIndex = user.profile.skills.findIndex(s => s.skillId === skill.skillId)
    
    if (existingSkillIndex >= 0) {
      // Обновляем существующий навык
      user.profile.skills[existingSkillIndex] = {
        ...user.profile.skills[existingSkillIndex],
        ...skill,
        updatedAt: new Date()
      }
    } else {
      // Добавляем новый навык
      user.profile.skills.push(newSkill)
    }
    
    // Пересчитываем полноту профиля
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return newSkill
  }
  
  async updateSkill(userId: string, skillId: string, updates: Partial<UserSkill>): Promise<UserSkill> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const skillIndex = user.profile.skills.findIndex(s => s.skillId === skillId)
    if (skillIndex === -1) {
      throw new Error('Навык не найден')
    }
    
    user.profile.skills[skillIndex] = {
      ...user.profile.skills[skillIndex],
      ...updates,
      updatedAt: new Date()
    }
    
    // Пересчитываем полноту профиля
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return user.profile.skills[skillIndex]
  }
  
  async removeSkill(userId: string, skillId: string): Promise<void> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const skillIndex = user.profile.skills.findIndex(s => s.skillId === skillId)
    if (skillIndex === -1) {
      throw new Error('Навык не найден')
    }
    
    user.profile.skills.splice(skillIndex, 1)
    
    // Пересчитываем полноту профиля
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
  }
  
  // Работа с опытом
  async addExperience(userId: string, experience: Omit<Experience, 'id'>): Promise<Experience> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const newExperience: Experience = {
      ...experience,
      id: `exp-${userId}-${Date.now()}`
    }
    
    user.profile.experiences.push(newExperience)
    
    // Пересчитываем полноту профиля
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return newExperience
  }
  
  async updateExperience(userId: string, experienceId: string, updates: Partial<Experience>): Promise<Experience> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const expIndex = user.profile.experiences.findIndex(e => e.id === experienceId)
    if (expIndex === -1) {
      throw new Error('Опыт работы не найден')
    }
    
    user.profile.experiences[expIndex] = {
      ...user.profile.experiences[expIndex],
      ...updates
    }
    
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return user.profile.experiences[expIndex]
  }
  
  async removeExperience(userId: string, experienceId: string): Promise<void> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const expIndex = user.profile.experiences.findIndex(e => e.id === experienceId)
    if (expIndex === -1) {
      throw new Error('Опыт работы не найден')
    }
    
    user.profile.experiences.splice(expIndex, 1)
    
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
  }
  
  // Работа с образованием
  async addEducation(userId: string, education: Omit<Education, 'id'>): Promise<Education> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const newEducation: Education = {
      ...education,
      id: `edu-${userId}-${Date.now()}`
    }
    
    user.profile.education.push(newEducation)
    
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return newEducation
  }
  
  // Работа с предпочтениями
  async updatePreferences(userId: string, preferences: Partial<ProfilePreferences>): Promise<ProfilePreferences> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    user.profile.preferences = {
      ...user.profile.preferences,
      ...preferences
    }
    
    user.profile.completeness = this.calculateCompleteness(user.profile)
    user.profile.updatedAt = new Date()
    
    return user.profile.preferences
  }
  
  // Расчет полноты профиля
  calculateCompleteness(profile: Profile): ProfileCompleteness {
    const sections = {
      basicInfo: this.calculateBasicInfoCompleteness(profile),
      skills: this.calculateSkillsCompleteness(profile),
      experience: this.calculateExperienceCompleteness(profile),
      education: this.calculateEducationCompleteness(profile),
      goals: this.calculateGoalsCompleteness(profile),
      preferences: this.calculatePreferencesCompleteness(profile)
    }
    
    // Рассчитываем общий процент с весами
    const overall = Math.round(
      Object.entries(sections).reduce((sum, [key, value]) => {
        const weight = progressConfig.sectionWeights[key as keyof typeof progressConfig.sectionWeights]
        return sum + (value * weight)
      }, 0)
    )
    
    const missingFields = this.getMissingFields(profile, sections)
    const recommendations = this.getRecommendations(profile, sections)
    
    return {
      overall,
      sections,
      missingFields,
      recommendations,
      threshold: getProfileCompletenessThreshold(),
      lastCalculatedAt: new Date()
    }
  }
  
  private calculateBasicInfoCompleteness(profile: Profile): number {
    const requiredFields = progressConfig.minimumRequirements.basicInfo
    const user = mockUsers.find(u => u.id === profile.userId)
    
    if (!user) return 0
    
    let completedFields = 0
    
    // Проверяем базовые поля пользователя
    if (user.firstName) completedFields++
    if (user.lastName) completedFields++
    if (user.position) completedFields++
    if (user.department) completedFields++
    
    // Проверяем дополнительные поля профиля
    if (profile.bio && profile.bio.length > 20) completedFields++
    
    return Math.round((completedFields / (requiredFields.length + 1)) * 100)
  }
  
  private calculateSkillsCompleteness(profile: Profile): number {
    const minSkills = progressConfig.minimumRequirements.skills
    const skillCount = profile.skills.length
    
    if (skillCount === 0) return 0
    
    // Базовый score за количество навыков
    let score = Math.min(100, (skillCount / minSkills) * 60)
    
    // Бонусы за качество
    const skillsWithEndorsements = profile.skills.filter(s => s.endorsements > 0).length
    const skillsWithExperience = profile.skills.filter(s => s.yearsOfExperience > 0).length
    const recentSkills = profile.skills.filter(s => {
      if (!s.lastUsed) return false
      const monthsAgo = (Date.now() - s.lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30)
      return monthsAgo <= 12
    }).length
    
    score += (skillsWithEndorsements / skillCount) * 15 // До 15 баллов за endorsements
    score += (skillsWithExperience / skillCount) * 15   // До 15 баллов за опыт
    score += (recentSkills / skillCount) * 10           // До 10 баллов за актуальность
    
    return Math.round(Math.min(100, score))
  }
  
  private calculateExperienceCompleteness(profile: Profile): number {
    const minExperience = progressConfig.minimumRequirements.experience
    const expCount = profile.experiences.length
    
    if (expCount === 0) return 0
    
    let score = Math.min(100, (expCount / minExperience) * 70)
    
    // Бонусы за качество описания
    const detailedExp = profile.experiences.filter(e => 
      e.description && e.description.length > 50
    ).length
    
    const expWithAchievements = profile.experiences.filter(e => 
      e.achievements && e.achievements.length > 0
    ).length
    
    score += (detailedExp / expCount) * 20
    score += (expWithAchievements / expCount) * 10
    
    return Math.round(Math.min(100, score))
  }
  
  private calculateEducationCompleteness(profile: Profile): number {
    const minEducation = progressConfig.minimumRequirements.education
    const eduCount = profile.education.length + profile.certifications.length
    
    if (eduCount === 0) return 0
    
    return Math.round(Math.min(100, (eduCount / minEducation) * 100))
  }
  
  private calculateGoalsCompleteness(profile: Profile): number {
    const minGoals = progressConfig.minimumRequirements.goals
    const goalCount = profile.careerGoals.length
    
    if (goalCount === 0) return 0
    
    let score = Math.min(100, (goalCount / minGoals) * 80)
    
    // Бонус за детальность целей
    const detailedGoals = profile.careerGoals.filter(goal => goal.length > 20).length
    score += (detailedGoals / goalCount) * 20
    
    return Math.round(Math.min(100, score))
  }
  
  private calculatePreferencesCompleteness(profile: Profile): number {
    const prefs = profile.preferences
    let score = 0
    
    // Базовые предпочтения
    if (prefs.careerInterests.length > 0) score += 30
    if (prefs.workLocationPreference !== 'any') score += 20
    if (prefs.mentorshipInterest !== 'none') score += 20
    if (prefs.travelWillingness !== undefined) score += 15
    if (prefs.allowInternalRecruiting !== undefined) score += 15
    
    return Math.round(score)
  }
  
  private getMissingFields(profile: Profile, sections: Record<string, number>): string[] {
    const missing: string[] = []
    
    if (sections.basicInfo < 80) {
      missing.push('Добавьте подробное описание в раздел "О себе"')
    }
    
    if (sections.skills < 60) {
      missing.push('Добавьте больше навыков и укажите уровень владения')
    }
    
    if (sections.experience < 70) {
      missing.push('Подробнее опишите ваш опыт работы и достижения')
    }
    
    if (sections.education < 80) {
      missing.push('Добавьте информацию об образовании и сертификатах')
    }
    
    if (sections.goals < 60) {
      missing.push('Укажите ваши карьерные цели и планы развития')
    }
    
    if (sections.preferences < 70) {
      missing.push('Заполните предпочтения по работе и развитию')
    }
    
    return missing
  }
  
  private getRecommendations(profile: Profile, sections: Record<string, number>): string[] {
    const recommendations: string[] = []
    
    // Общие рекомендации
    if (sections.overall < 70) {
      recommendations.push('Заполните профиль на 70%+ для участия в подборе на вакансии')
    }
    
    // Специфичные рекомендации
    if (profile.skills.length > 0) {
      const skillsWithoutEndorsements = profile.skills.filter(s => s.endorsements === 0)
      if (skillsWithoutEndorsements.length > 0) {
        recommendations.push('Попросите коллег подтвердить ваши навыки')
      }
    }
    
    if (profile.experiences.length > 0) {
      const expWithoutAchievements = profile.experiences.filter(e => 
        !e.achievements || e.achievements.length === 0
      )
      if (expWithoutAchievements.length > 0) {
        recommendations.push('Добавьте конкретные достижения к опыту работы')
      }
    }
    
    if (profile.careerGoals.length === 0) {
      recommendations.push('Определите 2-3 ключевые цели карьерного развития')
    }
    
    if (!profile.preferences.allowInternalRecruiting) {
      recommendations.push('Разрешите внутренний рекрутинг для новых возможностей')
    }
    
    return recommendations
  }
  
  // Поиск пользователей с похожими профилями
  async findSimilarProfiles(userId: string, limit: number = 5): Promise<User[]> {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const userSkillIds = user.profile.skills.map(s => s.skillId)
    
    // Находим пользователей с пересекающимися навыками
    const similarUsers = mockUsers
      .filter(u => u.id !== userId && u.isActive)
      .map(u => {
        const commonSkills = u.profile.skills.filter(s => 
          userSkillIds.includes(s.skillId)
        ).length
        
        return {
          user: u,
          similarity: commonSkills / Math.max(userSkillIds.length, u.profile.skills.length)
        }
      })
      .filter(item => item.similarity > 0.2) // Минимум 20% совпадения
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.user)
    
    return similarUsers
  }
  
  // Получение статистики профиля
  async getProfileStats(userId: string) {
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    const profile = user.profile
    
    return {
      completeness: profile.completeness.overall,
      skillsCount: profile.skills.length,
      endorsementsCount: profile.skills.reduce((sum, s) => sum + s.endorsements, 0),
      experienceYears: this.calculateTotalExperience(profile),
      lastUpdated: profile.updatedAt,
      readinessForRotation: profile.readinessForRotation,
      profileViews: Math.floor(Math.random() * 100) + 20, // Mock данные
      recommendations: profile.completeness.recommendations.length
    }
  }
  
  private calculateTotalExperience(profile: Profile): number {
    return profile.experiences.reduce((total, exp) => {
      const start = exp.startDate.getTime()
      const end = exp.endDate ? exp.endDate.getTime() : Date.now()
      const years = (end - start) / (365 * 24 * 60 * 60 * 1000)
      return total + years
    }, 0)
  }
}

// Синглтон сервиса
let profileServiceInstance: ProfileService | null = null

export function getProfileService(): ProfileService {
  if (!profileServiceInstance) {
    profileServiceInstance = new ProfileService()
  }
  return profileServiceInstance
}
