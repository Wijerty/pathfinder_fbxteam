// Главный store PathFinder - объединяет все слайсы
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

// Импорт слайсов
import { createAuthSlice, type AuthSlice } from './authSlice'
import { createProfileSlice, type ProfileSlice } from './profileSlice'
import { createGamificationSlice, type GamificationSlice } from './gamificationSlice'
import { createHrSlice, type HrSlice } from './hrSlice'
import { createTaxonomySlice, type TaxonomySlice } from './taxonomySlice'
import { createChatSlice, type ChatSlice } from './chatSlice'
import { createUiSlice, type UiSlice } from './uiSlice'

// Объединенный тип store
export type PathFinderStore = AuthSlice & 
  ProfileSlice & 
  GamificationSlice & 
  HrSlice & 
  TaxonomySlice & 
  ChatSlice & 
  UiSlice

// Создание store
export const useStore = create<PathFinderStore>()(
  devtools(
    subscribeWithSelector(
      immer((...a) => ({
        // Объединяем все слайсы
        ...createAuthSlice(...a),
        ...createProfileSlice(...a),
        ...createGamificationSlice(...a),
        ...createHrSlice(...a),
        ...createTaxonomySlice(...a),
        ...createChatSlice(...a),
        ...createUiSlice(...a)
      }))
    ),
    {
      name: 'pathfinder-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// === ИНИЦИАЛИЗАЦИЯ STORE ===

// Функция инициализации store при загрузке приложения
export const initializeStore = async () => {
  const store = useStore.getState()
  
  try {
    // 1. Загружаем настройки UI
    store.loadUISettings()
    
    // 2. Восстанавливаем сессию если есть
    const { authUtils } = await import('./authSlice')
    const sessionData = authUtils.restoreSession()
    
    if (sessionData?.user) {
      await store.login(sessionData.user, sessionData.sessionId)
      
      // 3. Загружаем данные пользователя
      await Promise.all([
        store.loadProfile(sessionData.user.id),
        store.loadGamificationData(sessionData.user.id),
        store.loadSessions(),
        store.loadTaxonomy()
      ])
      
      // 4. Загружаем данные в зависимости от роли
      if (sessionData.user.role === 'hr' || sessionData.user.role === 'admin') {
        await Promise.all([
          store.loadVacancies(),
          store.loadCandidates()
        ])
      }
    } else {
      // Загружаем базовые данные для неавторизованных пользователей
      await store.loadTaxonomy()
    }
    
    // 5. Определяем размер экрана
    if (typeof window !== 'undefined') {
      updateScreenInfo()
      
      // Слушаем изменения размера экрана
      window.addEventListener('resize', updateScreenInfo)
      
      // Слушаем изменения темы системы
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addListener(handleThemeChange)
    }
    
    console.log('✅ PathFinder Store инициализован успешно')
    
  } catch (error) {
    console.error('❌ Ошибка инициализации store:', error)
    
    // Показываем уведомление об ошибке
    useStore.getState().showToast(
      'error',
      'Ошибка инициализации',
      'Не удалось загрузить некоторые данные. Попробуйте обновить страницу.'
    )
  }
}

// === УТИЛИТЫ ===

// Обновление информации о экране
const updateScreenInfo = () => {
  if (typeof window === 'undefined') return
  
  const width = window.innerWidth
  const isMobile = width < 768
  
  let screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'lg'
  if (width < 640) screenSize = 'xs'
  else if (width < 768) screenSize = 'sm'
  else if (width < 1024) screenSize = 'md'
  else if (width < 1280) screenSize = 'lg'
  else screenSize = 'xl'
  
  const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  
  useStore.getState().updateScreenInfo(isMobile, screenSize, orientation)
}

// Обработка изменения системной темы
const handleThemeChange = (e: MediaQueryListEvent) => {
  const { theme, setTheme } = useStore.getState()
  
  if (theme === 'auto') {
    setTheme('auto') // Перезапускаем применение темы
  }
}

// === СЕЛЕКТОРЫ ВЫСОКОГО УРОВНЯ ===

// Селекторы для удобного доступа к данным из разных слайсов
export const useAuth = () => useStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  login: state.login,
  logout: state.logout,
  updateUser: state.updateUser
}))

export const useProfile = () => useStore((state) => ({
  profile: state.profile,
  isLoading: state.isLoading,
  stats: state.stats,
  addSkill: state.addSkill,
  updateSkill: state.updateSkill,
  removeSkill: state.removeSkill
}))

export const useGamification = () => useStore((state) => ({
  currentXp: state.currentXp,
  currentLevel: state.currentLevel,
  activeQuests: state.activeQuests,
  earnedBadges: state.earnedBadges,
  acceptQuest: state.acceptQuest,
  completeQuest: state.completeQuest
}))

export const useHR = () => useStore((state) => ({
  vacancies: state.filteredVacancies,
  candidateMatches: state.candidateMatches,
  isLoadingVacancies: state.isLoadingVacancies,
  createVacancy: state.createVacancy,
  calculateMatches: state.calculateMatches
}))

export const useTaxonomy = () => useStore((state) => ({
  skills: state.skills,
  roles: state.roles,
  completenessThreshold: state.completenessThreshold,
  createSkill: state.createSkill,
  updateCompletenessThreshold: state.updateCompletenessThreshold
}))

export const useChat = () => useStore((state) => ({
  messages: state.messages,
  isStreaming: state.isStreaming,
  isRecording: state.isRecording,
  sendMessage: state.sendMessage,
  startRecording: state.startRecording,
  stopRecording: state.stopRecording
}))

export const useUI = () => useStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  chatDockOpen: state.chatDockOpen,
  theme: state.theme,
  isMobile: state.isMobile,
  toggleSidebar: state.toggleSidebar,
  toggleChatDock: state.toggleChatDock,
  setTheme: state.setTheme,
  showToast: state.showToast,
  showNotification: state.showNotification
}))

// === ПРОИЗВОДНЫЕ СЕЛЕКТОРЫ ===

// Селекторы, которые объединяют данные из разных слайсов
export const useDashboardData = () => useStore((state) => {
  const isEmployee = state.user?.role === 'employee'
  const isHR = state.user?.role === 'hr'
  const isAdmin = state.user?.role === 'admin'
  
  return {
    user: state.user,
    isEmployee,
    isHR,
    isAdmin,
    
    // Данные профиля
    profileCompleteness: state.profile?.completeness.overall || 0,
    skillsCount: state.profile?.skills.length || 0,
    isProfileReady: state.profile?.readinessForRotation || false,
    
    // Геймификация
    currentXp: state.currentXp,
    currentLevel: state.currentLevel,
    activeQuestsCount: state.activeQuests.length,
    earnedBadgesCount: state.earnedBadges.length,
    
    // HR данные (если применимо)
    activeVacanciesCount: isHR || isAdmin ? state.vacancies.filter(v => v.status === 'active').length : 0,
    readyCandidatesCount: isHR || isAdmin ? state.matchingInsights.readyCandidates : 0,
    
    // UI состояние
    unreadNotifications: state.notifications.filter(n => !n.autoClose).length,
    hasActiveLoaders: Array.from(state.loaders.values()).some(l => l.isLoading)
  }
})

export const useSkillsData = () => useStore((state) => {
  const userSkills = state.profile?.skills || []
  const allSkills = state.skills
  const skillsMap = new Map(allSkills.map(skill => [skill.id, skill]))
  
  // Обогащаем пользовательские навыки данными из таксономии
  const enrichedUserSkills = userSkills.map(userSkill => ({
    ...userSkill,
    skillInfo: skillsMap.get(userSkill.skillId)
  }))
  
  // Навыки, которые пользователь может добавить
  const availableSkills = allSkills.filter(skill => 
    !userSkills.some(us => us.skillId === skill.id)
  )
  
  return {
    userSkills: enrichedUserSkills,
    availableSkills,
    skillsMap,
    totalSkills: allSkills.length,
    userSkillsCount: userSkills.length
  }
})

export const useMatchingData = () => useStore((state) => {
  const { user } = state
  if (!user || user.role !== 'hr') return null
  
  const { candidateMatches, filteredVacancies, matchingInsights } = state
  
  // Лучшие матчи по всем вакансиям
  const allMatches: Array<{ match: any; vacancy: any }> = []
  
  candidateMatches.forEach((matches, vacancyId) => {
    const vacancy = filteredVacancies.find(v => v.id === vacancyId)
    if (vacancy) {
      matches.forEach(match => {
        allMatches.push({ match, vacancy })
      })
    }
  })
  
  const topMatches = allMatches
    .sort((a, b) => b.match.overallScore - a.match.overallScore)
    .slice(0, 10)
  
  return {
    topMatches,
    insights: matchingInsights,
    totalMatches: allMatches.length,
    averageScore: matchingInsights.averageMatchScore,
    candidateMatches,
    vacancies: filteredVacancies
  }
})

// === ПОДПИСКИ НА ИЗМЕНЕНИЯ ===

// Настройка реактивных подписок
export const setupStoreSubscriptions = () => {
  // Подписка на изменения пользователя для обновления связанных данных
  useStore.subscribe(
    (state) => state.user,
    async (user, previousUser) => {
      if (user && user.id !== previousUser?.id) {
        // Новый пользователь вошел - загружаем его данные
        const store = useStore.getState()
        
        try {
          await Promise.all([
            store.loadProfile(user.id),
            store.loadGamificationData(user.id)
          ])
          
          if (user.role === 'hr' || user.role === 'admin') {
            await Promise.all([
              store.loadVacancies(),
              store.loadCandidates()
            ])
          }
        } catch (error) {
          console.error('Ошибка загрузки данных пользователя:', error)
        }
      }
    }
  )
  
  // Подписка на изменения темы для сохранения настроек
  useStore.subscribe(
    (state) => state.theme,
    (theme) => {
      console.log(`Тема изменена на: ${theme}`)
    }
  )
  
  // Подписка на ошибки для показа уведомлений
  const errorSelectors = [
    (state: PathFinderStore) => state.error, // auth error
    (state: PathFinderStore) => state.error, // profile error (same field name)
    // Можно добавить больше селекторов ошибок
  ]
  
  errorSelectors.forEach(selector => {
    useStore.subscribe(
      selector,
      (error) => {
        if (error) {
          useStore.getState().showToast('error', 'Ошибка', error)
        }
      }
    )
  })
}

// === ЭКСПОРТ ===

// Экспортируем store и утилиты
export default useStore

// Экспортируем типы для использования в компонентах
export type { PathFinderStore }
