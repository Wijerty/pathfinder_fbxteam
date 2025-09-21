// Auth Slice для управления аутентификацией и текущим пользователем
import { StateCreator } from 'zustand'
import { User, UserRole } from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'

// Состояние аутентификации
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  sessionId: string | null
  lastLoginAt: Date | null
  error: string | null
}

// Действия аутентификации
export interface AuthActions {
  // Основные действия
  login: (user: User, sessionId?: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  
  // Утилиты
  clearError: () => void
  setLoading: (loading: boolean) => void
  refreshUser: () => Promise<void>
  
  // Проверки
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: string) => boolean
  canAccessPage: (page: string) => boolean
}

// Полный тип слайса
export type AuthSlice = AuthState & AuthActions

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  sessionId: null,
  lastLoginAt: null,
  error: null
}

// Создание auth slice
export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  ...initialState,

  // === ДЕЙСТВИЯ ===

  login: async (user: User, sessionId?: string) => {
    try {
      set({ isLoading: true, error: null })

      const newSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const loginTime = new Date()

      // Обновляем состояние
      set({
        user,
        isAuthenticated: true,
        sessionId: newSessionId,
        lastLoginAt: loginTime,
        isLoading: false,
        error: null
      })

      // Публикуем событие входа
      await publish(createEvent(
        'USER_LOGGED_IN',
        {
          userId: user.id,
          loginAt: loginTime,
          sessionId: newSessionId,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        },
        user.id,
        { 
          role: user.role,
          department: user.department 
        }
      ))

      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pathfinder_user', JSON.stringify(user))
        localStorage.setItem('pathfinder_session', newSessionId)
      }

      // Загружаем профиль пользователя
      try {
        const response = await fetch(`/api/profile/${user.id}`)
        if (response.ok) {
          const profile = await response.json()
          console.log('✅ Профиль загружен:', profile)
        }
      } catch (profileError) {
        console.warn('⚠️ Не удалось загрузить профиль:', profileError)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка входа'
      set({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null 
      })
      throw error
    }
  },

  logout: async () => {
    try {
      const { user, sessionId, lastLoginAt } = get()
      
      if (!user || !sessionId) return

      // Вычисляем продолжительность сессии
      const duration = lastLoginAt ? 
        Math.floor((Date.now() - lastLoginAt.getTime()) / 1000) : 0

      // Публикуем событие выхода
      await publish(createEvent(
        'USER_LOGGED_OUT',
        {
          userId: user.id,
          logoutAt: new Date(),
          sessionId,
          duration
        },
        user.id
      ))

      // Очищаем состояние
      set(initialState)

      // Очищаем localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pathfinder_user')
        localStorage.removeItem('pathfinder_session')
      }

    } catch (error) {
      console.error('Ошибка при выходе:', error)
      // Всё равно очищаем состояние
      set(initialState)
    }
  },

  updateUser: async (updates: Partial<User>) => {
    try {
      const { user } = get()
      if (!user) throw new Error('Пользователь не авторизован')

      const previousUser = { ...user }
      const updatedUser = { ...user, ...updates, updatedAt: new Date() }

      // Обновляем состояние
      set({ user: updatedUser })

      // Публикуем событие обновления профиля
      await publish(createEvent(
        'PROFILE_UPDATED',
        {
          userId: user.id,
          changes: updates,
          previousVersion: previousUser
        },
        user.id
      ))

      // Обновляем localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('pathfinder_user', JSON.stringify(updatedUser))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления'
      set({ error: errorMessage })
      throw error
    }
  },

  switchRole: async (role: UserRole) => {
    try {
      const { user } = get()
      if (!user) throw new Error('Пользователь не авторизован')

      // Проверяем, что пользователь может переключиться на эту роль
      if (!get().canAccessPage(role)) {
        throw new Error('Недостаточно прав для этой роли')
      }

      const previousRole = user.role
      await get().updateUser({ role })

      // Дополнительная логика переключения ролей может быть здесь
      console.log(`Role switched from ${previousRole} to ${role}`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка переключения роли'
      set({ error: errorMessage })
      throw error
    }
  },

  refreshUser: async () => {
    try {
      set({ isLoading: true })

      const { user } = get()
      if (!user) throw new Error('Пользователь не авторизован')

      // Здесь можно сделать запрос к API для обновления данных пользователя
      // Пока просто имитируем обновление
      await new Promise(resolve => setTimeout(resolve, 500))

      set({ isLoading: false })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // === УТИЛИТЫ ===

  clearError: () => {
    set({ error: null })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  // === ПРОВЕРКИ ===

  hasRole: (role: UserRole) => {
    const { user } = get()
    return user?.role === role
  },

  hasPermission: (permission: string) => {
    const { user } = get()
    if (!user) return false

    // Определяем права по ролям
    const rolePermissions: Record<UserRole, string[]> = {
      admin: ['*'], // Админ может всё
      hr: [
        'view_all_profiles',
        'create_vacancy',
        'edit_vacancy',
        'view_candidates',
        'manage_matching',
        'view_analytics'
      ],
      employee: [
        'view_own_profile',
        'edit_own_profile',
        'view_courses',
        'enroll_course',
        'view_quests',
        'accept_quest'
      ]
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes('*') || userPermissions.includes(permission)
  },

  canAccessPage: (page: string) => {
    const { user } = get()
    if (!user) return false

    // Определяем доступ к страницам по ролям
    const pageAccess: Record<string, UserRole[]> = {
      employee: ['employee', 'hr', 'admin'],
      hr: ['hr', 'admin'],
      admin: ['admin'],
      dashboard: ['employee', 'hr', 'admin']
    }

    const allowedRoles = pageAccess[page] || []
    return allowedRoles.includes(user.role)
  }
})

// === СЕЛЕКТОРЫ ===

// Селекторы для производных данных
export const authSelectors = {
  // Основные селекторы
  getUser: (state: AuthSlice) => state.user,
  isAuthenticated: (state: AuthSlice) => state.isAuthenticated,
  isLoading: (state: AuthSlice) => state.isLoading,
  getError: (state: AuthSlice) => state.error,
  
  // Информация о роли
  getCurrentRole: (state: AuthSlice) => state.user?.role,
  getDepartment: (state: AuthSlice) => state.user?.department,
  getDisplayName: (state: AuthSlice) => state.user?.displayName || 
    (state.user ? `${state.user.firstName} ${state.user.lastName}` : null),
  
  // Статусы
  isEmployee: (state: AuthSlice) => state.user?.role === 'employee',
  isHR: (state: AuthSlice) => state.user?.role === 'hr',
  isAdmin: (state: AuthSlice) => state.user?.role === 'admin',
  
  // Проверки прав
  canManageProfiles: (state: AuthSlice) => 
    state.user?.role === 'hr' || state.user?.role === 'admin',
  canManageVacancies: (state: AuthSlice) => 
    state.user?.role === 'hr' || state.user?.role === 'admin',
  canManageSystem: (state: AuthSlice) => 
    state.user?.role === 'admin',
  
  // Информация о сессии
  getSessionInfo: (state: AuthSlice) => ({
    sessionId: state.sessionId,
    lastLoginAt: state.lastLoginAt,
    isActive: state.isAuthenticated && !!state.sessionId
  }),
  
  // Профиль готовности
  getProfileReadiness: (state: AuthSlice) => ({
    completeness: state.user?.profile.completeness.overall || 0,
    isReady: state.user?.profile.readinessForRotation || false,
    threshold: state.user?.profile.completeness.threshold || 70
  })
}

// Утилиты для восстановления сессии
export const authUtils = {
  // Восстановление сессии из localStorage
  restoreSession: (): Pick<AuthState, 'user' | 'sessionId' | 'isAuthenticated'> | null => {
    if (typeof window === 'undefined') return null

    try {
      const userJson = localStorage.getItem('pathfinder_user')
      const sessionId = localStorage.getItem('pathfinder_session')

      if (!userJson || !sessionId) return null

      const user = JSON.parse(userJson) as User
      
      // Проверяем, что данные пользователя валидны
      if (!user.id || !user.email || !user.role) return null

      return {
        user,
        sessionId,
        isAuthenticated: true
      }
    } catch (error) {
      console.error('Ошибка восстановления сессии:', error)
      return null
    }
  },

  // Очистка данных сессии
  clearSession: (): void => {
    if (typeof window === 'undefined') return

    localStorage.removeItem('pathfinder_user')
    localStorage.removeItem('pathfinder_session')
  }
}
