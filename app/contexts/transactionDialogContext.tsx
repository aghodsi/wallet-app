import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrencyType } from '~/datatypes/currency'
import type { InstitutionType } from '~/datatypes/institution'

type DialogType = 'transaction' | 'portfolio' | null

interface DialogContextType {
  activeDialog: DialogType
  openTransactionDialog: () => void
  openPortfolioDialog: () => void
  closeDialog: () => void
  currencies: CurrencyType[]
  institutions: InstitutionType[]
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

interface DialogProviderProps {
  children: ReactNode
  currencies: CurrencyType[]
  institutions: InstitutionType[]
}

export function DialogProvider({ children, currencies, institutions }: DialogProviderProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)

  const openTransactionDialog = () => setActiveDialog('transaction')
  const openPortfolioDialog = () => setActiveDialog('portfolio')
  const closeDialog = () => setActiveDialog(null)

  return (
    <DialogContext.Provider value={{ 
      activeDialog, 
      openTransactionDialog, 
      openPortfolioDialog, 
      closeDialog, 
      currencies,
      institutions
    }}>
      {children}
    </DialogContext.Provider>
  )
}

export function useDialogContext() {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialogContext must be used within a DialogProvider')
  }
  return context
}

// Legacy exports for backward compatibility
export const TransactionDialogProvider = DialogProvider
export const useTransactionDialog = () => {
  const context = useDialogContext()
  return {
    isOpen: context.activeDialog === 'transaction',
    openDialog: context.openTransactionDialog,
    closeDialog: context.closeDialog,
    currencies: context.currencies
  }
}
