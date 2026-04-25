import { format } from 'date-fns';

export function formatDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function formatFriendlyDate(date) {
  return format(date, 'EEE, d MMM');
}
