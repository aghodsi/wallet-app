import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';

const convertRecurrenceToCron = (recurrence: string): string | null => {
  switch (recurrence) {
    case 'every-minute': return '* * * * *'; // Every minute
    case 'daily': return '0 9 * * *'; // 9 AM daily
    case 'weekly': return '0 9 * * 1'; // 9 AM every Monday
    case 'monthly': return '0 9 1 * *'; // 9 AM on 1st of every month
    case 'yearly': return '0 9 1 1 *'; // 9 AM on January 1st
    default: return null;
  }
};

const RecurrenceSelect = () => {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select Recurrence" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Recurrence</SelectItem>
        <SelectItem value="every-minute">Every Minute</SelectItem>
        <SelectItem value="daily">Daily</SelectItem>
        <SelectItem value="weekly">Weekly</SelectItem>
        <SelectItem value="monthly">Monthly</SelectItem>
        <SelectItem value="yearly">Yearly</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default RecurrenceSelect;