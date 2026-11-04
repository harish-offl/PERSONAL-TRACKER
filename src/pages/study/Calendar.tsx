import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, BookOpenText, Clock, Target } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudySession, StudyEvent } from '../../types';
import { cn, formatMonthYear, getMonthGrid, monthStart, toISO, todayISO } from '../../lib/utils';
import { subjectMap, subjectName } from '../../lib/study';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import { Button, EmptyState, Td, Th, useToast } from '../../components/ui';

export function StudyCalendarPage() {
  const { state } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sessions, events, subjects } = state;
  const byId = subjectMap(subjects);

  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const days = useMemo(() => getMonthGrid(month.getFullYear(), month.getMonth()), [month]);

  const sessionsFor = (date: string) => sessions.filter((s) => s.date === date);
  const eventsFor = (date: string) => events.filter((e) => e.date === date);
  const selectedSessions = sessionsFor(selectedDate);
  const selectedEvents = eventsFor(selectedDate);

  const today = todayISO();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Study Calendar"
        description="Scheduled sessions, exams and reminders at a glance."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/study/timetable')}>Timetable</Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="This month" value={String(sessions.filter((s) => s.date.slice(0, 7) === month.toISOString().slice(0, 7)).length)} detail="Sessions logged" icon={CalendarDays} />
        <StatCard label="Upcoming events" value={String(events.filter((e) => e.date >= today).length)} detail="Events scheduled" icon={Clock} />
        <StatCard label="Total sessions" value={String(sessions.length)} detail="All time" icon={BookOpenText} />
      </div>

      <Panel>
        <SectionHead
          title={formatMonthYear(month)}
          subtitle={`${selectedSessions.length} session${selectedSessions.length === 1 ? '' : 's'} on ${formatDate(selectedDate)}`}
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
                <Clock className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
        />
        <div className="overflow-x-auto border border-line rounded-xl bg-card">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Th key={day} className="w-[96px]">{day}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const iso = toISO(day);
                const inMonth = day.getMonth() === month.getMonth();
                const daySessions = sessionsFor(iso);
                const dayEvents = eventsFor(iso);
                const selected = iso === selectedDate;
                return (
                  <td
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={cn(
                      'h-20 border-b border-line-soft last:border-0 p-2 text-left transition group cursor-pointer',
                      selected ? 'bg-accent-soft border-accent' : 'border-transparent hover:bg-secondary/50',
                      !inMonth && 'opacity-40',
                      today === iso && 'ring-1 ring-accent',
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full mb-1 text-[10px] font-semibold">
                      {today === iso ? 'bg-accent text-white' : 'text-soft'}
                      {day.getDate()}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {daySessions.slice(0, 3).map((s) => (
                        <span key={s.id} className="h-1.5 w-1.5 rounded-full bg-accent" title={subjectName(subjects, s.subjectId)} />
                      ))}
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className="h-1.5 w-1.5 rounded-full bg-warning" title={e.title} />
                      ))}
                    </div>
                    {daySessions[0] && (
                      <span className="mt-auto line-clamp-1 text-[8.5px] leading-tight text-muted">{subjectName(subjects, daySessions[0].subjectId)}</span>
                    )}
                  </td>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <SectionHead title={formatDate(selectedDate)} subtitle={`${selectedSessions.length + selectedEvents.length} item${selectedSessions.length + selectedEvents.length !== 1 ? 's' : ''}`} />
          <div className="space-y-2">
            {selectedSessions.length === 0 && selectedEvents.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11px] text-muted">Nothing scheduled for this day.</p>
            ) : (
              <>
                {selectedSessions.map((s) => {
                  const subj = byId.get(s.subjectId);
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-secondary/50 px-2.5 py-2">
                      <SubjectIcon name={subj?.icon ?? 'BookOpenText'} color={subj?.color ?? '#6558D3'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-ink">{subj?.name ?? 'Study session'}</p>
                        <p className="text-[9.5px] text-muted">{s.durationMinutes} min · {s.type}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-soft">{s.startTime.slice(0, 5)}</span>
                    </div>
                  );
                })}
                {selectedEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-warning-soft px-2.5 py-2">
                    <Target className="h-4 w-4 text-warning shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-ink">{e.title}</p>
                      <p className="text-[9.5px] text-muted">{e.type} · {e.notes}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Upcoming events" subtitle="Exams, deadlines and reminders" />
          <div className="space-y-2">
            {events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-card px-2.5 py-2">
                <div className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
                  <span className="text-[8px] font-semibold uppercase text-muted">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="-mt-0.5 text-[12px] font-semibold text-ink">{new Date(e.date).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-ink">{e.title}</p>
                  <p className="text-[9.5px] text-muted">{e.type}</p>
                </div>
              </div>
            ))}
            {events.filter((e) => e.date >= today).length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-muted">No upcoming events.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

