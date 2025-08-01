'use client'

import { useState, useEffect } from 'react'

export default function Notification({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warning':
        return '!'
      case 'info':
        return 'i'
      default:
        return '✓'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10B981' // зеленый
      case 'error':
        return '#EF4444' // красный
      case 'warning':
        return '#F59E0B' // желтый
      case 'info':
        return '#3B82F6' // синий
      default:
        return '#10B981'
    }
  }

  return (
    <div 
      className={`notification ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      style={{ transition: 'all 0.3s ease' }}
    >
      <div className="flex items-center">
        <span 
          className="mr-3 text-lg font-bold"
          style={{ color: getIconColor() }}
        >
          {getIcon()}
        </span>
        <span className="font-medium">{message}</span>
        <button 
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="ml-4 text-gray-300 hover:text-white transition-colors duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  )
} 