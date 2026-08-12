'use client';

import { Clock } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SectionContainer from './SectionContainer';
import {
  fixMisencodedHours,
  formatDayHoursLabel,
  type BusinessHours,
} from '@/lib/hours';

export interface HoursSectionProps {
  hours?: BusinessHours;
}

const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getTodayDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

export default function HoursSection({ hours }: HoursSectionProps) {
  const normalized = fixMisencodedHours(hours);
  if (!normalized || Object.keys(normalized).length === 0) return null;

  const todayDay = getTodayDay();
  const sortedDays = daysOrder.filter((d) => normalized[d]);

  return (
    <SectionContainer>
      <SectionHeading>Hours of Operation</SectionHeading>
      <div className="space-y-2">
        {sortedDays.map((day) => {
          const dayHours = normalized[day];
          if (!dayHours) return null;

          const isToday = day === todayDay;
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);

          return (
            <div
              key={day}
              className={`flex justify-between items-center p-3 rounded-lg ${
                isToday ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
              }`}
            >
              <span className={`font-medium ${isToday ? 'text-blue-900' : 'text-slate-900'}`}>
                {dayName}
              </span>
              <span className={isToday ? 'text-blue-700 font-medium' : 'text-slate-600'}>
                {formatDayHoursLabel(dayHours)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        Times shown in local time zone
      </p>
    </SectionContainer>
  );
}
