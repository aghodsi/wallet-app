import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrencyType } from '~/datatypes/currency'

interface TransactionDialogContextType {
  isOpen: boolean
  openDialog: () => void
  closeDialog: () => void
  currencies: CurrencyType[]
}

const TransactionDialogContext = createContext<TransactionDialogContextType | undefined>(undefined)

interface TransactionDialogProviderProps {
  children: ReactNode
  currencies: CurrencyType[]
}

export function TransactionDialogProvider({ children, currencies }: TransactionDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  return (
    <TransactionDialogContext.Provider value={{ isOpen, openDialog, closeDialog, currencies }}>
      {children}
    </TransactionDialogContext.Provider>
  )
}

export function useTransactionDialog() {
  const context = useContext(TransactionDialogContext)
  if (context === undefined) {
    throw new Error('useTransactionDialog must be used within a TransactionDialogProvider')
  }
  return context
}
