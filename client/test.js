import { format, formatDistanceToNow } from 'date-fns';

const now = new Date();

console.log(format(now, 'dd MMM yyyy, hh:mm a')); // "20 Jul 2025, 08:15 PM"
console.log(formatDistanceToNow(now, { addSuffix: true })); // "less than a minute ago"
