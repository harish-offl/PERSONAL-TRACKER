import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpenText,
  Clock3,
  Target,
  Trash2,
  Edit3,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { Subject, SubjectPriority } from '../../types';
import { subjectMap } from '../../lib/study';
import { addDays, cn, formatDate, uid } from '../../lib/utils';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard, Tag } from '../../components/study/shared';
import {
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  FilterMenu,
  Input,
  Modal,
  SearchInput,
  Select,
  Textarea,
  useToast,
} from '../../components/ui';

const PRIORITIES: SubjectPriority[] = ['High', 'Medium', 'Low'];

export function StudySubjectsPage() {
  const { state, addSubject, updateSubject, deleteSubject } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<SubjectPriority[]>([]);
  const [sort, setSort] = useState<'name' | 'progress' | 'target'>('name');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const subjects = useMemo(() => {
    let list = state.subjects.filter((subject) => {
      if (search && !subject.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (priorityFilter.length && !priorityFilter.includes(subject.priority)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'progress') return b.progress - a.progress;
      return b.targetHours - a.targetHours;
    });
    return list;
  }, [state.subjects, search, priorityFilter, sort]);

  const totalHours = useMemo(
    () =>
      subjects.reduce(
        (sum, s) =>
          sum +
          state.sessions
            .filter((x) => x.subjectId === s.id)
            .reduce((t, x) => t + x.durationMinutes, 0),
        0,
      ) / 60,
    [subjects, state.sessions],
  );

  function createSubject(subject: Subject) {
    addSubject(subject);
    toast('Subject created', 'success');
    setFormOpen(false);
  }

  function saveSubject(subject: Subject) {
    updateSubject(subject);
    toast('Subject updated', 'success');
    setEditing(null);
    setFormOpen(false);
  }

  function handleDelete(id: string) {
    deleteSubject(id);
    toast('Subject removed', 'success');
    setDeleteId(null);
  }

  const initialSubject: Subject = {
    id: '',
    name: '',
    description: '',
    color: '#6558D3',
    icon: 'BookOpenText',
    targetHours: 40,
    targetDate: addDays(new Date().toISOString().slice(0, 10), 30),
    priority: 'Medium',
    progress: 0,
    completedChapters: 0,
    totalChapters: 0,
    createdAt: new Date().toISOString(),
  };

  const [form, setForm] = useState<Subject>({ ...initialSubject });

  const empty = subjects.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Study"
        title="Subjects"
        description="Build depth across the subjects you are learning."
        action={
          <Button variant="primary" size="sm" onClick={() => setForm({ ...initialSubject, id: '' })}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Add subject
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total subjects" value={String(subjects.length)} icon={BookOpenText} />
        <StatCard label="Hours logged" value={totalHours.toFixed(1)} icon={Clock3} />
        <StatCard
          label="Avg. progress"
          value={subjects.length ? Math.round((subjects.reduce((s, x) => s + x.progress, 0) / subjects.length)) + '%' : '0%'}
          icon={Target}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setSearchParams((prev) => {
              prev.set('search', value || undefined);
              return prev;
            });
          }}
          placeholder="Search subjects…"
          className="max-w-md sm:max-w-lg"
        />
        <FilterMenu
          label="Priority"
          options={PRIORITIES.map((value) => ({ value, label: value, count: subjects.filter((s) => s.priority === value).length }))}
          selected={priorityFilter}
          onChange={(values) => setPriorityFilter(values)}
          onClear={() => setPriorityFilter([])}
        />
        <div className="no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[10px] border border-line bg-secondary p-1">
          {[
            { value: 'name', label: 'Name' },
            { value: 'progress', label: 'Progress' },
            { value: 'target', label: 'Target hours' },
          ].map((option) => {
            const active = option.value === sort;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all h-7 px-2.5 text-[11px] ${
                  active ? 'bg-card text-ink shadow-card ring-1 ring-line/70' : 'text-soft hover:bg-card/60 hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {empty ? (
          <EmptyState
            icon={BookOpenText}
            title="No subjects yet"
            description="Add your first subject to begin tracking your learning."
            action={
              <Button variant="secondary" size="sm" onClick={() => setForm({ ...initialSubject, id: '' })}>
                Add subject
              </Button>
            }
            className="col-span-full border-0 bg-transparent py-12"
          />
        ) : (
          subjects.map((subject) => {
            const sessions = state.sessions.filter((x) => x.subjectId === subject.id);
            const hoursStudied = sessions.reduce((sum, x) => sum + x.durationMinutes, 0) / 60;
            const lastStudied = subject.lastStudied;
            return (
              <Panel key={subject.id} className="group">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SubjectIcon name={subject.icon} color={subject.color} />
                    <div>
                      <h3 className="text-[12px] font-semibold text-ink group-hover:text-accent transition">{subject.name}</h3>
                      <p className="text-[9.5px] text-muted">{subject.description}</p>
                    </div>
                  </div>
                  <Badge tone="gray">{subject.priority}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-muted">Progress</span>
                    <span className="text-[10px] font-semibold">{subject.progress}%</span>
                  </div>
                  <div className="w-full h-2 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, subject.progress))}%`, backgroundColor: subject.color }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t border-line-soft pt-2">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-muted">Studied</p>
                      <p className="text-[11px] font-semibold text-ink">{hoursStudied.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-muted">Target</p>
                      <p className="text-[11px] font-semibold text-ink">{subject.targetHours}h</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-muted">Chapters</p>
                      <p className="text-[11px] font-semibold text-ink">{subject.completedChapters}/{subject.totalChapters}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-muted">Last studied</p>
                      <p className="text-[11px] font-semibold text-ink">{lastStudied ? formatDate(lastStudied.slice(0, 10)) : '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <ActionMenu
                    items={[
                      {
                        label: 'Edit',
                        icon: Edit3,
                        onClick: () => {
                          setForm({ ...subject });
                          setEditing(subject);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: 'Open sessions',
                        icon: Clock3,
                        onClick: () => navigate(`/study/sessions?subject=${subject.id}`),
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        danger: true,
                        onClick: () => setDeleteId(subject.id),
                      },
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => navigate(`/study/sessions?subject=${subject.id}`)}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] font-medium text-soft transition hover:text-ink"
                  >
                    View sessions <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit subject' : 'Add subject'}
        description="Give your subject a name, target hours and priority."
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => {
              const next: Subject = {
                ...form,
                id: form.id || uid('sub'),
                createdAt: form.id ? form.createdAt : new Date().toISOString(),
              };
              if (form.id) saveSubject(next);
              else createSubject(next);
            }}>
              {editing ? 'Save changes' : 'Create subject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Advanced React"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will you cover in this subject?"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Icon">
              <Select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                <option value="BookOpenText">Book</option>
                <option value="Code2">Code</option>
                <option value="Palette">Design</option>
                <option value="Network">Systems</option>
                <option value="Binary">Data</option>
                <option value="PenLine">Writing</option>
              </Select>
            </Field>
            <Field label="Color">
              <Select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                <option value="#6558D3">Indigo</option>
                <option value="#3B82F6">Blue</option>
                <option value="#DB2777">Pink</option>
                <option value="#16865C">Green</option>
                <option value="#D97757">Orange</option>
                <option value="#0891B2">Cyan</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SubjectPriority })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Target hours">
              <Input
                type="number"
                value={String(form.targetHours)}
                onChange={(e) => setForm({ ...form, targetHours: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Target date">
              <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const subject = state.subjects.find((s) => s.id === deleteId);
          if (subject) handleDelete(subject.id);
        }}
        title="Delete subject"
        description="This will remove the subject and its schedules. Sessions will be kept."
        confirmLabel="Delete"
        loading={false}
      />
    </div>
  );
}

function formatHours(minutes: number) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}
