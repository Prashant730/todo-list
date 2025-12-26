import { describe, it, expect } from 'vitest'
import {
  validateTask,
  validateApiKey,
  sanitizeInput,
} from '../../utils/validation'

describe('Validation Utils', () => {
  describe('validateTask', () => {
    it('should validate a correct task', () => {
      const task = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high',
        dueDate: '2024-12-31T12:00',
        recurring: 'daily',
        tags: ['test', 'valid'],
      }

      const result = validateTask(task)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject task without title', () => {
      const task = { title: '' }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBe('Title is required')
    })

    it('should reject task with title too long', () => {
      const task = { title: 'a'.repeat(201) }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBe('Title must be less than 200 characters')
    })

    it('should reject task with description too long', () => {
      const task = {
        title: 'Valid title',
        description: 'a'.repeat(1001),
      }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.description).toBe(
        'Description must be less than 1000 characters'
      )
    })

    it('should reject task with invalid priority', () => {
      const task = {
        title: 'Valid title',
        priority: 'invalid',
      }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.priority).toBe('Invalid priority level')
    })

    it('should reject task with invalid recurring option', () => {
      const task = {
        title: 'Valid title',
        recurring: 'invalid',
      }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.recurring).toBe('Invalid recurring option')
    })

    it('should reject task with too many tags', () => {
      const task = {
        title: 'Valid title',
        tags: Array(11).fill('tag'),
      }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.tags).toBe('Maximum 10 tags allowed')
    })

    it('should reject task with invalid tag format', () => {
      const task = {
        title: 'Valid title',
        tags: ['valid', 123, 'a'.repeat(51)],
      }
      const result = validateTask(task)

      expect(result.isValid).toBe(false)
      expect(result.errors.tags).toBe(
        'Tags must be strings with less than 50 characters'
      )
    })
  })

  describe('validateApiKey', () => {
    it('should validate correct Google API key', () => {
      const result = validateApiKey('AIzaSyDemoKey123456789')
      expect(result.isValid).toBe(true)
    })

    it('should reject empty API key', () => {
      const result = validateApiKey('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key is required')
    })

    it('should reject non-string API key', () => {
      const result = validateApiKey(123)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key must be a string')
    })

    it('should reject too short API key', () => {
      const result = validateApiKey('short')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('API key appears to be too short')
    })

    it('should reject invalid Google API key format', () => {
      const result = validateApiKey('InvalidKeyFormat123456789')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid Google API key format')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    it('should remove HTML tags', () => {
      expect(sanitizeInput('test<script>alert("xss")</script>')).toBe(
        'testscriptalert("xss")/script'
      )
    })

    it('should not limit length (validation handles this)', () => {
      const longString = 'a'.repeat(1500)
      const result = sanitizeInput(longString)
      expect(result.length).toBe(1500) // No truncation in sanitizeInput
    })

    it('should handle non-string input', () => {
      expect(sanitizeInput(123)).toBe(123)
      expect(sanitizeInput(null)).toBe(null)
      expect(sanitizeInput(undefined)).toBe(undefined)
    })
  })
})
