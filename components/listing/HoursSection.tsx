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
      <SectionHeading>Hours of operation</SectionHeading>
      <div className="rounded-[14px] border border-gray-200 bg-white overflow-hidden">
        {sortedDays.map((day, idx) => {
          const dayHours = normalized[day];
          if (!dayHours) return null;

          const isToday = day === todayDay;
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);

          return (
            <div
              key={day}
              className={`flex justify-between items-center px-4 py-3 ${
                idx !== 0 ? 'border-t border-gray-100' : ''
              } ${isToday ? 'bg-cta-soft' : ''}`}
            >
              <span className={`text-[14px] font-medium ${isToday ? 'text-cta' : 'text-heading'}`}>
                {dayName}
              </span>
              <span className={`text-[14px] ${isToday ? 'text-cta font-medium' : 'text-muted'}`}>
                {formatDayHoursLabel(dayHours)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
        Times shown in local time zone
      </p>
    </SectionContainer>
  );
}
