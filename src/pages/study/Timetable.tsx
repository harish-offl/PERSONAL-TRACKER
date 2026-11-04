import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, Plus, Trash2, Edit3, BookOpenText } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudySchedule, Subject } from '../../types';
import { uid, timeToMinutes } from '../../lib/utils';
import { subjectMap } from '../../lib/study';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import { Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, Select, Td, Th, TableRow, useToast } from '../../components/ui';

const DAYS = [
  { key: 0, label: 'Sunday', short: 'Sun' },
  { key: 1, label: 'Monday', short: 'Mon' },
  { key: 2, label: 'Tuesday', short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday', short: 'Thu' },
  { key: 5, label: 'Friday', short: 'Fri' },
  { key: 6, label: 'Saturday', short: 'Sat' },
];

export function StudyTimetablePage() {
  const { state, addSchedule, updateSchedule, deleteSchedule } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subjects } = state;
  const byId = subjectMap(subjects);

  const [view, setView] = useState<'weekly' | 'daily'>('weekly');
  const [day, setDay] = useState<number>(new Date().getDay());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudySchedule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const schedules = useMemo(() => state.schedules.filter((s) => view === 'daily' ? s.day === day : true), [state.schedules, view, day]);
  const totalBlocks = schedules.length;
  const totalHours = schedules.reduce((sum, s) => sum + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60, 0);

  const initial: StudySchedule = {
    id: '',
    subjectId: subjects[0]?.id ?? '',
    day: new Date().getDay(),
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    repeat: true,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  const [form, setForm] = useState<StudySchedule>({ ...initial });

  function save(schedule: StudySchedule) {
    updateSchedule(schedule);
    toast('Schedule saved', 'success');
    setEditing(null);
    setFormOpen(false);
  }
  function create(schedule: StudySchedule) {
    addSchedule(schedule);
    toast('Study block added', 'success');
    setFormOpen(false);
  }
  function handleDelete(id: string) {
    deleteSchedule(id);
    toast('Schedule removed', 'success');
    setDeleteId(null);
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Study"
        title="Timetable"
        description="Plan your weekly study rhythm and upcoming sessions."
        action={
          <Button variant="primary" size="sm" onClick={() => setForm({ ...initial, id: '' })}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Add block
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Blocks this week" value={String(totalBlocks)} icon={CalendarDays} />
        <StatCard label="Planned hours" value={totalHours.toFixed(1)} icon={Clock3} />
      </div>

      <div className="flex items-center gap-2">
        <TabsView value={view} onChange={setView} />
        {view === 'daily' && (
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-card px-1">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDay(d.key)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${day === d.key ? 'bg-accent text-white' : 'text-soft hover:bg-secondary hover:text-ink'}`}
              >
                {d.short}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'weekly' ? (
        <WeeklyGrid schedules={schedules} byId={byId} subjects={subjects} onEdit={setEditing} onDelete={setDeleteId} onOpen={navigate} />
      ) : (
        <DailyList day={day} schedules={schedules} byId={byId} onEdit={setEditing} onDelete={setDeleteId} onOpen={navigate} />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit study block' : 'Add study block'}
        description="Pick a subject, set the time and choose whether it repeats weekly."
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => {
              const next: StudySchedule = {
                ...form,
                id: form.id || uid('sch'),
                createdAt: form.id ? form.createdAt : new Date().toISOString(),
              };
              if (form.id) save(next); else create(next);
            }}>
              {editing ? 'Save changes' : 'Add block'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject" required>
            <Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjectOptions.map((o) => (
                <option key={o.value} value={o.value} style={{ color: o.color }}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Day">
              <Select value={String(form.day)} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
                {DAYS.map((d) => (<option key={d.key} value={String(d.key)}>{d.label}</option>))}
              </Select>
            </Field>
            <Field label="Start time">
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Field>
            <Field label="End time">
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Server components practice" />
          </Field>
          <Field label>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink">
              <input type="checkbox" checked={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.checked })} className="h-3.5 w-3.5 rounded border-line accent-[var(--accent)]" />
              Repeat weekly
            </label>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const sched = state.schedules.find((s) => s.id === deleteId);
          if (sched) handleDelete(sched.id);
        }}
        title="Delete study block"
        description="This removes the scheduled block from your timetable."
        confirmLabel="Delete"
      />
    </div>
  );
}

function TabsView({ value, onChange }: { value: 'weekly' | 'daily'; onChange: (v: 'weekly' | 'daily') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-secondary p-1">
      {[
        { value: 'weekly', label: 'Weekly' },
        { value: 'daily', label: 'Daily' },
      ].map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition ${active ? 'bg-card text-ink shadow-card' : 'text-soft hover:bg-card/60 hover:text-ink'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function WeeklyGrid({ schedules, byId, subjects, onEdit, onDelete, onOpen }: any) {
  const byDay = useMemo(() => {
    const map = new Map<number, any[]>();
    DAYS.forEach((d) => map.set(d.key, []));
    schedules.forEach((s) => {
      const arr = map.get(s.day) ?? [];
      arr.push(s);
    });
    return map;
  }, [schedules]);

  return (
    <Panel>
      <SectionHead title="Weekly timetable" subtitle="Drag or tap a block to edit" />
      <div className="overflow-x-auto border border-line rounded-2xl bg-card">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr>
              <Th className="w-20">Time</Th>
              {DAYS.map((d) => (
                <Th key={d.key} className="w-[140px]">
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">{d.short}</span>
                    <span className="h-2 w-2 rounded-full bg-accent-soft" />
                  </div>
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => (
              <tr key={time} className="border-b border-line-soft last:border-0">
                <Td className="w-20 text-[10px] text-muted font-mono">{time}</Td>
                {DAYS.map((d) => (
                  <Td key={`${time}-${d.key}`} className="h-24 px-2 text-[10.5px] vertical-align-middle relative group cursor-pointer min-w-[140px]" onClick={() => {
                    const blocks = byDay.get(d.key)?.filter((b) => b.startTime === time);
                    if (blocks?.[0]) onOpen(`/study/sessions?subject=${blocks[0].subjectId}`);
                  }}>
                    {byDay.get(d.key)?.filter((b) => b.startTime <= time && b.endTime > time).map((block) => {
                      const subj = byId.get(block.subjectId);
                      return (
                        <div
                          key={block.id}
                          className="mb-1 rounded-lg p-1.5 text-[9.5px] font-medium shadow-sm border"
                          style={{ backgroundColor: `${subj?.color ?? '#6558D3'}22`, borderColor: `${subj?.color ?? '#6558D3'}55` }}
                          onClick={(e) => { e.stopPropagation(); onEdit(block); }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <SubjectIcon name={subj?.icon ?? 'BookOpenText'} color={subj?.color ?? '#6558D3'} size="sm" />
                            <span className="truncate">{subj?.name ?? 'Subject'}</span>
                          </div>
                          <div className="text-[8px] text-muted truncate">{block.notes || block.startTime + ' - ' + block.endTime}</div>
                        </div>
                      );
                    })}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function DailyList({ day, schedules, byId, onEdit, onDelete, onOpen }: any) {
  const d = DAYS.find((x) => x.key === day);
  const blocks = schedules.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
  return (
    <Panel>
      <SectionHead title={`Tuesday timetable`} subtitle={`${blocks.length} block${blocks.length !== 1 ? 's' : ''} scheduled`} />
      {blocks.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No blocks scheduled" description={`Add a study block for ${d?.label}.`} action={
          <Button variant="secondary" size="sm">Add block</Button>
        } className="py-10" />
      ) : (
        <DataTable minWidth={600}>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Subject</Th>
              <Th>Notes</Th>
              <Th align="right">Duration</Th>
              <Th align="center" className="w-24">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => {
              const subj = byId.get(block.subjectId);
              const mins = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
              return (
                <TableRow key={block.id} onClick={() => onOpen(`/study/sessions?subject=${block.subjectId}`)}>
                  <Td>{block.startTime} – {block.endTime}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <SubjectIcon name={subj?.icon ?? 'BookOpenText'} color={subj?.color ?? '#6558D3'} size="sm" />
                      <span className="font-medium text-ink">{subj?.name ?? 'Subject'}</span>
                    </div>
                  </Td>
                  <Td className="text-muted text-[11px]">{block.notes || '—'}</Td>
                  <Td align="right" className="font-mono text-[11px]">{Math.round(mins / 60 * 10) / 10}h</Td>
                  <Td align="center">
                    <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onEdit(block); }}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" danger onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </Td>
                </TableRow>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </Panel>
  );
}
