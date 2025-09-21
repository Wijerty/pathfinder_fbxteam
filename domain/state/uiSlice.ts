// UI Slice для управления состоянием пользовательского интерфейса
import { StateCreator } from 'zustand'
import { Notification, NotificationAction } from '@/types'

// Состояние UI
export interface UiState {
  // Навигация и панели
  sidebarOpen: boolean
  chatDockOpen: boolean
  currentPage: string
  
  // Модальные окна и диалоги
  dialogs: Map<string, {
    id: string
    type: string
    title: string
    isOpen: boolean
    data?: any
    onConfirm?: () => void
    onCancel?: () => void
  }>
  
  // Уведомления и тосты
  notifications: Notification[]
  toasts: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    duration?: number
    actions?: NotificationAction[]
    autoClose: boolean
    createdAt: Date
  }>
  
  // Индикаторы загрузки
  loaders: Map<string, {
    id: string
    isLoading: boolean
    message?: string
    progress?: number
  }>
  
  // Подтверждения и алерты
  confirmations: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    onConfirm: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
  }>
  
  // Темы и настройки отображения
  theme: 'light' | 'dark' | 'auto'
  density: 'compact' | 'normal' | 'comfortable'
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  
  // Состояние форм
  formStates: Map<string, {
    id: string
    isDirty: boolean
    isValid: boolean
    isSubmitting: boolean
    errors: Record<string, string>
    touched: Record<string, boolean>
  }>
  
  // Фокус и доступность
  focusedElement: string | null
  skipLinks: boolean
  highContrast: boolean
  
  // Производительность и дебаг
  performanceMode: boolean
  debugMode: boolean
  
  // Мобильная адаптация
  isMobile: boolean
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  orientation: 'portrait' | 'landscape'
}

// Действия UI
export interface UiActions {
  // Навигация
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setChatDockOpen: (open: boolean) => void
  toggleChatDock: () => void
  setCurrentPage: (page: string) => void
  
  // Модальные окна
  openDialog: (id: string, type: string, title: string, data?: any) => void
  closeDialog: (id: string) => void
  closeAllDialogs: () => void
  
  // Уведомления
  showNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  hideNotification: (id: string) => void
  clearAllNotifications: () => void
  
  // Тосты
  showToast: (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message?: string,
    options?: {
      duration?: number
      actions?: NotificationAction[]
      autoClose?: boolean
    }
  ) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
  
  // Загрузчики
  showLoader: (id: string, message?: string) => void
  updateLoader: (id: string, progress?: number, message?: string) => void
  hideLoader: (id: string) => void
  clearAllLoaders: () => void
  
  // Подтверждения
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: 'info' | 'warning' | 'error' | 'success'
      onCancel?: () => void
      confirmText?: string
      cancelText?: string
    }
  ) => string
  hideConfirmation: (id: string) => void
  
  // Темы
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setDensity: (density: 'compact' | 'normal' | 'comfortable') => void
  setFontSize: (fontSize: 'small' | 'medium' | 'large') => void
  setReducedMotion: (reduced: boolean) => void
  
  // Формы
  registerForm: (id: string) => void
  updateFormState: (id: string, state: Partial<UiState['formStates']['value']>) => void
  setFormErrors: (id: string, errors: Record<string, string>) => void
  setFormTouched: (id: string, touched: Record<string, boolean>) => void
  clearFormState: (id: string) => void
  
  // Доступность
  setFocusedElement: (elementId: string | null) => void
  setSkipLinks: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  
  // Настройки производительности
  setPerformanceMode: (enabled: boolean) => void
  setDebugMode: (enabled: boolean) => void
  
  // Отзывчивость
  updateScreenInfo: (isMobile: boolean, screenSize: UiState['screenSize'], orientation: UiState['orientation']) => void
  
  // Утилиты
  resetUI: () => void
  loadUISettings: () => void
  saveUISettings: () => void
}

// Полный тип слайса
export type UiSlice = UiState & UiActions

// Начальное состояние
const initialState: UiState = {
  sidebarOpen: true,
  chatDockOpen: false,
  currentPage: '',
  
  dialogs: new Map(),
  notifications: [],
  toasts: [],
  loaders: new Map(),
  confirmations: [],
  
  theme: 'light',
  density: 'normal',
  fontSize: 'medium',
  reducedMotion: false,
  
  formStates: new Map(),
  
  focusedElement: null,
  skipLinks: false,
  highContrast: false,
  
  performanceMode: false,
  debugMode: process.env.NODE_ENV === 'development',
  
  isMobile: false,
  screenSize: 'lg',
  orientation: 'landscape'
}

// Создание UI slice
export const createUiSlice: StateCreator<UiSlice> = (set, get) => ({
  ...initialState,

  // === НАВИГАЦИЯ ===

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open })
    get().saveUISettings()
  },

  toggleSidebar: () => {
    get().setSidebarOpen(!get().sidebarOpen)
  },

  setChatDockOpen: (open: boolean) => {
    set({ chatDockOpen: open })
    get().saveUISettings()
  },

  toggleChatDock: () => {
    get().setChatDockOpen(!get().chatDockOpen)
  },

  setCurrentPage: (page: string) => {
    set({ currentPage: page })
  },

  // === МОДАЛЬНЫЕ ОКНА ===

  openDialog: (id: string, type: string, title: string, data?: any) => {
    const { dialogs } = get()
    const newDialogs = new Map(dialogs)
    
    newDialogs.set(id, {
      id,
      type,
      title,
      isOpen: true,
      data
    })
    
    set({ dialogs: newDialogs })
  },

  closeDialog: (id: string) => {
    const { dialogs } = get()
    const newDialogs = new Map(dialogs)
    
    const dialog = newDialogs.get(id)
    if (dialog) {
      newDialogs.set(id, { ...dialog, isOpen: false })
    }
    
    set({ dialogs: newDialogs })
    
    // Удаляем через короткое время для анимации
    setTimeout(() => {
      const currentDialogs = new Map(get().dialogs)
      currentDialogs.delete(id)
      set({ dialogs: currentDialogs })
    }, 300)
  },

  closeAllDialogs: () => {
    set({ dialogs: new Map() })
  },

  // === УВЕДОМЛЕНИЯ ===

  showNotification: (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const notification: Notification = {
      ...notificationData,
      id,
      createdAt: new Date()
    }
    
    set({
      notifications: [...get().notifications, notification]
    })
    
    // Автоудаление через заданное время
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        get().hideNotification(id)
      }, duration)
    }
    
    return id
  },

  hideNotification: (id: string) => {
    set({
      notifications: get().notifications.filter(n => n.id !== id)
    })
  },

  clearAllNotifications: () => {
    set({ notifications: [] })
  },

  // === ТОСТЫ ===

  showToast: (
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string = '',
    options: {
      duration?: number
      actions?: NotificationAction[]
      autoClose?: boolean
    } = {}
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const toast = {
      id,
      type,
      title,
      message,
      duration: options.duration || 5000,
      actions: options.actions || [],
      autoClose: options.autoClose !== false,
      createdAt: new Date()
    }
    
    set({
      toasts: [...get().toasts, toast]
    })
    
    // Автоудаление
    if (toast.autoClose) {
      setTimeout(() => {
        get().hideToast(id)
      }, toast.duration)
    }
    
    return id
  },

  hideToast: (id: string) => {
    set({
      toasts: get().toasts.filter(t => t.id !== id)
    })
  },

  clearAllToasts: () => {
    set({ toasts: [] })
  },

  // === ЗАГРУЗЧИКИ ===

  showLoader: (id: string, message?: string) => {
    const { loaders } = get()
    const newLoaders = new Map(loaders)
    
    newLoaders.set(id, {
      id,
      isLoading: true,
      message,
      progress: undefined
    })
    
    set({ loaders: newLoaders })
  },

  updateLoader: (id: string, progress?: number, message?: string) => {
    const { loaders } = get()
    const loader = loaders.get(id)
    
    if (loader) {
      const newLoaders = new Map(loaders)
      newLoaders.set(id, {
        ...loader,
        progress,
        message: message || loader.message
      })
      set({ loaders: newLoaders })
    }
  },

  hideLoader: (id: string) => {
    const { loaders } = get()
    const newLoaders = new Map(loaders)
    newLoaders.delete(id)
    set({ loaders: newLoaders })
  },

  clearAllLoaders: () => {
    set({ loaders: new Map() })
  },

  // === ПОДТВЕРЖДЕНИЯ ===

  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    options: {
      type?: 'info' | 'warning' | 'error' | 'success'
      onCancel?: () => void
      confirmText?: string
      cancelText?: string
    } = {}
  ) => {
    const id = `confirmation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const confirmation = {
      id,
      title,
      message,
      type: options.type || 'info',
      onConfirm: () => {
        onConfirm()
        get().hideConfirmation(id)
      },
      onCancel: options.onCancel ? () => {
        options.onCancel!()
        get().hideConfirmation(id)
      } : undefined,
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена'
    }
    
    set({
      confirmations: [...get().confirmations, confirmation]
    })
    
    return id
  },

  hideConfirmation: (id: string) => {
    set({
      confirmations: get().confirmations.filter(c => c.id !== id)
    })
  },

  // === ТЕМЫ ===

  setTheme: (theme: 'light' | 'dark' | 'auto') => {
    set({ theme })
    get().saveUISettings()
    
    // Применяем тему к документу
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.setAttribute('data-theme', isDark ? 'dark' : 'light')
      } else {
        root.setAttribute('data-theme', theme)
      }
    }
  },

  setDensity: (density: 'compact' | 'normal' | 'comfortable') => {
    set({ density })
    get().saveUISettings()
    
    // Применяем плотность к документу
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-density', density)
    }
  },

  setFontSize: (fontSize: 'small' | 'medium' | 'large') => {
    set({ fontSize })
    get().saveUISettings()
    
    // Применяем размер шрифта к документу
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-size', fontSize)
    }
  },

  setReducedMotion: (reduced: boolean) => {
    set({ reducedMotion: reduced })
    get().saveUISettings()
    
    // Применяем настройку к документу
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reduced-motion', reduced.toString())
    }
  },

  // === ФОРМЫ ===

  registerForm: (id: string) => {
    const { formStates } = get()
    const newFormStates = new Map(formStates)
    
    newFormStates.set(id, {
      id,
      isDirty: false,
      isValid: true,
      isSubmitting: false,
      errors: {},
      touched: {}
    })
    
    set({ formStates: newFormStates })
  },

  updateFormState: (id: string, state: Partial<UiState['formStates']['value']>) => {
    const { formStates } = get()
    const currentState = formStates.get(id)
    
    if (currentState) {
      const newFormStates = new Map(formStates)
      newFormStates.set(id, { ...currentState, ...state })
      set({ formStates: newFormStates })
    }
  },

  setFormErrors: (id: string, errors: Record<string, string>) => {
    get().updateFormState(id, { 
      errors,
      isValid: Object.keys(errors).length === 0
    })
  },

  setFormTouched: (id: string, touched: Record<string, boolean>) => {
    get().updateFormState(id, { touched })
  },

  clearFormState: (id: string) => {
    const { formStates } = get()
    const newFormStates = new Map(formStates)
    newFormStates.delete(id)
    set({ formStates: newFormStates })
  },

  // === ДОСТУПНОСТЬ ===

  setFocusedElement: (elementId: string | null) => {
    set({ focusedElement: elementId })
  },

  setSkipLinks: (enabled: boolean) => {
    set({ skipLinks: enabled })
    get().saveUISettings()
  },

  setHighContrast: (enabled: boolean) => {
    set({ highContrast: enabled })
    get().saveUISettings()
    
    // Применяем высокий контраст к документу
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-high-contrast', enabled.toString())
    }
  },

  // === ПРОИЗВОДИТЕЛЬНОСТЬ ===

  setPerformanceMode: (enabled: boolean) => {
    set({ performanceMode: enabled })
    get().saveUISettings()
  },

  setDebugMode: (enabled: boolean) => {
    set({ debugMode: enabled })
  },

  // === ОТЗЫВЧИВОСТЬ ===

  updateScreenInfo: (
    isMobile: boolean, 
    screenSize: UiState['screenSize'], 
    orientation: UiState['orientation']
  ) => {
    set({
      isMobile,
      screenSize,
      orientation
    })
    
    // Автоматически закрываем сайдбар на мобильных устройствах
    if (isMobile && get().sidebarOpen) {
      get().setSidebarOpen(false)
    }
  },

  // === УТИЛИТЫ ===

  resetUI: () => {
    set({
      ...initialState,
      // Сохраняем некоторые настройки
      theme: get().theme,
      density: get().density,
      fontSize: get().fontSize,
      reducedMotion: get().reducedMotion,
      skipLinks: get().skipLinks,
      highContrast: get().highContrast,
      performanceMode: get().performanceMode
    })
  },

  loadUISettings: () => {
    if (typeof window === 'undefined') return
    
    try {
      const settings = localStorage.getItem('pathfinder_ui_settings')
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        
        set({
          theme: parsedSettings.theme || 'light',
          density: parsedSettings.density || 'normal',
          fontSize: parsedSettings.fontSize || 'medium',
          reducedMotion: parsedSettings.reducedMotion || false,
          sidebarOpen: parsedSettings.sidebarOpen !== false,
          chatDockOpen: parsedSettings.chatDockOpen || false,
          skipLinks: parsedSettings.skipLinks || false,
          highContrast: parsedSettings.highContrast || false,
          performanceMode: parsedSettings.performanceMode || false
        })
        
        // Применяем настройки к документу
        get().setTheme(parsedSettings.theme || 'light')
        get().setDensity(parsedSettings.density || 'normal')
        get().setFontSize(parsedSettings.fontSize || 'medium')
        get().setReducedMotion(parsedSettings.reducedMotion || false)
        get().setHighContrast(parsedSettings.highContrast || false)
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек UI:', error)
    }
  },

  saveUISettings: () => {
    if (typeof window === 'undefined') return
    
    try {
      const {
        theme, density, fontSize, reducedMotion,
        sidebarOpen, chatDockOpen, skipLinks, 
        highContrast, performanceMode
      } = get()
      
      const settings = {
        theme,
        density,
        fontSize,
        reducedMotion,
        sidebarOpen,
        chatDockOpen,
        skipLinks,
        highContrast,
        performanceMode
      }
      
      localStorage.setItem('pathfinder_ui_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Ошибка сохранения настроек UI:', error)
    }
  }
})

// === СЕЛЕКТОРЫ ===

export const uiSelectors = {
  // Навигация
  isSidebarOpen: (state: UiSlice) => state.sidebarOpen,
  isChatDockOpen: (state: UiSlice) => state.chatDockOpen,
  getCurrentPage: (state: UiSlice) => state.currentPage,
  
  // Модальные окна
  getDialogs: (state: UiSlice) => Array.from(state.dialogs.values()),
  getDialog: (id: string) => (state: UiSlice) => state.dialogs.get(id),
  getOpenDialogs: (state: UiSlice) => 
    Array.from(state.dialogs.values()).filter(d => d.isOpen),
  hasOpenDialogs: (state: UiSlice) => 
    Array.from(state.dialogs.values()).some(d => d.isOpen),
  
  // Уведомления
  getNotifications: (state: UiSlice) => state.notifications,
  getToasts: (state: UiSlice) => state.toasts,
  hasNotifications: (state: UiSlice) => state.notifications.length > 0,
  hasToasts: (state: UiSlice) => state.toasts.length > 0,
  
  // Загрузчики
  getLoaders: (state: UiSlice) => Array.from(state.loaders.values()),
  getLoader: (id: string) => (state: UiSlice) => state.loaders.get(id),
  isLoading: (id?: string) => (state: UiSlice) => {
    if (id) {
      const loader = state.loaders.get(id)
      return loader?.isLoading || false
    }
    return Array.from(state.loaders.values()).some(l => l.isLoading)
  },
  
  // Подтверждения
  getConfirmations: (state: UiSlice) => state.confirmations,
  hasConfirmations: (state: UiSlice) => state.confirmations.length > 0,
  
  // Темы
  getTheme: (state: UiSlice) => state.theme,
  getDensity: (state: UiSlice) => state.density,
  getFontSize: (state: UiSlice) => state.fontSize,
  isReducedMotion: (state: UiSlice) => state.reducedMotion,
  
  // Формы
  getFormState: (id: string) => (state: UiSlice) => state.formStates.get(id),
  isFormDirty: (id: string) => (state: UiSlice) => {
    const form = state.formStates.get(id)
    return form?.isDirty || false
  },
  isFormValid: (id: string) => (state: UiSlice) => {
    const form = state.formStates.get(id)
    return form?.isValid !== false
  },
  isFormSubmitting: (id: string) => (state: UiSlice) => {
    const form = state.formStates.get(id)
    return form?.isSubmitting || false
  },
  getFormErrors: (id: string) => (state: UiSlice) => {
    const form = state.formStates.get(id)
    return form?.errors || {}
  },
  
  // Доступность
  getFocusedElement: (state: UiSlice) => state.focusedElement,
  isSkipLinksEnabled: (state: UiSlice) => state.skipLinks,
  isHighContrast: (state: UiSlice) => state.highContrast,
  
  // Производительность
  isPerformanceMode: (state: UiSlice) => state.performanceMode,
  isDebugMode: (state: UiSlice) => state.debugMode,
  
  // Отзывчивость
  isMobile: (state: UiSlice) => state.isMobile,
  getScreenSize: (state: UiSlice) => state.screenSize,
  getOrientation: (state: UiSlice) => state.orientation,
  isSmallScreen: (state: UiSlice) => ['xs', 'sm'].includes(state.screenSize),
  isLargeScreen: (state: UiSlice) => ['lg', 'xl'].includes(state.screenSize),
  
  // Производные данные
  getActiveNotificationsCount: (state: UiSlice) => 
    state.notifications.filter(n => !n.autoClose).length,
  
  getTotalLoadersCount: (state: UiSlice) => 
    Array.from(state.loaders.values()).filter(l => l.isLoading).length,
  
  hasAnyModal: (state: UiSlice) => 
    Array.from(state.dialogs.values()).some(d => d.isOpen) ||
    state.confirmations.length > 0,
  
  getUIStats: (state: UiSlice) => ({
    dialogs: state.dialogs.size,
    openDialogs: Array.from(state.dialogs.values()).filter(d => d.isOpen).length,
    notifications: state.notifications.length,
    toasts: state.toasts.length,
    loaders: state.loaders.size,
    activeLoaders: Array.from(state.loaders.values()).filter(l => l.isLoading).length,
    confirmations: state.confirmations.length,
    forms: state.formStates.size
  })
}
