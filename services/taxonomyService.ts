// Сервис управления таксономией навыков и ролей
import { Skill, Role, RequiredSkill } from '@/types'
import { allMockSkills } from '@/mocks/skills'
import { baseRoles } from '@/config/roles'
import { skillCategories, competencyAreaMap } from '@/config/skills'

export class TaxonomyService {
  private skills: Skill[] = []
  private roles: Role[] = []
  
  constructor() {
    this.initializeData()
  }
  
  private initializeData() {
    // Инициализируем навыки
    this.skills = [...allMockSkills]
    
    // Инициализируем роли с ID
    this.roles = baseRoles.map((role, index) => ({
      ...role,
      id: `role-${index + 1}`,
      createdAt: new Date(2024, 0, 1 + index),
      updatedAt: new Date(2024, 8, 15 + (index % 30))
    }))
  }
  
  // === НАВЫКИ ===
  
  async getAllSkills(): Promise<Skill[]> {
    return this.skills
  }
  
  async getSkillById(id: string): Promise<Skill | null> {
    return this.skills.find(skill => skill.id === id) || null
  }
  
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return this.skills.filter(skill => skill.category === category)
  }
  
  async getSkillsByCompetencyArea(area: string): Promise<Skill[]> {
    return this.skills.filter(skill => skill.competencyArea === area)
  }
  
  async getCoreSkills(): Promise<Skill[]> {
    return this.skills.filter(skill => skill.isCore)
  }
  
  async searchSkills(query: string): Promise<Skill[]> {
    const lowercaseQuery = query.toLowerCase()
    return this.skills.filter(skill =>
      skill.name.toLowerCase().includes(lowercaseQuery) ||
      skill.description.toLowerCase().includes(lowercaseQuery) ||
      skill.category.toLowerCase().includes(lowercaseQuery)
    )
  }
  
  async createSkill(skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const newSkill: Skill = {
      ...skillData,
      id: `skill-${this.skills.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.skills.push(newSkill)
    
    // В реальной системе здесь был бы вызов API или сохранение в БД
    console.log(`Создан новый навык: ${newSkill.name}`)
    
    return newSkill
  }
  
  async updateSkill(id: string, updates: Partial<Skill>): Promise<Skill | null> {
    const skillIndex = this.skills.findIndex(skill => skill.id === id)
    
    if (skillIndex === -1) {
      return null
    }
    
    this.skills[skillIndex] = {
      ...this.skills[skillIndex],
      ...updates,
      updatedAt: new Date(),
      version: this.skills[skillIndex].version + 1
    }
    
    console.log(`Обновлен навык: ${this.skills[skillIndex].name}`)
    
    return this.skills[skillIndex]
  }
  
  async deleteSkill(id: string): Promise<boolean> {
    const skillIndex = this.skills.findIndex(skill => skill.id === id)
    
    if (skillIndex === -1) {
      return false
    }
    
    // Проверяем, используется ли навык в ролях
    const usedInRoles = this.roles.some(role =>
      [...role.requiredSkills, ...role.preferredSkills].some(rs => rs.skillId === id)
    )
    
    if (usedInRoles) {
      throw new Error('Навык используется в ролях и не может быть удален')
    }
    
    const deletedSkill = this.skills.splice(skillIndex, 1)[0]
    console.log(`Удален навык: ${deletedSkill.name}`)
    
    return true
  }
  
  async getSkillCategories(): Promise<Record<string, string>> {
    return skillCategories
  }
  
  async getSkillsHierarchy(): Promise<Record<string, Skill[]>> {
    const hierarchy: Record<string, Skill[]> = {}
    
    Object.keys(skillCategories).forEach(category => {
      hierarchy[category] = this.skills.filter(skill => skill.category === category)
    })
    
    return hierarchy
  }
  
  async getRelatedSkills(skillId: string): Promise<Skill[]> {
    const skill = await this.getSkillById(skillId)
    if (!skill) return []
    
    return this.skills.filter(s => 
      skill.relatedSkills.includes(s.id) || s.relatedSkills.includes(skillId)
    )
  }
  
  async suggestSkillsForRole(roleTitle: string, department: string): Promise<Skill[]> {
    // Простая логика предложения навыков на основе роли и отдела
    const suggestions: Skill[] = []
    
    // Навыки по отделу
    if (department === 'Engineering') {
      suggestions.push(...this.skills.filter(s => 
        ['programming', 'devops', 'databases'].includes(s.category)
      ))
    } else if (department === 'Data') {
      suggestions.push(...this.skills.filter(s => 
        ['ai-ml', 'data-analysis', 'programming'].includes(s.category)
      ))
    } else if (department === 'Product') {
      suggestions.push(...this.skills.filter(s => 
        ['project-management', 'business-analysis', 'communication'].includes(s.category)
      ))
    } else if (department === 'Design') {
      suggestions.push(...this.skills.filter(s => 
        s.competencyArea === 'creative'
      ))
    }
    
    // Навыки по уровню роли
    if (roleTitle.toLowerCase().includes('senior') || roleTitle.toLowerCase().includes('lead')) {
      suggestions.push(...this.skills.filter(s => 
        s.competencyArea === 'leadership'
      ))
    }
    
    // Убираем дубликаты и ограничиваем количество
    const uniqueSuggestions = suggestions.filter((skill, index, self) =>
      index === self.findIndex(s => s.id === skill.id)
    )
    
    return uniqueSuggestions.slice(0, 15)
  }
  
  // === РОЛИ ===
  
  async getAllRoles(): Promise<Role[]> {
    return this.roles
  }
  
  async getRoleById(id: string): Promise<Role | null> {
    return this.roles.find(role => role.id === id) || null
  }
  
  async getRolesByDepartment(department: string): Promise<Role[]> {
    return this.roles.filter(role => role.department === department)
  }
  
  async getRolesByLevel(level: string): Promise<Role[]> {
    return this.roles.filter(role => role.level === level)
  }
  
  async getActiveRoles(): Promise<Role[]> {
    return this.roles.filter(role => role.isActive)
  }
  
  async searchRoles(query: string): Promise<Role[]> {
    const lowercaseQuery = query.toLowerCase()
    return this.roles.filter(role =>
      role.title.toLowerCase().includes(lowercaseQuery) ||
      role.description.toLowerCase().includes(lowercaseQuery) ||
      role.department.toLowerCase().includes(lowercaseQuery)
    )
  }
  
  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const newRole: Role = {
      ...roleData,
      id: `role-${this.roles.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.roles.push(newRole)
    
    console.log(`Создана новая роль: ${newRole.title}`)
    
    return newRole
  }
  
  async updateRole(id: string, updates: Partial<Role>): Promise<Role | null> {
    const roleIndex = this.roles.findIndex(role => role.id === id)
    
    if (roleIndex === -1) {
      return null
    }
    
    this.roles[roleIndex] = {
      ...this.roles[roleIndex],
      ...updates,
      updatedAt: new Date(),
      version: this.roles[roleIndex].version + 1
    }
    
    console.log(`Обновлена роль: ${this.roles[roleIndex].title}`)
    
    return this.roles[roleIndex]
  }
  
  async deleteRole(id: string): Promise<boolean> {
    const roleIndex = this.roles.findIndex(role => role.id === id)
    
    if (roleIndex === -1) {
      return false
    }
    
    const deletedRole = this.roles.splice(roleIndex, 1)[0]
    console.log(`Удалена роль: ${deletedRole.title}`)
    
    return true
  }
  
  async cloneRole(id: string, newTitle: string): Promise<Role | null> {
    const originalRole = await this.getRoleById(id)
    if (!originalRole) {
      return null
    }
    
    const clonedRole = await this.createRole({
      ...originalRole,
      title: newTitle,
      owner: 'system',
      version: 1
    })
    
    return clonedRole
  }
  
  // === АНАЛИЗ И ВАЛИДАЦИЯ ===
  
  async validateRole(role: Role): Promise<string[]> {
    const errors: string[] = []
    
    // Проверяем обязательные поля
    if (!role.title.trim()) {
      errors.push('Название роли обязательно')
    }
    
    if (!role.description.trim()) {
      errors.push('Описание роли обязательно')
    }
    
    if (!role.department.trim()) {
      errors.push('Отдел обязателен')
    }
    
    // Проверяем навыки
    if (role.requiredSkills.length === 0) {
      errors.push('Должен быть указан хотя бы один обязательный навык')
    }
    
    // Проверяем, что все навыки существуют
    const allSkillIds = [...role.requiredSkills, ...role.preferredSkills].map(rs => rs.skillId)
    for (const skillId of allSkillIds) {
      const skill = await this.getSkillById(skillId)
      if (!skill) {
        errors.push(`Навык с ID ${skillId} не найден`)
      }
    }
    
    // Проверяем веса навыков
    const invalidWeights = [...role.requiredSkills, ...role.preferredSkills]
      .filter(rs => rs.weight < 0 || rs.weight > 1)
    
    if (invalidWeights.length > 0) {
      errors.push('Веса навыков должны быть от 0 до 1')
    }
    
    // Проверяем зарплатную вилку
    if (role.salaryRange && role.salaryRange.min >= role.salaryRange.max) {
      errors.push('Минимальная зарплата должна быть меньше максимальной')
    }
    
    return errors
  }
  
  async analyzeRoleComplexity(roleId: string): Promise<{
    complexity: 'low' | 'medium' | 'high' | 'expert'
    factors: string[]
    score: number
  }> {
    const role = await this.getRoleById(roleId)
    if (!role) {
      throw new Error('Роль не найдена')
    }
    
    let score = 0
    const factors: string[] = []
    
    // Количество обязательных навыков
    const requiredCount = role.requiredSkills.length
    if (requiredCount >= 8) {
      score += 30
      factors.push('Большое количество обязательных навыков')
    } else if (requiredCount >= 5) {
      score += 20
    } else if (requiredCount >= 3) {
      score += 10
    }
    
    // Критичные навыки
    const criticalSkills = role.requiredSkills.filter(rs => rs.isCritical)
    if (criticalSkills.length >= 3) {
      score += 25
      factors.push('Много критичных навыков')
    } else if (criticalSkills.length >= 2) {
      score += 15
    }
    
    // Уровень роли
    const levelScore = {
      'junior': 5,
      'middle': 15,
      'senior': 25,
      'lead': 35,
      'principal': 40
    }
    score += levelScore[role.level] || 10
    
    if (role.level === 'senior' || role.level === 'lead' || role.level === 'principal') {
      factors.push('Высокий уровень роли')
    }
    
    // Лидерские навыки
    const leadershipSkills = await Promise.all(
      role.requiredSkills.map(async rs => {
        const skill = await this.getSkillById(rs.skillId)
        return skill?.competencyArea === 'leadership'
      })
    )
    
    if (leadershipSkills.filter(Boolean).length >= 2) {
      score += 20
      factors.push('Требует лидерские навыки')
    }
    
    // Определяем сложность
    let complexity: 'low' | 'medium' | 'high' | 'expert'
    if (score >= 80) {
      complexity = 'expert'
    } else if (score >= 60) {
      complexity = 'high'
    } else if (score >= 40) {
      complexity = 'medium'
    } else {
      complexity = 'low'
    }
    
    return { complexity, factors, score }
  }
  
  async getSkillGaps(): Promise<{
    category: string
    missingSkills: string[]
    lowCoverage: string[]
  }[]> {
    const gaps: Array<{
      category: string
      missingSkills: string[]
      lowCoverage: string[]
    }> = []
    
    // Анализируем каждую категорию навыков
    for (const [categoryKey, categoryName] of Object.entries(skillCategories)) {
      const categorySkills = this.skills.filter(s => s.category === categoryKey)
      const rolesUsingCategory = this.roles.filter(role =>
        [...role.requiredSkills, ...role.preferredSkills].some(rs => {
          const skill = this.skills.find(s => s.id === rs.skillId)
          return skill?.category === categoryKey
        })
      )
      
      const missingSkills: string[] = []
      const lowCoverage: string[] = []
      
      // Проверяем покрытие навыков
      categorySkills.forEach(skill => {
        const usageCount = rolesUsingCategory.filter(role =>
          [...role.requiredSkills, ...role.preferredSkills].some(rs => rs.skillId === skill.id)
        ).length
        
        if (usageCount === 0) {
          missingSkills.push(skill.name)
        } else if (usageCount < 2) {
          lowCoverage.push(skill.name)
        }
      })
      
      if (missingSkills.length > 0 || lowCoverage.length > 0) {
        gaps.push({
          category: categoryName,
          missingSkills,
          lowCoverage
        })
      }
    }
    
    return gaps
  }
  
  async getDuplicateRoles(): Promise<Array<{
    roles: Role[]
    similarity: number
    reason: string
  }>> {
    const duplicates: Array<{
      roles: Role[]
      similarity: number
      reason: string
    }> = []
    
    // Сравниваем каждую пару ролей
    for (let i = 0; i < this.roles.length; i++) {
      for (let j = i + 1; j < this.roles.length; j++) {
        const role1 = this.roles[i]
        const role2 = this.roles[j]
        
        const similarity = await this.calculateRoleSimilarity(role1, role2)
        
        if (similarity >= 0.8) {
          duplicates.push({
            roles: [role1, role2],
            similarity,
            reason: this.getSimilarityReason(role1, role2)
          })
        }
      }
    }
    
    return duplicates
  }
  
  private async calculateRoleSimilarity(role1: Role, role2: Role): Promise<number> {
    // Простой алгоритм расчета схожести ролей
    let similarity = 0
    
    // Схожесть по отделу
    if (role1.department === role2.department) {
      similarity += 0.3
    }
    
    // Схожесть по уровню
    if (role1.level === role2.level) {
      similarity += 0.2
    }
    
    // Схожесть по навыкам
    const skills1 = [...role1.requiredSkills, ...role1.preferredSkills].map(rs => rs.skillId)
    const skills2 = [...role2.requiredSkills, ...role2.preferredSkills].map(rs => rs.skillId)
    
    const commonSkills = skills1.filter(skillId => skills2.includes(skillId))
    const skillsSimilarity = commonSkills.length / Math.max(skills1.length, skills2.length)
    
    similarity += skillsSimilarity * 0.5
    
    return similarity
  }
  
  private getSimilarityReason(role1: Role, role2: Role): string {
    const reasons: string[] = []
    
    if (role1.department === role2.department) {
      reasons.push('одинаковый отдел')
    }
    
    if (role1.level === role2.level) {
      reasons.push('одинаковый уровень')
    }
    
    const skills1 = [...role1.requiredSkills, ...role1.preferredSkills].map(rs => rs.skillId)
    const skills2 = [...role2.requiredSkills, ...role2.preferredSkills].map(rs => rs.skillId)
    const commonSkills = skills1.filter(skillId => skills2.includes(skillId))
    
    if (commonSkills.length >= 3) {
      reasons.push('много общих навыков')
    }
    
    return reasons.join(', ')
  }
  
  // === ЭКСПОРТ/ИМПОРТ ===
  
  async exportTaxonomy(): Promise<{
    skills: Skill[]
    roles: Role[]
    exportDate: Date
    version: string
  }> {
    return {
      skills: this.skills,
      roles: this.roles,
      exportDate: new Date(),
      version: '1.0.0'
    }
  }
  
  async importTaxonomy(data: {
    skills: Skill[]
    roles: Role[]
  }): Promise<{
    imported: { skills: number; roles: number }
    skipped: { skills: number; roles: number }
    errors: string[]
  }> {
    const result = {
      imported: { skills: 0, roles: 0 },
      skipped: { skills: 0, roles: 0 },
      errors: [] as string[]
    }
    
    // Импорт навыков
    for (const skill of data.skills) {
      const existing = this.skills.find(s => s.name === skill.name)
      if (existing) {
        result.skipped.skills++
      } else {
        try {
          await this.createSkill(skill)
          result.imported.skills++
        } catch (error) {
          result.errors.push(`Ошибка импорта навыка ${skill.name}: ${error}`)
        }
      }
    }
    
    // Импорт ролей
    for (const role of data.roles) {
      const existing = this.roles.find(r => r.title === role.title && r.department === role.department)
      if (existing) {
        result.skipped.roles++
      } else {
        try {
          await this.createRole(role)
          result.imported.roles++
        } catch (error) {
          result.errors.push(`Ошибка импорта роли ${role.title}: ${error}`)
        }
      }
    }
    
    return result
  }
}

// Синглтон сервиса
let taxonomyServiceInstance: TaxonomyService | null = null

export function getTaxonomyService(): TaxonomyService {
  if (!taxonomyServiceInstance) {
    taxonomyServiceInstance = new TaxonomyService()
  }
  return taxonomyServiceInstance
}
