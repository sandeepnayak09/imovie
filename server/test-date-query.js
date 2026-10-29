const dateStr = '2026-10-28';

// UTC parse
const targetDate = new Date(dateStr);
console.log('targetDate raw:', targetDate.toISOString());

const start = new Date(targetDate);
start.setHours(0, 0, 0, 0);

const end = new Date(targetDate);
end.setHours(23, 59, 59, 999);

console.log('start local setHours:', start.toISOString(), 'local string:', start.toString());
console.log('end local setHours:  ', end.toISOString(), 'local string:', end.toString());

// Now what if we schedule a show for "today"?
const today = new Date();
today.setHours(0, 0, 0, 0);
console.log('scheduled showDate: ', today.toISOString(), 'local string:', today.toString());

const isMatched = today >= start && today <= end;
console.log('Does scheduled show match start/end?', isMatched);
