import { useEffect } from 'react'
import { usePortfolioStore } from '~/stores/portfolioStore'
import type { PortfolioType } from '~/datatypes/portfolio'
import type { CurrencyType } from '~/datatypes/currency'
import type { InstitutionType } from '~/datatypes/institution'

interface StoreInitializerProps {
  portfolios: PortfolioType[]
  currencies: CurrencyType[]
  institutions: InstitutionType[]
  children: React.ReactNode
}

export function StoreInitializer({ 
  portfolios, 
  currencies, 
  institutions, 
  children 
}: StoreInitializerProps) {
  const { setPortfolios, setAllCurrencies, setAllInstitutions } = usePortfolioStore()

  useEffect(() => {
    console.log('StoreInitializer: Initializing store with data:')
    console.log('- Portfolios:', portfolios.length, portfolios)
    console.log('- Currencies:', currencies.length, currencies)
    console.log('- Institutions:', institutions.length, institutions)
    
    // Initialize store with data from loader
    setPortfolios(portfolios)
    setAllCurrencies(currencies)
    setAllInstitutions(institutions)
    
    console.log('StoreInitializer: Store initialized')
  }, [portfolios, currencies, institutions, setPortfolios, setAllCurrencies, setAllInstitutions])

  return <>{children}</>
}
