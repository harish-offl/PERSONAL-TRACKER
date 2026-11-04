import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Trash2, Edit3, Share2, Link, Copy, Download, Eye, BookOpenText, Clock3 } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudyResource, Subject } from '../../types';
import { relativeDate, subjectMap, subjectName } from '../../lib/study';
import { uid, formatBytes } from '../../lib/utils';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard, Tag } from '../../components/study/shared';
import {
  Button, ConfirmDialog, DataTable, EmptyState, Field, Input, Modal, Select, Td, Th, TableRow, useToast,
} from '../../components/ui';

export function StudyResourcesPage() {
  const { state, addResource, updateResource, deleteResource } = useStudyData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subjects, resources } = state;
  const byId = subjectMap(subjects);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudyResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState<StudyResource | null>(null);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (subjectFilter && r.subjectId !== subjectFilter) return false;
      if (search && !(r.title + ' ' + r.description).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [resources, search, subjectFilter]);

  const pdfCount = resources.filter((r) => r.fileType === 'application/pdf').length;
  const sharedCount = resources.filter((r) => r.share?.enabled).length;

  const initial: StudyResource = {
    id: '',
    title: '',
    subjectId: '',
    description: '',
    tags: [],
    fileName: '',
    fileType: '',
    fileSize: 0,
    uploadedAt: new Date().toISOString(),
  };
  const [form, setForm] = useState<StudyResource>({ ...initial });
  const [file, setFile] = useState<File | null>(null);

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }));

  function save(resource: StudyResource) {
    updateResource(resource);
    toast('Resource updated', 'success');
    setEditing(null);
    setFormOpen(false);
  }
  function create(resource: StudyResource) {
    addResource(resource);
    toast('Resource added', 'success');
    setFormOpen(false);
  }
  function handleDelete(id: string) {
    deleteResource(id);
    toast('Resource removed', 'success');
    setDeleteId(null);
  }
  function toggleShare(resource: StudyResource) {
    const next = { ...resource, share: resource.share ? { ...resource.share, enabled: !resource.share.enabled } : { token: uid('share'), enabled: true, createdAt: new Date().toISOString() } };
    updateResource(next);
    toast(next.share!.enabled ? 'Sharing enabled' : 'Sharing disabled', 'success');
    setShareOpen(null);
  }
  function setExpiration(resource: StudyResource, expiresAt: string) {
    const next = { ...resource, share: resource.share ? { ...resource.share, expiresAt: expiresAt || undefined } : { token: uid('share'), enabled: true, expiresAt: expiresAt || undefined, createdAt: new Date().toISOString() } };
    updateResource(next);
    toast('Expiration updated', 'success');
    setShareOpen(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Study"
        title="PDF Library"
        description="Upload, preview and share your study resources."
        action={
          <Button variant="primary" size="sm" onClick={() => setForm({ ...initial, id: '' })}>
            <FileText className="mr-2 h-3.5 w-3.5" /> Upload resource
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Resources" value={String(resources.length)} icon={BookOpenText} />
        <StatCard label="PDFs" value={String(pdfCount)} icon={FileText} />
        <StatCard label="Shared" value={String(sharedCount)} icon={Share2} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources…" className="w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Field label="Subject">
            <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map((o) => (<option key={o.value} value={o.id}>{o.label}</option>))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card shadow-card">
        <DataTable minWidth={700}>
          <thead>
            <tr>
              <Th>Resource</Th>
              <Th>Subject</Th>
              <Th align="right">Size</Th>
              <Th>Uploaded</Th>
              <Th align="center" className="w-16">Share</Th>
              <Th align="center" className="w-24">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-10 text-muted">
                  <EmptyState icon={FileText} title="No resources" description="Upload PDFs, documents or notes to build your library." action={
                    <Button variant="secondary" size="sm" onClick={() => setForm({ ...initial, id: '' })}>Upload resource</Button>
                  } className="border-0 bg-transparent py-6" />
                </Td>
              </tr>
            ) : (
              filtered.map((resource) => {
                const subj = byId.get(resource.subjectId ?? '');
                const isPdf = resource.fileType === 'application/pdf';
                const share = resource.share;
                const expired = share?.expiresAt && new Date(share.expiresAt) < new Date();
                return (
                  <TableRow key={resource.id} onClick={() => {
                    if (resource.dataUrl) window.open(resource.dataUrl, '_blank');
                  }}>
                    <Td>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-medium text-ink">{resource.title}</p>
                          <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-muted">{resource.description}</p>
                          <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium', isPdf ? 'border-accent/40 bg-accent-soft text-accent-strong' : 'border-line-soft bg-secondary/50 text-muted')}>
                            {isPdf ? <FileText className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />} {resource.fileName.split('.').pop()?.toUpperCase() ?? 'FILE'}
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted text-[11px]">{subj?.name ?? 'General'}</Td>
                    <Td align="right" className="text-[11px] font-mono text-muted">{formatBytes(resource.fileSize)}</Td>
                    <Td className="text-[11px] text-muted">{relativeDate(resource.uploadedAt)}</Td>
                    <Td align="center">
                      <button
                        type="button"
                        className={cn('rounded-md p-1.5 transition', (share?.enabled && !expired) ? 'text-success hover:bg-success/10' : 'text-muted hover:bg-card hover:text-ink')}
                        onClick={(e) => { e.stopPropagation(); setShareOpen(resource); }}
                        aria-label="Manage sharing"
                        title={expired ? 'Link expired' : (share?.enabled ? 'Shared' : 'Not shared')}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </Td>
                    <Td align="center">
                      <Button variant="ghost" size="icon-sm" onClick={() => {
                        if (resource.dataUrl) { const a = document.createElement('a'); a.href = resource.dataUrl; a.download = resource.fileName; a.click(); }
                        else toast('No file data available', 'error');
                      }}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setForm({ ...resource }); setEditing(resource); setFormOpen(true); }}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" danger onClick={(e) => { e.stopPropagation(); setDeleteId(resource.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Td>
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
        title={editing ? 'Edit resource' : 'Upload resource'}
        description="Supports PDF, images and common document formats."
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => {
              const next: StudyResource = {
                ...form,
                id: form.id || uid('res'),
                tags: form.tags.filter(Boolean),
                fileName: file?.name || form.fileName,
                fileType: file?.type || form.fileType,
                fileSize: file?.size || form.fileSize,
                createdAt: form.id ? form.uploadedAt : new Date().toISOString(),
                uploadedAt: form.id ? form.uploadedAt : new Date().toISOString(),
              };
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  next.dataUrl = reader.result as string;
                  if (form.id) save(next); else create(next);
                };
                reader.readAsDataURL(file);
              } else {
                if (form.id) save(next); else create(next);
              }
            }}>
            {editing ? 'Save changes' : 'Upload'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resource title" />
          </Field>
          <Field label="Subject">
            <Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value || undefined })}>
              <option value="">No subject</option>
              {subjectOptions.map((o) => (<option key={o.value} value={o.value} style={{ color: o.color }}>{o.label}</option>))}
            </Select>
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this resource about?" />
          </Field>
          <Field label="File">
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f) setForm({ ...form, fileName: f.name, fileType: f.type, fileSize: f.size });
              }}
              className="block w-full text-sm text-muted file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-soft file:text-accent-strong"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <Input value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="react, reference, pdf" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={shareOpen !== null}
        onClose={() => setShareOpen(null)}
        title="Share resource"
        description="Generate a secure, revocable link for this PDF."
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShareOpen(null)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => {
              if (!shareOpen) return;
              if (shareOpen.share?.enabled) toggleShare(shareOpen);
              else toggleShare(shareOpen);
            }}>
              {shareOpen.share?.enabled ? 'Disable sharing' : 'Enable sharing'}
            </Button>
          </>
        }
      >
        {shareOpen && (
          <div className="space-y-4">
            <p className="text-[11.5px] font-medium text-ink">{shareOpen.title}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Public link</span>
              <span className={shareOpen.share?.enabled && !isExpired(shareOpen) ? 'text-success' : 'text-muted'}>{shareOpen.share?.token ? `https://personal.tracker/share/${shareOpen.share.token}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Status</span>
              <Badge tone={shareOpen.share?.enabled && !isExpired(shareOpen) ? 'green' : 'gray'}>{shareOpen.share?.enabled && !isExpired(shareOpen) ? 'Active' : 'Inactive'}</Badge>
            </div>
            <Field label="Link expiration (optional)">
              <Input type="date" value={shareOpen.share?.expiresAt ?? ''} onChange={(e) => setExpiration(shareOpen, e.target.value)} />
            </Field>
            <p className="text-[9.5px] text-soft">Sharing is off by default. Only enable it for resources you want to share.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          const r = state.resources.find((x) => x.id === deleteId);
          if (r) handleDelete(r.id);
        }}
        title="Delete resource"
        description="This removes the resource from your library."
        confirmLabel="Delete"
      />
    </div>
  );
}

function isExpired(resource: StudyResource) {
  return resource.share?.expiresAt ? new Date(resource.share.expiresAt) < new Date() : false;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
