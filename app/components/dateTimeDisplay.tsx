import { useTimezone } from "~/contexts/timezoneContext"

interface DateTimeDisplayProps {
  timestamp: number | string | null
  className?: string
  fallback?: string
}

export function DateTimeDisplay({ timestamp, className, fallback = "No data" }: DateTimeDisplayProps) {
  const { formatDateTimeInTimezone } = useTimezone()
  
  if (!timestamp) {
    return <span className={`text-muted-foreground ${className || ""}`}>{fallback}</span>
  }
  
  return (
    <div className={`text-sm ${className || ""}`}>
      {formatDateTimeInTimezone(timestamp)}
    </div>
  )
}
