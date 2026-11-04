import type { StudySession, Subject } from '../types';

export const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isoDate(date: Date) {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return copy.toISOString().slice(0, 10);
}

export function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysISO(value: string, days: number) {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export function formatShortDate(value: string) {
  return parseISODate(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatLongDate(value: string) {
  return parseISODate(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeDate(value: string) {
  const diff = Math.round((parseISODate(todayISO()).getTime() - parseISODate(value).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < -1 && diff > -7) return `In ${Math.abs(diff)} days`;
  return formatShortDate(value);
}

export function formatHours(minutes: number) {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function hourDecimal(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

export function startOfWeek(value = todayISO()) {
  const date = parseISODate(value);
  return addDaysISO(isoDate(date), -date.getDay());
}

export function weekDates(value = todayISO()) {
  const start = startOfWeek(value);
  return Array.from({ length: 7 }, (_, index) => addDaysISO(start, index));
}

export function sessionsBetween(sessions: StudySession[], start: string, end: string) {
  return sessions.filter((session) => session.date >= start && session.date <= end);
}

export function totalMinutes(sessions: StudySession[]) {
  return sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
}

export function studyStreak(sessions: StudySession[]) {
  const dates = new Set(sessions.filter((session) => session.completed).map((session) => session.date));
  let cursor = todayISO();
  if (!dates.has(cursor)) cursor = addDaysISO(cursor, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function subjectMap(subjects: Subject[]) {
  return new Map(subjects.map((subject) => [subject.id, subject]));
}

export function subjectName(subjects: Subject[], id?: string) {
  return subjects.find((subject) => subject.id === id)?.name ?? 'General';
}

export function monthKey(value: string) {
  return value.slice(0, 7);
}

export function formatMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  return new Date(year, value - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function timerSeconds(startedAt: number | null, accumulatedSeconds: number) {
  if (!startedAt) return accumulatedSeconds;
  return accumulatedSeconds + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

export function clock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return [hours, minutes, rest].map((value) => String(value).padStart(2, '0')).join(':');
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function completionLabel(subject: Subject) {
  if (subject.progress >= 85) return 'Nearly there';
  if (subject.progress >= 60) return 'In flow';
  if (subject.progress >= 30) return 'Building momentum';
  return 'Getting started';
}
