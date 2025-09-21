// Простой сервис для работы с JSON базой данных
import fs from 'fs/promises'
import path from 'path'

// Интерфейс базы данных
interface Database {
  users: any[]
  profiles: any[]
  skills: any[]
  roles: any[]
  vacancies: any[]
  quests: any[]
  badges: any[]
  userQuests: any[]
  userBadges: any[]
  candidateMatches: any[]
  chatSessions: any[]
  settings: {
    completenessThreshold: number
    skillLevelWeights: Record<string, number>
    competencyWeights: Record<string, number>
  }
  metadata: {
    version: string
    lastUpdated: string | null
    initialized: boolean
  }
}

// Путь к файлу базы данных
const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

// Класс для работы с базой данных
export class DataService {
  private static instance: DataService
  private cache: Database | null = null

  constructor() {
    this.ensureDbExists()
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  // Убеждаемся, что файл базы данных существует
  private async ensureDbExists(): Promise<void> {
    try {
      await fs.access(DB_PATH)
    } catch (error) {
      // Файл не существует, создаем его
      await this.initializeDatabase()
    }
  }

  // Инициализация базы данных
  private async initializeDatabase(): Promise<void> {
    const initialData: Database = {
      users: [],
      profiles: [],
      skills: [],
      roles: [],
      vacancies: [],
      quests: [],
      badges: [],
      userQuests: [],
      userBadges: [],
      candidateMatches: [],
      chatSessions: [],
      settings: {
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
        }
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        initialized: true
      }
    }

    // Создаем директорию если не существует
    const dataDir = path.dirname(DB_PATH)
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8')
    this.cache = initialData
  }

  // Чтение базы данных
  async readDatabase(): Promise<Database> {
    try {
      if (this.cache) {
        return this.cache
      }

      const data = await fs.readFile(DB_PATH, 'utf-8')
      const db = JSON.parse(data) as Database
      this.cache = db
      return db
    } catch (error) {
      console.error('Ошибка чтения базы данных:', error)
      await this.initializeDatabase()
      return this.cache!
    }
  }

  // Запись базы данных
  async writeDatabase(data: Database): Promise<void> {
    try {
      data.metadata.lastUpdated = new Date().toISOString()
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
      this.cache = data
    } catch (error) {
      console.error('Ошибка записи базы данных:', error)
      throw error
    }
  }

  // === CRUD ОПЕРАЦИИ ===

  // Получение всех записей из таблицы
  async getAll<T>(tableName: keyof Omit<Database, 'settings' | 'metadata'>): Promise<T[]> {
    const db = await this.readDatabase()
    return db[tableName] as T[]
  }

  // Получение записи по ID
  async getById<T extends { id: string }>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, id: string): Promise<T | null> {
    const records = await this.getAll<T>(tableName)
    return records.find(record => record.id === id) || null
  }

  // Добавление записи
  async create<T extends { id: string }>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, record: T): Promise<T> {
    const db = await this.readDatabase()
    const table = db[tableName] as T[]
    
    // Проверяем уникальность ID
    if (table.some(r => r.id === record.id)) {
      throw new Error(`Запись с ID ${record.id} уже существует`)
    }
    
    table.push(record)
    await this.writeDatabase(db)
    return record
  }

  // Обновление записи
  async update<T extends { id: string }>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, id: string, updates: Partial<T>): Promise<T> {
    const db = await this.readDatabase()
    const table = db[tableName] as T[]
    
    const index = table.findIndex(record => record.id === id)
    if (index === -1) {
      throw new Error(`Запись с ID ${id} не найдена`)
    }
    
    table[index] = { ...table[index], ...updates }
    await this.writeDatabase(db)
    return table[index]
  }

  // Удаление записи
  async delete(tableName: keyof Omit<Database, 'settings' | 'metadata'>, id: string): Promise<void> {
    const db = await this.readDatabase()
    const table = db[tableName] as any[]
    
    const index = table.findIndex(record => record.id === id)
    if (index === -1) {
      throw new Error(`Запись с ID ${id} не найдена`)
    }
    
    table.splice(index, 1)
    await this.writeDatabase(db)
  }

  // Поиск с фильтрацией
  async findWhere<T>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, predicate: (item: T) => boolean): Promise<T[]> {
    const records = await this.getAll<T>(tableName)
    return records.filter(predicate)
  }

  // === НАСТРОЙКИ ===

  async getSettings(): Promise<Database['settings']> {
    const db = await this.readDatabase()
    return db.settings
  }

  async updateSettings(updates: Partial<Database['settings']>): Promise<Database['settings']> {
    const db = await this.readDatabase()
    db.settings = { ...db.settings, ...updates }
    await this.writeDatabase(db)
    return db.settings
  }

  // === СПЕЦИАЛИЗИРОВАННЫЕ МЕТОДЫ ===

  // Поиск профиля пользователя
  async getProfileByUserId(userId: string): Promise<any | null> {
    const profiles = await this.getAll('profiles')
    return profiles.find(profile => profile.userId === userId) || null
  }

  // Поиск вакансий по статусу
  async getVacanciesByStatus(status: string): Promise<any[]> {
    return this.findWhere('vacancies', (vacancy: any) => vacancy.status === status)
  }

  // Поиск активных квестов пользователя
  async getUserActiveQuests(userId: string): Promise<any[]> {
    return this.findWhere('userQuests', (quest: any) => 
      quest.userId === userId && quest.status === 'active'
    )
  }

  // Поиск матчей для вакансии
  async getMatchesForVacancy(vacancyId: string): Promise<any[]> {
    return this.findWhere('candidateMatches', (match: any) => match.vacancyId === vacancyId)
  }

  // Поиск сессий чата пользователя
  async getUserChatSessions(userId: string): Promise<any[]> {
    return this.findWhere('chatSessions', (session: any) => session.userId === userId)
  }

  // === МАССОВЫЕ ОПЕРАЦИИ ===

  // Создание нескольких записей
  async createMany<T extends { id: string }>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, records: T[]): Promise<T[]> {
    const db = await this.readDatabase()
    const table = db[tableName] as T[]
    
    // Проверяем уникальность ID
    const existingIds = new Set(table.map(r => r.id))
    for (const record of records) {
      if (existingIds.has(record.id)) {
        throw new Error(`Запись с ID ${record.id} уже существует`)
      }
    }
    
    table.push(...records)
    await this.writeDatabase(db)
    return records
  }

  // Обновление нескольких записей
  async updateMany<T extends { id: string }>(tableName: keyof Omit<Database, 'settings' | 'metadata'>, updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    const db = await this.readDatabase()
    const table = db[tableName] as T[]
    const updatedRecords: T[] = []
    
    for (const { id, data } of updates) {
      const index = table.findIndex(record => record.id === id)
      if (index !== -1) {
        table[index] = { ...table[index], ...data }
        updatedRecords.push(table[index])
      }
    }
    
    await this.writeDatabase(db)
    return updatedRecords
  }

  // === ТРАНЗАКЦИИ (УПРОЩЕННЫЕ) ===

  // Выполнение операций в транзакции
  async transaction<T>(operations: (db: Database) => Promise<T>): Promise<T> {
    const db = await this.readDatabase()
    
    try {
      const result = await operations(db)
      await this.writeDatabase(db)
      return result
    } catch (error) {
      // Откатываем изменения, заново читая базу
      this.cache = null
      throw error
    }
  }

  // === УТИЛИТЫ ===

  // Очистка кэша
  clearCache(): void {
    this.cache = null
  }

  // Получение статистики базы данных
  async getDatabaseStats(): Promise<Record<string, number>> {
    const db = await this.readDatabase()
    const stats: Record<string, number> = {}
    
    for (const [key, value] of Object.entries(db)) {
      if (Array.isArray(value)) {
        stats[key] = value.length
      }
    }
    
    return stats
  }

  // Резервное копирование
  async backup(backupPath?: string): Promise<string> {
    const db = await this.readDatabase()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = backupPath || path.join(process.cwd(), 'data', `backup-${timestamp}.json`)
    
    await fs.writeFile(backupFile, JSON.stringify(db, null, 2), 'utf-8')
    return backupFile
  }

  // Восстановление из резервной копии
  async restore(backupPath: string): Promise<void> {
    const backupData = await fs.readFile(backupPath, 'utf-8')
    const db = JSON.parse(backupData) as Database
    
    await this.writeDatabase(db)
  }

  // Сброс базы данных
  async reset(): Promise<void> {
    await this.initializeDatabase()
  }
}

// Singleton instance
export const dataService = DataService.getInstance()

// Вспомогательные функции для инициализации
export const initializeDatabase = async () => {
  const db = await dataService.readDatabase()
  
  if (!db.metadata.initialized) {
    // Добавляем базовые данные если нужно
    console.log('Инициализация базы данных...')
    
    // Можно добавить базовые навыки, роли и т.д.
    db.metadata.initialized = true
    await dataService.writeDatabase(db)
    
    console.log('База данных инициализирована')
  }
  
  return db
}

// Экспорт типов
export type { Database }
