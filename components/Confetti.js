'use client'

import { useEffect, useRef } from 'react'

export default function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const particles = []
    
    // Интерактивность
    let mouseX = 0
    let mouseY = 0
    let isMouseDown = false
    let touchStartX = 0
    let touchStartY = 0
    
    // Настраиваемые параметры конфетти
    const config = {
      // Размер частиц (в пикселях)
      particleSize: { min: 3, max: 16 },
      
      // Плотность потока (количество частиц)
      particleCount: 100,
      
      // Интенсивность падения (скорость)
      fallSpeed: { min: 0.5, max: 4 },
      
      // Цвета конфетти
      colors: [
        '#F94402', // оранжевый
        '#F28705', // голубой
        '#FFCE00', // мятный
        '#F2F0E4', // желтый
        '#818B89', // сливовый
        '#B588C0', // золотой
      ],
      
      // Ветер (горизонтальное движение)
      wind: { min: -0.5, max: 0.5 },
      
      // Вращение частиц
      rotation: { min: -0.02, max: 0.04 },
      
      // Интерактивность
      interactionRadius: 80, // Радиус влияния курсора
      interactionStrength: 1.5,  // Сила отталкивания
      
      // Отскок от краев
      bounceStrength: 0.7 // Сила отскока (0-1)
    }

    // Класс частицы конфетти
    class Particle {
      constructor() {
        this.reset()
      }

      reset() {
        // Конфетти появляются по всему экрану
        this.x = Math.random() * canvas.width
        this.y = -10 - Math.random() * 50 // Случайная позиция выше экрана
        this.size = Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min
        this.speedY = Math.random() * (config.fallSpeed.max - config.fallSpeed.min) + config.fallSpeed.min
        this.speedX = Math.random() * (config.wind.max - config.wind.min) + config.wind.min
        this.rotationSpeed = Math.random() * 0.02 - 0.01
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)]
        this.opacity = Math.random() * 0.6 + 0.4
        this.angle = Math.random() * Math.PI * 2
        this.originalSpeedX = this.speedX
        this.originalSpeedY = this.speedY
        this.width = this.size * 2 // Вытянутый прямоугольник
        this.height = this.size
        this.shouldBounce = Math.random() > 0.5 // 50% частиц отскакивают
      }

      update() {
        // Интерактивность с курсором
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < config.interactionRadius) {
          const force = (config.interactionRadius - distance) / config.interactionRadius
          const angle = Math.atan2(dy, dx)
          
          // Отталкивание от курсора
          this.speedX = this.originalSpeedX - Math.cos(angle) * force * config.interactionStrength
          this.speedY = this.originalSpeedY - Math.sin(angle) * force * config.interactionStrength
        } else {
          // Возврат к нормальной скорости
          this.speedX += (this.originalSpeedX - this.speedX) * 0.1
          this.speedY += (this.originalSpeedY - this.speedY) * 0.1
        }

        this.y += this.speedY
        this.x += this.speedX
        this.angle += this.rotationSpeed

        // Отскок от краев (только для частиц, которые должны отскакивать)
        if (this.shouldBounce) {
          // Отскок от левого края
          if (this.x - this.width / 2 <= 0) {
            this.x = this.width / 2
            this.speedX = Math.abs(this.speedX) * config.bounceStrength
          }
          
          // Отскок от правого края
          if (this.x + this.width / 2 >= canvas.width) {
            this.x = canvas.width - this.width / 2
            this.speedX = -Math.abs(this.speedX) * config.bounceStrength
          }
        }

        // Если частица вышла за пределы экрана, сбрасываем её
        if (this.y > canvas.height + 10 || this.x < -10 || this.x > canvas.width + 10) {
          this.reset()
        }
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.globalAlpha = this.opacity
        
        ctx.fillStyle = this.color
        
        // Рисуем вытянутый прямоугольник
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)
        
        ctx.restore()
      }
    }

    // Создаем частицы
    for (let i = 0; i < config.particleCount; i++) {
      const particle = new Particle()
      // Устанавливаем начальную позицию за пределами экрана
      particle.x = Math.random() * canvas.width
      particle.y = -20 - Math.random() * 1600 // Случайная позиция выше экрана
      particles.push(particle)
    }

    // Обработчики событий мыши
    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    function handleMouseDown() {
      isMouseDown = true
    }

    function handleMouseUp() {
      isMouseDown = false
    }

    // Обработчики событий касания
    function handleTouchStart(e) {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      touchStartX = touch.clientX - rect.left
      touchStartY = touch.clientY - rect.top
      mouseX = touchStartX
      mouseY = touchStartY
      isMouseDown = true
    }

    function handleTouchMove(e) {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      mouseX = touch.clientX - rect.left
      mouseY = touch.clientY - rect.top
    }

    function handleTouchEnd(e) {
      e.preventDefault()
      isMouseDown = false
    }

    // Функция анимации
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })
      
      requestAnimationFrame(animate)
    }

    // Устанавливаем размер canvas
    function resizeCanvas() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    
    // Добавляем обработчики событий
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('resize', resizeCanvas)
    
    // Запускаем анимацию
    animate()

    // Очистка при размонтировании
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ background: 'transparent', position: "fixed" , zIndex: 1 }}
    />
  )
} 