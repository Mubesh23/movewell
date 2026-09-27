import { formatLocalDateYYYYMMDD } from '../types';

export type DatePrecision =
  | 'EXACT'
  | 'DAY'
  | 'RANGE'
  | 'APPROXIMATE'
  | 'UNKNOWN';

export interface TemporalResolution {
  rawText: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm or human time
  rangeStart?: string; // YYYY-MM-DD
  rangeEnd?: string; // YYYY-MM-DD
  daysFromReference?: number;
  precision: DatePrecision;
  dayPart?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  needsClarification: boolean;
  clarificationPrompt?: string;
  description: string;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Resolves temporal expressions relative to a reference date.
 * Does NOT guess dates blindly when relative language like "next week" is used.
 * Captures day parts (morning, afternoon, evening) as APPROXIMATE precision rather than fabricating exact hours.
 */
export function resolveTemporalExpression(
  text: string,
  referenceDate: Date = new Date(),
  timeZone?: string
): TemporalResolution | null {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;

  // 1. Time of day extraction (e.g., "2 PM", "around 2pm", "14:00", "morning", "afternoon")
  let extractedTime: string | undefined;
  let dayPart: 'MORNING' | 'AFTERNOON' | 'EVENING' | undefined;
  const isApproximate = /\b(?:around|approx|approximately|about|ish)\b/i.test(lower);

  const timeRegex = /\b(?:at|around|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    extractedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  } else if (lower.includes('morning')) {
    dayPart = 'MORNING';
    extractedTime = 'Morning (~10:00 AM)';
  } else if (lower.includes('afternoon')) {
    dayPart = 'AFTERNOON';
    extractedTime = 'Afternoon (~2:00 PM)';
  } else if (lower.includes('evening')) {
    dayPart = 'EVENING';
    extractedTime = 'Evening (~6:00 PM)';
  } else if (/\b(?:by\s+)?(?:eod|end of day)\b/i.test(lower)) {
    extractedTime = '17:00';
  }

  const resolvePrecision = (): DatePrecision => {
    if (dayPart || isApproximate) return 'APPROXIMATE';
    if (extractedTime) return 'EXACT';
    return 'DAY';
  };

  // 2. "Now" / "Today"
  if (/\b(today|right now|currently|asap|immediately)\b/i.test(lower)) {
    const d = new Date(referenceDate);
    const dateStr = formatLocalDateYYYYMMDD(d);
    return {
      rawText: text,
      date: dateStr,
      time: extractedTime,
      dayPart,
      daysFromReference: 0,
      precision: resolvePrecision(),
      needsClarification: false,
      description: 'Today',
    };
  }

  // 3. "Tomorrow" / "Tmr"
  if (/\b(tomorrow|tmr|tmrw)\b/i.test(lower)) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 1);
    const dateStr = formatLocalDateYYYYMMDD(d);
    return {
      rawText: text,
      date: dateStr,
      time: extractedTime,
      dayPart,
      daysFromReference: 1,
      precision: resolvePrecision(),
      needsClarification: false,
      description: 'Tomorrow',
    };
  }

  // 4. "In X days" / "X days"
  const inDaysMatch = lower.match(/\b(?:in\s+)?(\d+)\s+days?\b/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + days);
    const dateStr = formatLocalDateYYYYMMDD(d);
    return {
      rawText: text,
      date: dateStr,
      time: extractedTime,
      dayPart,
      daysFromReference: days,
      precision: resolvePrecision(),
      needsClarification: false,
      description: `In ${days} days`,
    };
  }

  // 5. "Next week" (explicitly needs clarification rather than arbitrary 7 days)
  if (/\bnext week\b/i.test(lower)) {
    const refDay = referenceDate.getDay();
    // Monday of next week
    const daysUntilNextMonday = ((1 - refDay + 7) % 7) || 7;
    const nextMonday = new Date(referenceDate);
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);

    return {
      rawText: text,
      rangeStart: formatLocalDateYYYYMMDD(nextMonday),
      rangeEnd: formatLocalDateYYYYMMDD(nextSunday),
      daysFromReference: daysUntilNextMonday,
      precision: 'RANGE',
      needsClarification: true,
      clarificationPrompt:
        "Is there a particular day next week you're expecting, or is the timing still flexible?",
      description: 'Next week (flexible)',
    };
  }

  // 6. Day of week (e.g. "Thursday", "Friday", "this Thursday", "next Friday")
  for (const [dayName, targetDayIndex] of Object.entries(WEEKDAYS)) {
    const dayRegex = new RegExp(`\\b(?:this\\s+|coming\\s+)?${dayName}\\b`, 'i');
    if (dayRegex.test(lower)) {
      const currentDayIndex = referenceDate.getDay();
      let diff = (targetDayIndex - currentDayIndex + 7) % 7;
      if (diff === 0) {
        // If said today, usually means upcoming week unless specified today
        diff = 7;
      }
      if (lower.includes(`next ${dayName}`)) {
        diff += 7;
      }

      const d = new Date(referenceDate);
      d.setDate(d.getDate() + diff);
      const dateStr = formatLocalDateYYYYMMDD(d);

      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return {
        rawText: text,
        date: dateStr,
        time: extractedTime,
        dayPart,
        daysFromReference: diff,
        precision: resolvePrecision(),
        needsClarification: false,
        description: capitalizedDay,
      };
    }
  }

  // 7. Month + Day (e.g. "October 2", "Oct 2nd", "September 19")
  for (const [monthName, monthIndex] of Object.entries(MONTHS)) {
    const monthRegex = new RegExp(`\\b${monthName}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    const match = lower.match(monthRegex);
    if (match) {
      const dayNum = parseInt(match[1], 10);
      let year = referenceDate.getFullYear();
      const targetDate = new Date(year, monthIndex, dayNum);

      // If month has passed in current year by more than 6 months, roll over to next year
      if (targetDate.getTime() < referenceDate.getTime() - 1000 * 3600 * 24 * 30) {
        targetDate.setFullYear(year + 1);
      }

      const diffMs = targetDate.getTime() - referenceDate.getTime();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));

      return {
        rawText: text,
        date: formatLocalDateYYYYMMDD(targetDate),
        time: extractedTime,
        dayPart,
        daysFromReference: days,
        precision: resolvePrecision(),
        needsClarification: false,
        description: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${dayNum}`,
      };
    }
  }

  // 8. General flexible/unknown timing
  if (/\b(not sure|unsure|unknown|flexible|don't know|tbd)\b/i.test(lower)) {
    return {
      rawText: text,
      precision: 'UNKNOWN',
      needsClarification: false,
      description: 'Timeline flexible',
    };
  }

  // 9. Standalone time without date (e.g. "by eod", "around 2pm", "morning")
  if (extractedTime && !lower.includes('next week')) {
    return {
      rawText: text,
      time: extractedTime,
      dayPart,
      precision: resolvePrecision(),
      needsClarification: false,
      description: extractedTime === '17:00' ? 'By end of day (5:00 PM)' : extractedTime,
    };
  }

  return null;
}
