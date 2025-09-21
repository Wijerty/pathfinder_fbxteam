// Центральная точка экспорта всех компонентов PathFinder

// UI компоненты
export * from './ui/button'
export * from './ui/card'
export * from './ui/input' 
export * from './ui/textarea'
export * from './ui/badge'
export * from './ui/progress'
export * from './ui/label'
export * from './ui/select'
export * from './ui/switch'
export * from './ui/dropdown-menu'

// Основные компоненты PathFinder
export * from './ChatDock'
export * from './VoiceToggle'
export * from './ProfileCompleteness'
export * from './QuestBoard'
export * from './BadgeBar'
export * from './Leaderboard'
export * from './RoleRecommendations'
export * from './CandidateTable'
export * from './StoreInitializer'

// Переэкспорт для удобства
export { ChatDock } from './ChatDock'
export { VoiceToggle, TextToSpeech } from './VoiceToggle'
export { 
  ProfileCompleteness, 
  ProfileCompletenessCompact, 
  ProfileCompletenessIndicator 
} from './ProfileCompleteness'
export { QuestBoard, QuestBoardCompact } from './QuestBoard'
export { 
  BadgeBar, 
  BadgeBarCompact, 
  BadgeEarnedNotification 
} from './BadgeBar'
export { Leaderboard, LeaderboardCompact } from './Leaderboard'
export { RoleRecommendations } from './RoleRecommendations'
export { CandidateTable } from './CandidateTable'
export { StoreInitializer } from './StoreInitializer'
