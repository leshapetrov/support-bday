'use client'

import { createContext, useContext, useState } from 'react'
import Notification from './Notification'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    const newNotification = { id, message, type, duration }
    
    setNotifications(prev => [...prev, newNotification])
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const showSuccess = (message, duration) => showNotification(message, 'success', duration)
  const showError = (message, duration) => showNotification(message, 'error', duration)
  const showWarning = (message, duration) => showNotification(message, 'warning', duration)
  const showInfo = (message, duration) => showNotification(message, 'info', duration)


  return (
    <NotificationContext.Provider value={{ showNotification, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 