'use client'

import { Minus, Plus } from 'lucide-react'

interface NumberInputProps {
  label: string
  name: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  error?: string
}

export default function NumberInput({
  label,
  name,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  error
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue)) {
      onChange(newValue)
    }
  }
  
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + step)
    }
  }
  
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - step)
    }
  }
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
        {label}
      </label>
      
      <div className="flex">
        <button
          type="button"
          className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus size={16} />
        </button>
        
        <input
          type="number"
          name={name}
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={`w-20 px-3 py-2 border-y text-center focus:outline-none ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        
        <button
          type="button"
          className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus size={16} />
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}