// Доменные события PathFinder
import { SkillLevel, UserSkill, Quest, Badge, Profile, Vacancy, CandidateMatch } from '@/types'

// Основные типы событий
export type DomainEvent =
  // Профиль и навыки
  | 'PROFILE_UPDATED'
  | 'SKILL_ADDED' 
  | 'SKILL_LEVEL_CHANGED'
  | 'SKILL_REMOVED'
  | 'SKILL_ENDORSED'
  
  // Обучение и курсы
  | 'COURSE_ENROLLED'
  | 'COURSE_COMPLETED'
  | 'COURSE_DROPPED'
  | 'LEARNING_RESOURCE_ACCESSED'
  
  // Геймификация
  | 'QUEST_ACCEPTED'
  | 'QUEST_COMPLETED' 
  | 'QUEST_PROGRESS_UPDATED'
  | 'BADGE_AWARDED'
  | 'XP_GAINED'
  | 'LEVEL_UP'
  
  // Таксономия и пороги
  | 'THRESHOLD_CHANGED'
  | 'TAXONOMY_UPDATED'
  | 'ROLE_REQUIREMENTS_CHANGED'
  
  // HR и вакансии
  | 'VACANCY_ADDED'
  | 'VACANCY_EDITED'
  | 'VACANCY_CLOSED'
  | 'MATCH_RECALCULATED'
  | 'CANDIDATE_RECOMMENDED'
  
  // Взаимодействие с ИИ
  | 'CHAT_SUGGESTION_APPLIED'
  | 'VOICE_COMMAND_PARSED'
  | 'AI_RECOMMENDATION_GENERATED'
  | 'AI_RECOMMENDATION_ACCEPTED'
  | 'AI_RECOMMENDATION_REJECTED'
  
  // Системные события
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'NOTIFICATION_SENT'
  | 'ERROR_OCCURRED'

// Базовый интерфейс события
export interface EventPayload<T extends DomainEvent = DomainEvent, D = any> {
  type: T
  data: D
  userId?: string
  sessionId?: string
  timestamp: number
  source?: 'user' | 'system' | 'ai' | 'external'
  metadata?: Record<string, any>
}

// Специфические payload'ы для событий

// === ПРОФИЛЬ И НАВЫКИ ===
export interface ProfileUpdatedPayload {
  userId: string
  changes: Partial<Profile>
  previousVersion?: Partial<Profile>
}

export interface SkillAddedPayload {
  userId: string
  skill: UserSkill
  source: 'manual' | 'course_completion' | 'ai_suggestion' | 'import'
}

export interface SkillLevelChangedPayload {
  userId: string
  skillId: string
  previousLevel: SkillLevel
  newLevel: SkillLevel
  source: 'manual' | 'course_completion' | 'assessment' | 'ai_suggestion'
  justification?: string
}

export interface SkillRemovedPayload {
  userId: string
  skillId: string
  removedSkill: UserSkill
  reason?: string
}

export interface SkillEndorsedPayload {
  userId: string
  skillId: string
  endorserId: string
  endorserName: string
}

// === ОБУЧЕНИЕ ===
export interface CourseEnrolledPayload {
  userId: string
  courseId: string
  courseName: string
  targetSkills: string[]
  estimatedDuration?: number
  source: 'manual' | 'ai_recommendation' | 'quest_requirement'
}

export interface CourseCompletedPayload {
  userId: string
  courseId: string
  courseName: string
  completedAt: Date
  skillGains: Array<{
    skillId: string
    previousLevel?: SkillLevel
    newLevel: SkillLevel
  }>
  certificateUrl?: string
}

export interface CourseDroppedPayload {
  userId: string
  courseId: string
  courseName: string
  droppedAt: Date
  reason?: string
  progress: number // 0-100%
}

// === ГЕЙМИФИКАЦИЯ ===
export interface QuestAcceptedPayload {
  userId: string
  questId: string
  quest: Quest
  acceptedAt: Date
}

export interface QuestCompletedPayload {
  userId: string
  questId: string
  quest: Quest
  completedAt: Date
  rewards: Array<{
    type: 'xp' | 'badge' | 'skill_boost' | 'unlock_feature'
    value: string | number
  }>
}

export interface QuestProgressUpdatedPayload {
  userId: string
  questId: string
  requirementId: string
  previousValue: number
  currentValue: number
  requiredValue: number
  isCompleted: boolean
}

export interface BadgeAwardedPayload {
  userId: string
  badge: Badge
  awardedAt: Date
  criteria: string
  xpReward: number
}

export interface XpGainedPayload {
  userId: string
  amount: number
  reason: string
  source: 'quest_completion' | 'skill_update' | 'profile_completion' | 'endorsement' | 'learning' | 'mentorship'
  previousXp: number
  newXp: number
}

export interface LevelUpPayload {
  userId: string
  previousLevel: number
  newLevel: number
  previousXp: number
  newXp: number
  rewards?: Array<{
    type: string
    value: any
  }>
}

// === ТАКСОНОМИЯ ===
export interface ThresholdChangedPayload {
  adminId: string
  thresholdType: 'profile_completeness' | 'skill_level' | 'experience_years'
  previousValue: number
  newValue: number
  affectedUsers: string[]
}

export interface TaxonomyUpdatedPayload {
  adminId: string
  entityType: 'skill' | 'role' | 'competency_area'
  entityId: string
  changes: Record<string, any>
  impactedUsers: string[]
}

export interface RoleRequirementsChangedPayload {
  adminId: string
  roleId: string
  previousRequirements: any[]
  newRequirements: any[]
  affectedVacancies: string[]
}

// === HR И ВАКАНСИИ ===
export interface VacancyAddedPayload {
  vacancyId: string
  vacancy: Vacancy
  createdBy: string
  autoMatch: boolean
}

export interface VacancyEditedPayload {
  vacancyId: string
  changes: Partial<Vacancy>
  editedBy: string
  previousVersion?: Partial<Vacancy>
  requiresRematch: boolean
}

export interface VacancyClosedPayload {
  vacancyId: string
  closedBy: string
  reason: string
  closedAt: Date
}

export interface MatchRecalculatedPayload {
  vacancyId?: string // Если undefined, то пересчет для всех вакансий
  userId?: string // Если undefined, то пересчет для всех пользователей
  trigger: 'profile_updated' | 'vacancy_updated' | 'threshold_changed' | 'manual'
  newMatches: CandidateMatch[]
  changedMatches: Array<{
    userId: string
    vacancyId: string
    previousScore: number
    newScore: number
    scoreChange: number
  }>
}

export interface CandidateRecommendedPayload {
  userId: string
  vacancyId: string
  match: CandidateMatch
  recommendedBy: 'ai' | 'hr' | 'system'
  confidence: number
}

// === ИИ ВЗАИМОДЕЙСТВИЕ ===
export interface ChatSuggestionAppliedPayload {
  userId: string
  sessionId: string
  messageId: string
  suggestionType: 'skill_add' | 'course_enroll' | 'quest_accept' | 'profile_update' | 'threshold_change'
  suggestionData: any
  appliedAt: Date
  resultingEvents: DomainEvent[]
}

export interface VoiceCommandParsedPayload {
  userId: string
  sessionId: string
  audioText: string
  parsedIntent: {
    action: string
    entities: Record<string, any>
    confidence: number
  }
  commandResult: 'success' | 'failed' | 'clarification_needed'
}

export interface AiRecommendationGeneratedPayload {
  userId: string
  recommendationType: 'role' | 'skill' | 'learning' | 'career_path' | 'quest'
  recommendations: Array<{
    id: string
    targetId: string
    title: string
    description: string
    reasoning: string[]
    confidence: number
    priority: 'low' | 'medium' | 'high' | 'critical'
  }>
  context: Record<string, any>
}

export interface AiRecommendationAcceptedPayload {
  userId: string
  recommendationId: string
  acceptedAt: Date
  actionsTaken: string[]
}

export interface AiRecommendationRejectedPayload {
  userId: string
  recommendationId: string
  rejectedAt: Date
  reason?: string
  feedback?: string
}

// === СИСТЕМНЫЕ ===
export interface UserLoggedInPayload {
  userId: string
  loginAt: Date
  sessionId: string
  userAgent?: string
  ipAddress?: string
}

export interface UserLoggedOutPayload {
  userId: string
  logoutAt: Date
  sessionId: string
  duration: number // в секундах
}

export interface NotificationSentPayload {
  userId: string
  notificationId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  channel: 'in_app' | 'email' | 'push'
  sentAt: Date
}

export interface ErrorOccurredPayload {
  userId?: string
  sessionId?: string
  error: {
    message: string
    stack?: string
    code?: string
    context?: Record<string, any>
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  occurredAt: Date
}

// Type guards для проверки типов событий
export function isProfileEvent(event: EventPayload): boolean {
  return [
    'PROFILE_UPDATED',
    'SKILL_ADDED', 
    'SKILL_LEVEL_CHANGED',
    'SKILL_REMOVED',
    'SKILL_ENDORSED'
  ].includes(event.type)
}

export function isLearningEvent(event: EventPayload): boolean {
  return [
    'COURSE_ENROLLED',
    'COURSE_COMPLETED',
    'COURSE_DROPPED',
    'LEARNING_RESOURCE_ACCESSED'
  ].includes(event.type)
}

export function isGamificationEvent(event: EventPayload): boolean {
  return [
    'QUEST_ACCEPTED',
    'QUEST_COMPLETED',
    'QUEST_PROGRESS_UPDATED',
    'BADGE_AWARDED',
    'XP_GAINED',
    'LEVEL_UP'
  ].includes(event.type)
}

export function isHrEvent(event: EventPayload): boolean {
  return [
    'VACANCY_ADDED',
    'VACANCY_EDITED',
    'VACANCY_CLOSED',
    'MATCH_RECALCULATED',
    'CANDIDATE_RECOMMENDED'
  ].includes(event.type)
}

export function isAdminEvent(event: EventPayload): boolean {
  return [
    'THRESHOLD_CHANGED',
    'TAXONOMY_UPDATED',
    'ROLE_REQUIREMENTS_CHANGED'
  ].includes(event.type)
}

export function isAiEvent(event: EventPayload): boolean {
  return [
    'CHAT_SUGGESTION_APPLIED',
    'VOICE_COMMAND_PARSED',
    'AI_RECOMMENDATION_GENERATED',
    'AI_RECOMMENDATION_ACCEPTED',
    'AI_RECOMMENDATION_REJECTED'
  ].includes(event.type)
}

// Utility функции для создания событий
export function createEvent<T extends DomainEvent>(
  type: T,
  data: any,
  userId?: string,
  metadata?: Record<string, any>
): EventPayload<T> {
  return {
    type,
    data,
    userId,
    timestamp: Date.now(),
    source: 'user',
    metadata
  }
}

export function createSystemEvent<T extends DomainEvent>(
  type: T,
  data: any,
  metadata?: Record<string, any>
): EventPayload<T> {
  return {
    type,
    data,
    timestamp: Date.now(),
    source: 'system',
    metadata
  }
}

export function createAiEvent<T extends DomainEvent>(
  type: T,
  data: any,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, any>
): EventPayload<T> {
  return {
    type,
    data,
    userId,
    sessionId,
    timestamp: Date.now(),
    source: 'ai',
    metadata
  }
}
