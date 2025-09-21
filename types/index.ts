// Основные типы данных PathFinder AI HR System

export type UserRole = 'employee' | 'hr' | 'admin'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type CompetencyArea = 
  | 'technical' 
  | 'leadership' 
  | 'communication' 
  | 'analytical' 
  | 'creative' 
  | 'business'

export type QuestStatus = 'available' | 'active' | 'completed' | 'expired'

export type BadgeType = 'skill' | 'achievement' | 'milestone' | 'special'

export type VacancyStatus = 'draft' | 'active' | 'closed' | 'on_hold'

export type ReadinessLevel = 'not_ready' | 'developing' | 'ready' | 'overqualified'

// === БАЗОВЫЕ ИНТЕРФЕЙСЫ ===

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  role: UserRole
  department: string
  position: string
  managerId?: string
  hireDate: Date
  lastLoginAt?: Date
  isActive: boolean
  profile: Profile
  createdAt: Date
  updatedAt: Date
}

export interface Profile {
  userId: string
  bio?: string
  skills: UserSkill[]
  experiences: Experience[]
  education: Education[]
  certifications: Certification[]
  preferences: ProfilePreferences
  completeness: ProfileCompleteness
  readinessForRotation: boolean
  careerGoals: string[]
  updatedAt: Date
}

export interface UserSkill {
  skillId: string
  level: SkillLevel
  numericLevel?: number // Числовой уровень от 1 до 5 для HR системы
  yearsOfExperience: number
  lastUsed?: Date
  endorsements: number
  selfAssessed: boolean
  verifiedBy?: string[]
  addedAt: Date
  updatedAt: Date
  proficiencyScore?: number // Процентная оценка владения навыком (0-100%)
}

export interface Skill {
  id: string
  name: string
  description: string
  category: string
  competencyArea: CompetencyArea
  isCore: boolean // Ключевой навык для компании
  relatedSkills: string[] // ID связанных навыков
  learningResources: LearningResource[]
  owner: string // Ответственный за навык
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  id: string
  title: string
  description: string
  department: string
  level: 'junior' | 'middle' | 'senior' | 'lead' | 'principal'
  requiredSkills: RequiredSkill[]
  preferredSkills: RequiredSkill[]
  responsibilities: string[]
  qualifications: string[]
  salaryRange?: {
    min: number
    max: number
    currency: string
  }
  isActive: boolean
  owner: string
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface RequiredSkill {
  skillId: string
  level: SkillLevel
  weight: number // Важность навыка (0-1)
  isCritical: boolean
}

// === ГЕЙМИФИКАЦИЯ ===

export interface Badge {
  id: string
  name: string
  description: string
  type: BadgeType
  icon: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  criteria: BadgeCriteria
  xpReward: number
  isActive: boolean
  createdAt: Date
}

export interface BadgeCriteria {
  type: 'skill_level' | 'quest_completion' | 'profile_completion' | 'endorsement_count' | 'custom'
  conditions: Record<string, any>
}

export interface UserBadge {
  userId: string
  badgeId: string
  earnedAt: Date
  level?: number // Для бейджей с уровнями
}

export interface Quest {
  id: string
  title: string
  description: string
  type: 'skill_development' | 'profile_completion' | 'learning' | 'social' | 'achievement'
  targetSkillId?: string
  requirements: QuestRequirement[]
  rewards: QuestReward[]
  timeLimit?: number // В днях
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  isRepeatable: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface QuestRequirement {
  type: 'skill_level' | 'complete_course' | 'get_endorsement' | 'update_profile' | 'custom'
  target: string
  currentValue?: number
  requiredValue: number
}

export interface QuestReward {
  type: 'xp' | 'badge' | 'skill_boost' | 'unlock_feature'
  value: string | number
}

export interface UserQuest {
  userId: string
  questId: string
  status: QuestStatus
  progress: QuestProgress[]
  startedAt: Date
  completedAt?: Date
  expiresAt?: Date
}

export interface QuestProgress {
  requirementId: string
  currentValue: number
  requiredValue: number
  isCompleted: boolean
  updatedAt: Date
}

// === HR И ВАКАНСИИ ===

export interface Vacancy {
  id: string
  title: string
  description: string
  department: string
  roleId?: string
  requiredSkills: RequiredSkill[]
  preferredSkills: RequiredSkill[]
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salaryRange?: {
    min: number
    max: number
    currency: string
  }
  location: string
  workType: 'remote' | 'office' | 'hybrid'
  experienceYears: {
    min: number
    max: number
  }
  status: VacancyStatus
  hiringManagerId: string
  hrContactId: string
  postedAt: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CandidateMatch {
  userId: string
  vacancyId: string
  overallScore: number // 0-100
  skillsMatch: SkillMatch[]
  readinessLevel: ReadinessLevel
  explanation: MatchExplanation
  recommendations: string[]
  matchedAt: Date
}

export interface SkillMatch {
  skillId: string
  required: boolean
  requiredLevel: SkillLevel
  userLevel?: SkillLevel
  gap: number // Отрицательное значение = превышение, положительное = пробел
  weight: number
  contribution: number // Вклад в общий score
}

export interface MatchExplanation {
  overallScore: number
  score: number
  strengths: string[]
  gaps: string[]
  developmentPath: string[]
  estimatedReadinessTime?: number // В месяцах
  riskFactors: string[]
  recommendations: string[]
  timeToReady: string
  confidence: number
}

// === ИИ И РЕКОМЕНДАЦИИ ===

export interface AIRecommendation {
  id: string
  userId: string
  type: 'role' | 'skill' | 'learning' | 'career_path' | 'quest'
  targetId: string // ID роли, навыка и т.д.
  title: string
  description: string
  reasoning: string[]
  confidence: number // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'accepted' | 'declined' | 'expired'
  metadata: Record<string, any>
  createdAt: Date
  expiresAt?: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
  voiceInput?: boolean
  context?: string
  recommendations?: string[]
  skills?: string[]
  roles?: string[]
  isError?: boolean
  }
  timestamp: Date
}

export interface ChatSession {
  id: string
  userId: string
  context: 'employee' | 'hr' | 'admin' | 'general'
  messages: ChatMessage[]
  isActive: boolean
  startedAt: Date
  lastMessageAt: Date
}

// === ОБУЧЕНИЕ И РАЗВИТИЕ ===

export interface LearningResource {
  id: string
  title: string
  description: string
  type: 'course' | 'article' | 'video' | 'book' | 'certification' | 'workshop'
  provider: string
  url?: string
  duration?: number // В минутах
  difficulty: SkillLevel
  targetSkills: string[]
  rating?: number
  reviewsCount?: number
  cost?: {
    amount: number
    currency: string
  }
  isInternal: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Experience {
  id: string
  title: string
  company: string
  description: string
  startDate: Date
  endDate?: Date
  skills: string[]
  achievements: string[]
  isInternal: boolean // Внутренний опыт в компании
}

export interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: Date
  endDate?: Date
  gpa?: number
  achievements?: string[]
}

export interface Certification {
  id: string
  name: string
  issuingOrganization: string
  issueDate: Date
  expirationDate?: Date
  credentialId?: string
  url?: string
  skills: string[]
}

// === КОНФИГУРАЦИЯ И НАСТРОЙКИ ===

export interface ProfilePreferences {
  isProfilePublic: boolean
  allowInternalRecruiting: boolean
  careerInterests: string[]
  workLocationPreference: 'remote' | 'office' | 'hybrid' | 'any'
  travelWillingness: number // 0-100%
  mentorshipInterest: 'mentee' | 'mentor' | 'both' | 'none'
  communicationPreferences: {
    email: boolean
    inApp: boolean
    voiceAssistant: boolean
  }
}

export interface ProfileCompleteness {
  overall: number // 0-100%
  sections: {
    basicInfo: number
    skills: number
    experience: number
    education: number
    goals: number
    preferences: number
  }
  missingFields: string[]
  recommendations: string[]
  threshold: number // Порог для "полного" профиля
  lastCalculatedAt: Date
}

// === СИСТЕМНЫЕ ИНТЕРФЕЙСЫ ===

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface FeatureFlags {
  enableSciboxLLM: boolean
  enableLocalSTT: boolean
  enableLocalTTS: boolean
  enableHRISImport: boolean
  enableLMSImport: boolean
  enableATSImport: boolean
  enableAuditLogging: boolean
  enablePIIRedaction: boolean
  mockMode: boolean
}

// === ПРОВАЙДЕРЫ И ИНТЕГРАЦИИ ===

export interface LLMProvider {
  chat(context: string, messages: ChatMessage[]): Promise<string>
  recommendRoles(profile: Profile): Promise<AIRecommendation[]>
  matchCandidates(jobDescription: string, candidates: User[]): Promise<CandidateMatch[]>
  explainMatch(candidate: User, vacancy: Vacancy): Promise<MatchExplanation>
  generateQuests(userProfile: Profile): Promise<Quest[]>
}

export interface STTProvider {
  transcribe(audioData: Blob): Promise<string>
  isAvailable(): boolean
}

export interface TTSProvider {
  synthesize(text: string, voice?: string): Promise<Blob>
  getAvailableVoices(): Promise<string[]>
  isAvailable(): boolean
}

// === STORE СОСТОЯНИЕ ===

export interface AppState {
  user: User | null
  currentRole: UserRole
  features: FeatureFlags
  isLoading: boolean
  error: string | null
}

export interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  isRecording: boolean
  isSpeaking: boolean
  lastTranscription: string | null
}

export interface UIState {
  sidebarOpen: boolean
  chatDockOpen: boolean
  currentPage: string
  notifications: Notification[]
  theme: 'light' | 'dark'
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  actions?: NotificationAction[]
  autoClose?: boolean
  duration?: number
  createdAt: Date
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'destructive'
}
