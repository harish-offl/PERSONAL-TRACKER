import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotebookPen, Search, Trash2, Edit3, Pin, Tag as TagIcon, BookOpenText, ChevronRight, Clock3 } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudyNote, Subject } from '../../types';
import { relativeDate, subjectMap, subjectName } from '../../lib/study';
import { cn, uid, formatDate } from '../../lib/utils';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import { Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, Select, Td, Th, TableRow, useToast } from '../../components/ui';

export function StudyNotesPage() {
  const { state, addNote, updateNote, deleteNote } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subjects, notes } = state;
  const byId = subjectMap(subjects);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [showPinned, setShowPinned] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      if (!showPinned && note.pinned) return false;
      if (subjectFilter && note.subjectId !== subjectFilter) return false;
      if (search && !(note.title + ' ' + note.content).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : (a.pinned ? -1 : 1)));
  }, [notes, search, subjectFilter, showPinned]);

  const total = filtered.length;
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const uniqueSubjects = new Set(notes.map((n) => n.subjectId).filter(Boolean)).size;

  const initial: StudyNote = {
    id: '',
    subjectId: '',
    title: '',
    content: '',
    tags: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const [form, setForm] = useState<StudyNote>({ ...initial });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Autosave draft to sessionStorage as user types.
  const draftKey = 'personal-tracker:note-draft';
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw && !form.id) {
        const draft = JSON.parse(raw);
        setForm(draft);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (form.id || !form.title && !form.content) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(form)); } catch {}
  }, [form]);

  function save(note: StudyNote) {
    updateNote(note);
    toast({ title: 'Note saved', variant: 'success' });
    setEditing(null);
    setFormOpen(false);
    try { sessionStorage.removeItem(draftKey); } catch {}
  }
  function create(note: StudyNote) {
    addNote(note);
    toast({ title: 'Note saved', variant: 'success' });
    setFormOpen(false);
    try { sessionStorage.removeItem(draftKey); } catch {}
  }
  function handleDelete(id: string) {
    deleteNote(id);
    toast({ title: 'Note saved', variant: 'success' });
    setDeleteId(null);
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notes"
        description="Capture ideas, organise by subject and pin what matters."
        actions={
          <Button variant="primary" size="sm" onClick={() => setForm({ ...initial, id: '' })}>
            <NotebookPen className="mr-2 h-3.5 w-3.5" /> New note
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total notes" value={String(notes.length)} detail="Saved notes" icon={BookOpenText} />
        <StatCard label="Subjects" value={String(uniqueSubjects)} detail="With notes" icon={NotebookPen} />
        <StatCard label="Recent" value={notes.length ? formatDate(notes[0].updatedAt) : '—'} detail="Last updated" icon={Clock3} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" className="w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Field label="Subject">
            <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink">
            <input type="checkbox" checked={showPinned} onChange={(e) => setShowPinned(e.target.checked)} className="h-3.5 w-3.5 rounded border-line accent-[var(--accent)]" />
            Pinned only
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <DataTable minWidth={700}>
          <thead>
            <tr>
              <Th>Note</Th>
              <Th>Subject</Th>
              <Th>Tags</Th>
              <Th align="center" className="w-16">Pin</Th>
              <Th align="center" className="w-24">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted">
                  <EmptyState icon={NotebookPen} title="No notes" description="Create a note to capture an idea worth keeping." action={
                    <Button variant="secondary" size="sm" onClick={() => setForm({ ...initial, id: '' })}>New note</Button>
                  } className="border-0 bg-transparent py-6" />
                </td>
              </tr>
            ) : (
              filtered.map((note) => {
                const subj = byId.get(note.subjectId ?? '');
                return (
                  <TableRow key={note.id} onClick={() => navigate(`/study/notes?note=${note.id}`)}>
                    <Td>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-medium text-ink">{note.title}</p>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">{note.content}</p>
                        </div>
                        {note.pinned && <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-warning">Pinned</span>}
                      </div>
                    </Td>
                    <Td className="text-muted text-[11px]">{subj?.name ?? 'General'}</Td>
                    <Td className="text-[10px] text-muted">
                      {note.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded border border-line-soft px-1.5 py-0.5 text-[9px] font-medium">
                          <TagIcon className="h-3 w-3" /> {tag}
                        </span>
                      ))}
                    </Td>
                    <Td align="center">
                      <button
                        type="button"
                        className={note.pinned ? 'text-warning hover:bg-warning/10' : 'text-muted hover:bg-card hover:text-ink'}
                        onClick={(e) => { e.stopPropagation(); updateNote({ ...note, pinned: !note.pinned }); }}
                        aria-label="Toggle pin"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </Td>
                    <td align="center">
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setForm({ ...note }); setEditing(note); setFormOpen(true); }}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteId(note.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </td>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </DataTable>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit note' : 'New note'}
        description="Notes autosave as a draft while you type."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => {
              const next: StudyNote = {
                ...form,
                id: form.id || uid('note'),
                tags: form.tags.filter(Boolean),
                createdAt: form.id ? form.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              if (form.id) save(next); else create(next);
            }}>
              {editing ? 'Save changes' : 'Create note'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Note title" />
          </Field>
          <Field label="Subject">
            <Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value || undefined })}>
              <option value="">No subject</option>
              {subjectOptions.map((o) => (<option key={o.value} value={o.value} style={{ color: o.color }}>{o.label}</option>))}
            </Select>
          </Field>
          <Field label="Content">
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your notes here…"
              className="w-full min-h-[200px] resize-y border-line bg-card text-[13px] text-ink px-3 py-2 rounded-lg outline-none transition placeholder:text-muted focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <Input value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="react, architecture, notes" />
          </Field>
          <Field>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-ink">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="h-3.5 w-3.5 rounded border-line accent-[var(--accent)]" />
              Pin this note
            </label>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const n = state.notes.find((x) => x.id === deleteId);
          if (n) handleDelete(n.id);
        }}
        title="Delete note"
        description="This removes the note permanently."
        confirmLabel="Delete"
      />
    </div>
  );
}

