import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseStyles = "w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  const stateStyles = error
    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
    : disabled
      ? "bg-gray-100 border-gray-300 cursor-not-allowed"
      : "border-gray-300 hover:border-gray-400"

  const inputStyles = `${baseStyles} ${stateStyles} ${className}`

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        disabled={disabled}
        className={inputStyles}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input