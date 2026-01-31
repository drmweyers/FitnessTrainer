'use client'

import { ChevronDown } from 'lucide-react'

interface Option {
  value: string | boolean | number
  label: string
}

interface DropdownSelectProps {
  label: string
  name: string
  value: string | boolean | number
  onChange: (value: string | boolean | number) => void
  options: Option[]
  error?: string
}

export default function DropdownSelect({
  label,
  name,
  value,
  onChange,
  options,
  error
}: DropdownSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Convert value to appropriate type
    let selectedValue: string | boolean | number = e.target.value
    
    // Handle boolean values
    if (selectedValue === 'true') selectedValue = true
    if (selectedValue === 'false') selectedValue = false
    
    // Handle number values
    if (!isNaN(Number(selectedValue)) && typeof options[0].value === 'number') {
      selectedValue = Number(selectedValue)
    }
    
    onChange(selectedValue)
  }
  
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
        {label}
      </label>
      
      <div className="relative">
        <select
          name={name}
          value={value.toString()}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md appearance-none focus:outline-none focus:ring-2 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          {options.map((option, index) => (
            <option key={index} value={option.value.toString()}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}