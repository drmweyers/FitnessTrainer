export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface CategoryNavProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export interface CreateRecipeModalProps {
  isOpen: boolean
  onClose: () => void
} 