import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "~/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

interface FactCardsProps {
  totalInvestment: number;
  totalCash: number;
  totalCommission: number;
  totalTaxes: number;
  performance: number;
  transactionCount: number;
  currency?: string;
  timeRange?: string;
}

export function FactCards({
  totalInvestment,
  totalCash,
  totalCommission,
  totalTaxes,
  performance,
  transactionCount,
  currency = "USD",
  timeRange = "All time"
}: FactCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const performancePercentage = totalInvestment > 0 ? ((performance - totalInvestment) / totalInvestment * 100) : 0;
  const isPerformancePositive = performancePercentage >= 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Investment</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalInvestment)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPerformancePositive ? <TrendingUp /> : <TrendingDown />}
              {isPerformancePositive ? '+' : ''}{performancePercentage.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPerformancePositive ? 'Positive' : 'Negative'} performance {timeRange.toLowerCase()} {isPerformancePositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Total amount invested in portfolio
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(performance)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isPerformancePositive ? <TrendingUp /> : <TrendingDown />}
              {formatCurrency(performance - totalInvestment)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isPerformancePositive ? 'Gain' : 'Loss'}: {formatCurrency(Math.abs(performance - totalInvestment))} {isPerformancePositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Current portfolio value
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Commission</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalCommission)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              Cost
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trading fees paid {timeRange.toLowerCase()} <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Commission and transaction fees</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Taxes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalTaxes)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown />
              Cost
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tax obligations {timeRange.toLowerCase()} <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Capital gains and other taxes</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cash Available</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalCash)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Available
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Liquid funds ready for investment <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Uninvested cash balance</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Transactions (excluding housekeeping)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(transactionCount)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Activity
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trading activity {timeRange.toLowerCase()} <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Number of buy/sell transactions</div>
        </CardFooter>
      </Card>
    </div>
  )
}
