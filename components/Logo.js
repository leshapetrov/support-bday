'use client'

export default function Logo({ className = '' }) {
  return (
    <img
      src="/logo-x.svg"
      alt="Support Logo"
      className={`logo ${className}`}
    />
  )
}

