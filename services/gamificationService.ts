// Сервис геймификации для PathFinder
import { 
  User, 
  UserBadge, 
  UserQuest, 
  Quest, 
  Badge, 
  QuestProgress,
  QuestStatus
} from '@/types'
import { mockUsers, getUserById } from '@/mocks'
import { baseBadges, baseQuests, xpConfig, profileLevels } from '@/config/gamification'
import { thresholds } from '@/config/thresholds'

// Расширяем интерфейс пользователя для геймификации
interface GamifiedUser extends User {
  xp: number
  level: number
  badges: UserBadge[]
  quests: UserQuest[]
  streakDays: number
  lastActivity: Date
}

export class GamificationService {
  private badges: Badge[] = []
  private quests: Quest[] = []
  private userXP: Map<string, number> = new Map()
  private userBadges: Map<string, UserBadge[]> = new Map()
  private userQuests: Map<string, UserQuest[]> = new Map()
  
  constructor() {
    this.initializeData()
  }
  
  private initializeData() {
    // Инициализируем базовые бейджи с ID
    this.badges = baseBadges.map((badge, index) => ({
      ...badge,
      id: `badge-${index + 1}`,
      createdAt: new Date(2024, 0, 1 + index)
    }))
    
    // Инициализируем базовые квесты с ID
    this.quests = baseQuests.map((quest, index) => ({
      ...quest,
      id: `quest-${index + 1}`,
      createdAt: new Date(2024, 8, 1 + index),
      updatedAt: new Date(2024, 8, 15 + index)
    }))
    
    // Инициализируем данные пользователей
    this.initializeUserGameData()
  }
  
  private initializeUserGameData() {
    mockUsers.forEach(user => {
      // Базовый XP на основе полноты профиля и активности
      const baseXP = user.profile.completeness.overall * 10 + Math.floor(Math.random() * 500)
      this.userXP.set(user.id, baseXP)
      
      // Случайные бейджи для демо
      const earnedBadges: UserBadge[] = []
      this.badges.forEach(badge => {
        if (Math.random() > 0.7) { // 30% шанс иметь бейдж
          earnedBadges.push({
            userId: user.id,
            badgeId: badge.id,
            earnedAt: new Date(2024, Math.floor(Math.random() * 9), Math.floor(Math.random() * 28) + 1),
            level: Math.floor(Math.random() * 3) + 1
          })
        }
      })
      this.userBadges.set(user.id, earnedBadges)
      
      // Активные квесты для демо
      const activeQuests: UserQuest[] = []
      this.quests.slice(0, 3).forEach(quest => {
        if (Math.random() > 0.6) { // 40% шанс иметь активный квест
          const progress: QuestProgress[] = quest.requirements.map(req => ({
            requirementId: req.type,
            currentValue: Math.floor(Math.random() * req.requiredValue),
            requiredValue: req.requiredValue,
            isCompleted: Math.random() > 0.7,
            updatedAt: new Date()
          }))
          
          activeQuests.push({
            userId: user.id,
            questId: quest.id,
            status: Math.random() > 0.8 ? 'completed' : 'active',
            progress,
            startedAt: new Date(2024, 8, Math.floor(Math.random() * 20) + 1),
            completedAt: Math.random() > 0.8 ? new Date() : undefined
          })
        }
      })
      this.userQuests.set(user.id, activeQuests)
    })
  }
  
  // XP система
  async awardXP(userId: string, amount: number, reason: string): Promise<number> {
    if (amount <= 0) return 0
    
    const user = getUserById(userId)
    if (!user) {
      throw new Error('Пользователь не найден')
    }
    
    // Проверяем дневные лимиты
    const dailyXP = await this.getDailyXP(userId)
    const maxDaily = thresholds.gamification.maxDailyXP.total
    
    if (dailyXP >= maxDaily) {
      console.warn(`Пользователь ${userId} достиг дневного лимита XP`)
      return 0
    }
    
    // Применяем множители
    const multipliedAmount = this.applyXPMultipliers(userId, amount, reason)
    const actualAmount = Math.min(multipliedAmount, maxDaily - dailyXP)
    
    // Начисляем XP
    const currentXP = this.userXP.get(userId) || 0
    const newXP = currentXP + actualAmount
    this.userXP.set(userId, newXP)
    
    // Проверяем повышение уровня
    const oldLevel = this.getUserLevel(currentXP)
    const newLevel = this.getUserLevel(newXP)
    
    if (newLevel > oldLevel) {
      await this.handleLevelUp(userId, newLevel)
    }
    
    // Логируем активность
    console.log(`${user.displayName} получил ${actualAmount} XP за ${reason}`)
    
    return actualAmount
  }
  
  private applyXPMultipliers(userId: string, baseAmount: number, reason: string): number {
    let multiplier = 1
    
    // Множитель за выходные
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
    if (isWeekend) {
      multiplier *= xpConfig.multipliers.weekendActivity
    }
    
    // Множитель за streak
    const streakDays = this.getUserStreak(userId)
    if (streakDays >= 30) {
      multiplier *= xpConfig.multipliers.consecutiveDays
    }
    
    // Множитель за критичные навыки
    if (reason.includes('critical') || reason.includes('ключевой')) {
      multiplier *= xpConfig.multipliers.criticalSkill
    }
    
    return Math.round(baseAmount * multiplier)
  }
  
  private getUserLevel(xp: number): number {
    for (let i = profileLevels.length - 1; i >= 0; i--) {
      if (xp >= profileLevels[i].xpRequired) {
        return profileLevels[i].level
      }
    }
    return 1
  }
  
  private getUserStreak(userId: string): number {
    // В реальной системе здесь был бы расчет на основе истории активности
    return Math.floor(Math.random() * 15) + 1
  }
  
  private async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    const user = getUserById(userId)
    if (!user) return
    
    console.log(`${user.displayName} достиг уровня ${newLevel}!`)
    
    // Награждаем специальным бейджем за уровень
    const levelBadge = this.badges.find(b => b.name.includes('Уровень') || b.type === 'milestone')
    if (levelBadge) {
      await this.awardBadge(userId, levelBadge.id)
    }
    
    // Можно добавить уведомления, открытие новых функций и т.д.
  }
  
  // Система бейджей
  async awardBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    const user = getUserById(userId)
    const badge = this.badges.find(b => b.id === badgeId)
    
    if (!user || !badge) {
      return null
    }
    
    // Проверяем, не получен ли уже этот бейдж
    const userBadges = this.userBadges.get(userId) || []
    const existingBadge = userBadges.find(ub => ub.badgeId === badgeId)
    
    if (existingBadge) {
      // Для бейджей с уровнями - повышаем уровень
      if (badge.rarity === 'epic' || badge.rarity === 'legendary') {
        existingBadge.level = (existingBadge.level || 1) + 1
        return existingBadge
      }
      return null
    }
    
    // Создаем новый бейдж
    const newUserBadge: UserBadge = {
      userId,
      badgeId,
      earnedAt: new Date(),
      level: 1
    }
    
    userBadges.push(newUserBadge)
    this.userBadges.set(userId, userBadges)
    
    // Начисляем XP за получение бейджа
    await this.awardXP(userId, badge.xpReward, `получение бейджа "${badge.name}"`)
    
    console.log(`${user.displayName} получил бейдж "${badge.name}"!`)
    
    return newUserBadge
  }
  
  async checkBadgeCriteria(userId: string): Promise<Badge[]> {
    const user = getUserById(userId)
    if (!user) return []
    
    const earnedBadges: Badge[] = []
    const userBadges = this.userBadges.get(userId) || []
    const earnedBadgeIds = userBadges.map(ub => ub.badgeId)
    
    for (const badge of this.badges) {
      if (earnedBadgeIds.includes(badge.id)) continue
      
      if (await this.evaluateBadgeCriteria(userId, badge)) {
        const awarded = await this.awardBadge(userId, badge.id)
        if (awarded) {
          earnedBadges.push(badge)
        }
      }
    }
    
    return earnedBadges
  }
  
  private async evaluateBadgeCriteria(userId: string, badge: Badge): Promise<boolean> {
    const user = getUserById(userId)
    if (!user) return false
    
    const { type, conditions } = badge.criteria
    
    switch (type) {
      case 'skill_level':
        return this.checkSkillCriteria(user, conditions)
      
      case 'profile_completion':
        return this.checkProfileCompletionCriteria(user, conditions)
      
      case 'endorsement_count':
        return this.checkEndorsementCriteria(user, conditions)
      
      case 'quest_completion':
        return this.checkQuestCompletionCriteria(userId, conditions)
      
      case 'custom':
        return this.checkCustomCriteria(userId, conditions)
      
      default:
        return false
    }
  }
  
  private checkSkillCriteria(user: User, conditions: any): boolean {
    if (conditions.skillId) {
      // Проверка конкретного навыка
      const skill = user.profile.skills.find(s => s.skillId === conditions.skillId)
      if (!skill) return false
      
      const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert']
      const requiredLevel = levelOrder.indexOf(conditions.minLevel)
      const userLevel = levelOrder.indexOf(skill.level)
      
      return userLevel >= requiredLevel
    }
    
    if (conditions.skillCount && conditions.category) {
      // Проверка количества навыков в категории
      // Здесь нужно было бы загружать данные навыков для проверки категорий
      return user.profile.skills.length >= conditions.skillCount
    }
    
    return false
  }
  
  private checkProfileCompletionCriteria(user: User, conditions: any): boolean {
    if (conditions.overall) {
      return user.profile.completeness.overall >= conditions.overall
    }
    
    if (conditions.section && conditions.minCount) {
      const section = conditions.section
      switch (section) {
        case 'skills':
          return user.profile.skills.length >= conditions.minCount
        case 'experience':
          return user.profile.experiences.length >= conditions.minCount
        case 'education':
          return user.profile.education.length >= conditions.minCount
        default:
          return false
      }
    }
    
    return false
  }
  
  private checkEndorsementCriteria(user: User, conditions: any): boolean {
    const totalEndorsements = user.profile.skills.reduce((sum, skill) => sum + skill.endorsements, 0)
    return totalEndorsements >= conditions.minCount
  }
  
  private checkQuestCompletionCriteria(userId: string, conditions: any): boolean {
    const userQuests = this.userQuests.get(userId) || []
    const completedQuests = userQuests.filter(q => q.status === 'completed')
    return completedQuests.length >= conditions.minCount
  }
  
  private checkCustomCriteria(userId: string, conditions: any): boolean {
    // Кастомные критерии для специальных бейджей
    if (conditions.userIndex) {
      // Бейдж для первых пользователей
      const userIndex = mockUsers.findIndex(u => u.id === userId)
      return userIndex < conditions.userIndex
    }
    
    if (conditions.mentorshipHours) {
      // Бейдж за менторство (mock данные)
      return Math.random() > 0.8 // 20% шанс для демо
    }
    
    return false
  }
  
  // Система квестов
  async startQuest(userId: string, questId: string): Promise<UserQuest> {
    const user = getUserById(userId)
    const quest = this.quests.find(q => q.id === questId)
    
    if (!user) throw new Error('Пользователь не найден')
    if (!quest) throw new Error('Квест не найден')
    if (!quest.isActive) throw new Error('Квест неактивен')
    
    const userQuests = this.userQuests.get(userId) || []
    
    // Проверяем, не активен ли уже этот квест
    const existingQuest = userQuests.find(uq => uq.questId === questId)
    if (existingQuest) {
      throw new Error('Квест уже активен')
    }
    
    // Создаем новый пользовательский квест
    const newUserQuest: UserQuest = {
      userId,
      questId,
      status: 'active',
      progress: quest.requirements.map(req => ({
        requirementId: req.type,
        currentValue: 0,
        requiredValue: req.requiredValue,
        isCompleted: false,
        updatedAt: new Date()
      })),
      startedAt: new Date(),
      expiresAt: quest.timeLimit ? 
        new Date(Date.now() + quest.timeLimit * 24 * 60 * 60 * 1000) : undefined
    }
    
    userQuests.push(newUserQuest)
    this.userQuests.set(userId, userQuests)
    
    console.log(`${user.displayName} начал квест "${quest.title}"`)
    
    return newUserQuest
  }
  
  async updateQuestProgress(userId: string, questId: string, updates: Record<string, number>): Promise<UserQuest | null> {
    const userQuests = this.userQuests.get(userId) || []
    const userQuest = userQuests.find(uq => uq.questId === questId)
    
    if (!userQuest || userQuest.status !== 'active') {
      return null
    }
    
    let questCompleted = true
    
    // Обновляем прогресс
    userQuest.progress.forEach(progress => {
      if (updates[progress.requirementId] !== undefined) {
        progress.currentValue = Math.min(
          progress.requiredValue,
          updates[progress.requirementId]
        )
        progress.isCompleted = progress.currentValue >= progress.requiredValue
        progress.updatedAt = new Date()
      }
      
      if (!progress.isCompleted) {
        questCompleted = false
      }
    })
    
    // Проверяем завершение квеста
    if (questCompleted) {
      await this.completeQuest(userId, questId)
    }
    
    return userQuest
  }
  
  async completeQuest(userId: string, questId: string): Promise<void> {
    const user = getUserById(userId)
    const quest = this.quests.find(q => q.id === questId)
    const userQuests = this.userQuests.get(userId) || []
    const userQuest = userQuests.find(uq => uq.questId === questId)
    
    if (!user || !quest || !userQuest) return
    
    userQuest.status = 'completed'
    userQuest.completedAt = new Date()
    
    // Выдаем награды
    for (const reward of quest.rewards) {
      switch (reward.type) {
        case 'xp':
          await this.awardXP(userId, Number(reward.value), `завершение квеста "${quest.title}"`)
          break
        case 'badge':
          const badge = this.badges.find(b => b.name.toLowerCase().includes(String(reward.value)))
          if (badge) {
            await this.awardBadge(userId, badge.id)
          }
          break
        case 'skill_boost':
          // Здесь можно добавить логику бустов навыков
          break
        case 'unlock_feature':
          // Здесь можно разблокировать новые функции
          break
      }
    }
    
    console.log(`${user.displayName} завершил квест "${quest.title}"!`)
    
    // Проверяем бейджи за выполнение квестов
    await this.checkBadgeCriteria(userId)
  }
  
  // Получение данных пользователя
  async getUserGameData(userId: string) {
    const user = getUserById(userId)
    if (!user) return null
    
    const xp = this.userXP.get(userId) || 0
    const level = this.getUserLevel(xp)
    const levelInfo = profileLevels.find(l => l.level === level)
    const nextLevelInfo = profileLevels.find(l => l.level === level + 1)
    
    const badges = this.userBadges.get(userId) || []
    const quests = this.userQuests.get(userId) || []
    
    return {
      xp,
      level,
      levelInfo,
      nextLevelInfo,
      xpToNextLevel: nextLevelInfo ? nextLevelInfo.xpRequired - xp : 0,
      badges: badges.map(ub => ({
        ...ub,
        badge: this.badges.find(b => b.id === ub.badgeId)
      })),
      activeQuests: quests.filter(q => q.status === 'active'),
      completedQuests: quests.filter(q => q.status === 'completed'),
      streak: this.getUserStreak(userId),
      dailyXP: await this.getDailyXP(userId)
    }
  }
  
  private async getDailyXP(userId: string): Promise<number> {
    // В реальной системе здесь был бы запрос к базе данных
    // Возвращаем mock значение
    return Math.floor(Math.random() * 200)
  }
  
  // Получение доступных квестов
  getAvailableQuests(userId: string): Quest[] {
    const userQuests = this.userQuests.get(userId) || []
    const activeQuestIds = userQuests.map(uq => uq.questId)
    
    return this.quests.filter(quest => 
      quest.isActive && 
      !activeQuestIds.includes(quest.id)
    )
  }
  
  // Получение всех бейджей
  getAllBadges(): Badge[] {
    return this.badges
  }
  
  // Получение лидерборда
  getLeaderboard(limit: number = 10) {
    const leaderboard = Array.from(this.userXP.entries())
      .map(([userId, xp]) => {
        const user = getUserById(userId)
        return user ? {
          user,
          xp,
          level: this.getUserLevel(xp),
          badges: (this.userBadges.get(userId) || []).length
        } : null
      })
      .filter(Boolean)
      .sort((a, b) => b!.xp - a!.xp)
      .slice(0, limit)
    
    return leaderboard
  }
}

// Синглтон сервиса
let gamificationServiceInstance: GamificationService | null = null

export function getGamificationService(): GamificationService {
  if (!gamificationServiceInstance) {
    gamificationServiceInstance = new GamificationService()
  }
  return gamificationServiceInstance
}
