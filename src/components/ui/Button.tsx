import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500"
  }

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${className}`

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles}
      {...props}
    >
      {children}
    </button>
  )
}