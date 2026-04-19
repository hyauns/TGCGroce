"use client"

import React, { createContext, useContext, useState } from "react"

export interface Category {
  name: string
  slug: string
}

interface CategoryContextType {
  categories: Category[]
}

const CategoryContext = createContext<CategoryContextType>({ categories: [] })

export function CategoryProvider({ 
  categories, 
  children 
}: { 
  categories: Category[]
  children: React.ReactNode 
}) {
  return (
    <CategoryContext.Provider value={{ categories }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategories() {
  return useContext(CategoryContext)
}
