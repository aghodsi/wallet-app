import * as React from "react"
import { useState, useEffect } from "react"
import { Clock, Globe } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"
import { useTimezone, COMMON_TIMEZONES } from "~/contexts/timezoneContext"

export function TimezoneSelector() {
  const { selectedTimezone, setTimezone } = useTimezone()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('--:--')
  const [systemTimezone, setSystemTimezone] = useState('UTC')

  // Find the current timezone info for display
  const currentTimezoneInfo = COMMON_TIMEZONES.find(tz => tz.value === selectedTimezone)
  const displayLabel = currentTimezoneInfo?.label || selectedTimezone

  // Get current time in selected timezone for preview
  const getCurrentTimeInTimezone = () => {
    if (!mounted) return '--:--'
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: selectedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      return 'Invalid'
    }
  }

  useEffect(() => {
    setMounted(true)
    setSystemTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const updateTime = () => {
      setCurrentTime(getCurrentTimeInTimezone())
    }

    updateTime() // Initial update
    const interval = setInterval(updateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [mounted, selectedTimezone])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-auto px-2 py-1 text-xs"
        >
          <Clock className="h-3 w-3" />
          <div className="flex flex-col items-start">
            <span className="font-medium">{displayLabel}</span>
            <span className="text-muted-foreground">{currentTime}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Select Timezone</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All dates will be displayed in this timezone
          </p>
        </div>
        
        <div className="p-3">
          <Select
            value={selectedTimezone}
            onValueChange={(value) => {
              setTimezone(value)
              setOpen(false)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((timezone) => (
                <SelectItem key={timezone.value} value={timezone.value}>
                  <div className="flex justify-between items-center w-full">
                    <span>{timezone.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {timezone.offset}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Current time:</span>
              <span className="font-mono">{currentTime}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>System timezone:</span>
              <span className="font-mono text-xs truncate max-w-[120px]">
                {systemTimezone}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
