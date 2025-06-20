"use client"

import React, { createContext, useContext, useState } from "react"
import type { TransactionType } from "~/datatypes/transaction"
import type { PortfolioType } from "~/datatypes/portfolio"
import type { CurrencyType } from "~/datatypes/currency"
import { TransactionDetailSheet } from "~/components/transactionDetailSheet"
import { userPortfolios } from "~/stateManagement/portfolioContext"

interface TransactionViewContextType {
  openTransactionView: (transaction: TransactionType) => void
}

const TransactionViewContext = createContext<TransactionViewContextType | undefined>(undefined)

interface TransactionViewProviderProps {
  children: React.ReactNode
  currencies: CurrencyType[]
}

export function TransactionViewProvider({ children, currencies }: TransactionViewProviderProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const portfolios = userPortfolios()

  const openTransactionView = (transaction: TransactionType) => {
    setSelectedTransaction(transaction)
    setIsOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSelectedTransaction(null)
    }
  }

  const contextValue: TransactionViewContextType = {
    openTransactionView
  }

  return (
    <TransactionViewContext.Provider value={contextValue}>
      {children}
      <TransactionDetailSheet
        open={isOpen}
        onOpenChange={handleOpenChange}
        transaction={selectedTransaction}
        mode="view"
        portfolios={portfolios}
        currencies={currencies}
      />
    </TransactionViewContext.Provider>
  )
}

export function useTransactionView(): TransactionViewContextType {
  const context = useContext(TransactionViewContext)
  if (context === undefined) {
    throw new Error("useTransactionView must be used within a TransactionViewProvider")
  }
  return context
}
