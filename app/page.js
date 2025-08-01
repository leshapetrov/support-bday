'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '../components/Logo'
import Confetti from '../components/Confetti'

export default function HomePage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleCreateRoom = () => {
    setIsGenerating(true)
    const roomId = generateRoomId()
    
    // Небольшая задержка для анимации
    setTimeout(() => {
      router.push(`/collage/${roomId}`)
    }, 500)
  }

  return (
    <div className="home-container">
      <Confetti />
      <div className="home-content fade-in">
        <div className="home-logo">
          <Logo className="logo-large" />
        </div>
        
        <div className="home-title">
          <h1>
            Нам стукнуло 9 лет. Спасибо,<br />
            что в этот момент вы с нами!<br />
            Запечатлим его вместе?
          </h1>
        </div>
        
        <div>
          <button
            onClick={handleCreateRoom}
            disabled={isGenerating}
            className="home-button"
          >
            {isGenerating ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                создаю фотобудку...
              </div>
            ) : (
              'запечатлить момент'
            )}
          </button>
        </div>
      
        
        <div className="home-instructions">
          <p>Для магии понадобится ПК с вебкой,</p>
          <p>макбук или телефон.</p>
        </div>
      </div>
    </div>
  )
}
