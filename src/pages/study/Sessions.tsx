import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock3, BookOpenText, Filter, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudySession, Subject } from '../../types';
import { formatHours, subjectMap, subjectName, timeLabel, todayISO } from '../../lib/study';
import { addDays, cn, formatDate } from '../../lib/utils';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Select, Td, Th, TableRow, useToast,
} from '../../components/ui';

const FILTERS: { value: string; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

export function StudySessionsPage() {
  const { state, deleteSession, updateSession } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [range, setRange] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { subjects, sessions } = state;
  const byId = subjectMap(subjects);

  const today = todayISO();
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (range === 'today') return [today, today];
    if (range === 'yesterday') return [addDays(today, -1), addDays(today, -1)];
    if (range === 'week') return [addDays(today, -6), today];
    if (range === 'month') return [addDays(today, -29), today];
    return [startDate || today, endDate || today];
  }, [range, today, startDate, endDate]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (subjectFilter && s.subjectId !== subjectFilter) return false;
      if (s.date < rangeStart || s.date > rangeEnd) return false;
      return true;
    }).sort((a, b) => b.startTime.localeCompare(a.startTime));
  }, [sessions, subjectFilter, rangeStart, rangeEnd]);

  const total = filtered.reduce((sum, s) => sum + s.durationMinutes, 0);
  const completed = filtered.filter((s) => s.completed).length;

  function handleDelete(id: string) {
    deleteSession(id);
    toast({ title: 'Session saved', variant: 'success' });
    setDeleteId(null);
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sessions"
        description="Your session history and completion records."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/study/timer')}>
            Start timer
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total sessions" value={String(filtered.length)} detail="In range" icon={Clock3} />
        <StatCard label="Hours" value={formatHours(total)} detail="Study time" icon={BookOpenText} />
        <StatCard label="Completed" value={`${completed} / ${filtered.length}`} detail="Completed" icon={BookOpenText} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select
            value={range}
            onChange={(e) => {
              setRange(e.target.value);
              if (e.target.value === 'custom') { setStartDate(''); setEndDate(''); }
              setSearchParams((prev) => { prev.set('range', e.target.value); return prev; });
            }}
          >
            {FILTERS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
          </Select>
          {range === 'custom' && (
            <>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Field label="Subject">
            <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <DataTable minWidth={700}>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Subject</Th>
              <Th>Time</Th>
              <Th align="right">Duration</Th>
              <Th>Type</Th>
              <Th align="center" className="w-20">Status</Th>
              <Th align="center" className="w-24">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted">
                  <EmptyState icon={Clock3} title="No sessions" description="Start a timer to log your first focused study session." action={
                    <Button variant="secondary" size="sm" onClick={() => navigate('/study/timer')}>Open timer</Button>
                  } className="border-0 bg-transparent py-6" />
                </td>
              </tr>
            ) : (
              filtered.map((session) => {
                const subj = byId.get(session.subjectId);
                return (
                  <TableRow key={session.id} onClick={() => navigate(`/study/subjects`)}>
                    <Td>{formatDate(session.date)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <SubjectIcon name={subj?.icon ?? 'BookOpenText'} color={subj?.color ?? '#6558D3'} size="sm" />
                        <span className="font-medium text-ink">{subj?.name ?? 'General'}</span>
                      </div>
                    </Td>
                    <Td className="text-muted text-[11px] font-mono">{timeLabel(session.startTime)} – {timeLabel(session.endTime)}</Td>
                    <Td align="right" className="font-mono text-[11px]">{Math.round(session.durationMinutes / 60 * 10) / 10}h</Td>
                    <Td><Badge tone="gray">{session.type}</Badge></Td>
                    <Td align="center">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold ${session.completed ? 'bg-success-soft text-success' : 'bg-secondary text-soft'}`}>
                        {session.completed ? 'Done' : 'Open'}
                      </span>
                    </Td>
                    <Td align="center">
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/study/subjects?subject=${session.subjectId}`); }}>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteId(session.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </Td>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const s = state.sessions.find((x) => x.id === deleteId);
          if (s) handleDelete(s.id);
        }}
        title="Delete session"
        description="This removes the session from your history."
        confirmLabel="Delete"
      />
    </div>
  );
}

function Badge({ children, tone = 'gray', className }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'blue' | 'red' | 'amber'; className?: string }) {
  const tones: Record<string, string> = {
    gray: 'border-line bg-secondary text-soft',
    green: 'border-green-200 bg-green-50 text-green-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5', tones[tone], className)}>
      {children}
    </span>
  );
}

