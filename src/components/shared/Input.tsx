'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showCharCount?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label,
    error, 
    leftIcon, 
    rightIcon, 
    showCharCount = false,
    maxLength,
    onChange,
    ...props 
  }, ref) => {
    // Handle both types of onChange handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id || props.name} 
            className="block text-xs font-medium text-gray-500 uppercase mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            className={cn(
              "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
              error 
                ? "border-red-300 focus:ring-red-500" 
                : "border-gray-300 focus:ring-blue-500 focus:border-transparent",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-1">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          {showCharCount && maxLength && props.value && typeof props.value === 'string' && (
            <p className={`text-xs ${
              props.value.length > maxLength ? 'text-red-500' : 'text-gray-500'
            }`}>
              {props.value.length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }