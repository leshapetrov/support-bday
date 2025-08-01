'use client'

export default function Logo({ className = '' }) {
  return (
    <img
      src="/logo-x.svg"
      alt="Support Logo"
      className={`w-24 h-24 md:w-32 md:h-32 ${className}`}
    />
  )
}
