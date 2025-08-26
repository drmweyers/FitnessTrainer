'use client'

interface TextInputProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  showCharCount?: boolean
  error?: string
}

export default function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  maxLength,
  showCharCount = false,
  error
}: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      
      <div className="flex justify-between mt-1">
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        {showCharCount && maxLength && (
          <p className={`text-xs ${value.length > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}