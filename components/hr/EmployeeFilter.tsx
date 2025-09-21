'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown, Users, Briefcase, Award, Clock } from 'lucide-react'
import { HREmployeeFilters, getUniqueDepartments, getUniquePositions, getUniqueLevels, getPopularSkills } from '@/mocks/users'

interface EmployeeFilterProps {
  onFiltersChange: (filters: HREmployeeFilters) => void
  totalEmployees: number
  filteredCount: number
}

const EmployeeFilter: React.FC<EmployeeFilterProps> = ({
  onFiltersChange,
  totalEmployees,
  filteredCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<HREmployeeFilters>({})
  const [skillInput, setSkillInput] = useState('')
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)
  
  // Данные для селектов
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [levels, setLevels] = useState<string[]>([])
  const [popularSkills, setPopularSkills] = useState<string[]>([])

  useEffect(() => {
    setDepartments(getUniqueDepartments())
    setPositions(getUniquePositions())
    setLevels(getUniqueLevels())
    setPopularSkills(getPopularSkills())
  }, [])

  const updateFilters = (newFilters: Partial<HREmployeeFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setSkillInput('')
    onFiltersChange({})
  }

  const addSkill = (skill: string) => {
    if (skill && !filters.skills?.includes(skill)) {
      const newSkills = [...(filters.skills || []), skill]
      updateFilters({ skills: newSkills })
    }
    setSkillInput('')
    setShowSkillSuggestions(false)
  }

  const removeSkill = (skillToRemove: string) => {
    const newSkills = filters.skills?.filter(skill => skill !== skillToRemove) || []
    updateFilters({ skills: newSkills.length > 0 ? newSkills : undefined })
  }

  const filteredSkillSuggestions = popularSkills.filter(skill =>
    skill.toLowerCase().includes(skillInput.toLowerCase()) &&
    !filters.skills?.includes(skill)
  )

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof HREmployeeFilters]
    return value !== undefined && value !== '' && value !== 'all' && 
           (Array.isArray(value) ? value.length > 0 : true)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Основная строка поиска */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени, должности, отделу или навыкам..."
              value={filters.query || ''}
              onChange={(e) => updateFilters({ query: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
              hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Фильтры</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.keys(filters).filter(key => {
                  const value = filters[key as keyof HREmployeeFilters]
                  return value !== undefined && value !== '' && value !== 'all' && 
                         (Array.isArray(value) ? value.length > 0 : true)
                }).length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
              <span>Очистить</span>
            </button>
          )}
        </div>
        
        {/* Счетчик результатов */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            Показано <span className="font-semibold text-gray-900">{filteredCount}</span> из{' '}
            <span className="font-semibold text-gray-900">{totalEmployees}</span> сотрудников
          </span>
        </div>
      </div>

      {/* Расширенные фильтры */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Отдел */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Отдел
              </label>
              <select
                value={filters.department || 'all'}
                onChange={(e) => updateFilters({ department: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Все отделы</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Должность */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-1" />
                Должность
              </label>
              <select
                value={filters.position || 'all'}
                onChange={(e) => updateFilters({ position: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Все должности</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* Уровень */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Уровень
              </label>
              <select
                value={filters.level || 'all'}
                onChange={(e) => updateFilters({ level: e.target.value === 'all' ? undefined : e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">Все уровни</option>
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Опыт работы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Опыт работы (лет)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="От"
                  min="0"
                  max="50"
                  value={filters.minExperience || ''}
                  onChange={(e) => updateFilters({ minExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="До"
                  min="0"
                  max="50"
                  value={filters.maxExperience || ''}
                  onChange={(e) => updateFilters({ maxExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Навыки */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Навыки
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Добавить навык..."
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value)
                  setShowSkillSuggestions(e.target.value.length > 0)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && skillInput.trim()) {
                    addSkill(skillInput.trim())
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* Автокомплит навыков */}
              {showSkillSuggestions && filteredSkillSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSkillSuggestions.slice(0, 8).map(skill => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors duration-150"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Выбранные навыки */}
            {filters.skills && filters.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {filters.skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-blue-600 transition-colors duration-150"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Дополнительные фильтры */}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isActive === true}
                onChange={(e) => updateFilters({ isActive: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Только активные сотрудники</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availableForRotation === true}
                onChange={(e) => updateFilters({ availableForRotation: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Готовы к ротации</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeFilter