import { useTimezone } from "~/contexts/timezoneContext"

interface DateCellProps {
  dateValue: string
}

export function DateCell({ dateValue }: DateCellProps) {
  const { formatDateInTimezone } = useTimezone()
  
  // Parse epoch timestamp - if it's a string, convert to number first
  const timestamp = typeof dateValue === 'string' ? parseInt(dateValue) : dateValue
  const date = new Date(timestamp)
  
  return (
    <div className="font-medium">
      {formatDateInTimezone(date)}
    </div>
  )
}
