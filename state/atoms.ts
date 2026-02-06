import { atom, selector, GetRecoilValue } from 'recoil'
import { Recipe } from './types'
import { mockRecipeBooks } from './mockData'

// Recipe Books State
export const recipeBooksState = atom<Recipe[]>({
  key: 'recipeBooksState',
  default: mockRecipeBooks
})

// Active Category State
export const activeCategoryState = atom<string>({
  key: 'activeCategoryState',
  default: 'All'
})

// Search Query State
export const searchQueryState = atom<string>({
  key: 'searchQueryState',
  default: ''
})

// Filtered Recipe Books Selector
export const filteredRecipeBooksSelector = selector({
  key: 'filteredRecipeBooksSelector',
  get: ({get}: {get: GetRecoilValue}) => {
    const recipeBooks = get(recipeBooksState)
    const activeCategory = get(activeCategoryState)
    const searchQuery = get(searchQueryState)

    return recipeBooks.filter((book: Recipe) => {
      const matchesCategory = activeCategory === 'All' || book.categories.includes(activeCategory)
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesCategory && matchesSearch
    })
  }
})

// Single Recipe Book Selector
export const recipeBookByIdSelector = selector({
  key: 'recipeBookByIdSelector',
  get: ({get}: {get: GetRecoilValue}) => (id: string) => {
    const recipeBooks = get(recipeBooksState)
    return recipeBooks.find((recipe: Recipe) => recipe.id === id)
  }
}) 