import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  Download,
  Eye,
  File,
  FileText,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Plus,
  Table2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import type { AppDocument, DocumentCategory } from '../types';
import {
  cn,
  formatBytes,
  formatDate,
  nextSequence,
  todayISO,
  uid,
} from '../lib/utils';
import { getClient } from '../lib/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionCard, StatCard } from '../components/shared/cards';
import {
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  Field,
  FilterMenu,
  IconButton,
  Input,
  Modal,
  Progress,
  SearchInput,
  Select,
  Td,
  Textarea,
  Th,
  TableRow,
  useToast,
} from '../components/ui';

const CATEGORIES: DocumentCategory[] = [
  'Personal',
  'Client',
  'Project',
  'Invoice',
  'Receipt',
  'Contract',
  'Proposal',
  'Brand Asset',
  'Other',
];

const STORAGE_LIMIT = 512 * 1024 * 1024;

const categoryTone: Record<DocumentCategory, 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'orange'> = {
  Personal: 'green',
  Client: 'blue',
  Project: 'orange',
  Invoice: 'amber',
  Receipt: 'purple',
  Contract: 'red',
  Proposal: 'blue',
  'Brand Asset': 'orange',
  Other: 'gray',
};

const extIcon = (ext: string) => {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return Table2;
  if (['zip', 'rar', '7z'].includes(ext)) return Archive;
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return FileText;
  return File;
};

const extTint = (ext: string) => {
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/25';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/25';
  if (['zip', 'rar', '7z'].includes(ext)) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25';
  if (['pdf'].includes(ext)) return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/25';
  return 'text-soft bg-secondary border-line';
};

type ViewMode = 'grid' | 'list';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
}

export function DocumentsPage() {
  const { state, addDocuments, deleteDocument } = useAppData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory[]>([]);
  const [view, setView] = useState<ViewMode>('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AppDocument | null>(null);

  useEffect(() => {
    const upload = searchParams.get('upload');
    const docId = searchParams.get('doc');
    if (upload) setUploadOpen(true);
    if (docId) setViewingId(docId);
    if (upload || docId) {
      const next = new URLSearchParams(searchParams);
      next.delete('upload');
      next.delete('doc');
      next.delete('t');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const viewing = viewingId ? state.documents.find((document) => document.id === viewingId) ?? null : null;

  const usedBytes = useMemo(
    () => state.documents.reduce((total, document) => total + document.size, 0),
    [state.documents],
  );

  const stats = useMemo(() => {
    const categories = new Set(state.documents.map((document) => document.category));
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString().slice(0, 10);
    return {
      total: state.documents.length,
      used: usedBytes,
      categories: categories.size,
      recent: state.documents.filter((document) => document.uploadDate >= sinceISO).length,
    };
  }, [state.documents, usedBytes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.documents
      .filter((document) => {
        const client = getClient(state, document.clientId);
        const project = state.projects.find((item) => item.id === document.projectId);
        const haystack = `${document.name} ${document.category} ${client?.businessName ?? ''} ${project?.name ?? ''} ${document.ext}`.toLowerCase();
        return (!q || haystack.includes(q)) && (categoryFilter.length === 0 || categoryFilter.includes(document.category));
      })
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }, [state, search, categoryFilter]);

  const storagePct = Math.min(100, Math.round((usedBytes / STORAGE_LIMIT) * 1000) / 10);

  const handleDownload = (document: AppDocument) => {
    toast({ title: 'Download started', description: document.name });
  };

  const handleUploaded = (documents: AppDocument[]) => {
    addDocuments(documents);
    setUploadOpen(false);
    toast({
      title: documents.length > 1 ? 'Documents uploaded' : 'Document uploaded',
      description: documents.map((document) => document.name).join(', '),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Keep contracts, invoices, and project files in one place."
        badge={<Badge tone="gray">{stats.total} files</Badge>}
        actions={
          <Button variant="primary" size="md" onClick={() => setUploadOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload Document
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderOpen} label="All Documents" value={String(stats.total)} hint="Files in your workspace" />
        <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(stats.used)} hint={`of ${formatBytes(STORAGE_LIMIT)} available`} tone="accent" />
        <StatCard icon={FileText} label="Categories" value={String(stats.categories)} hint="Across your library" />
        <StatCard icon={UploadCloud} label="Recently Uploaded" value={String(stats.recent)} hint="In the last 30 days" />
      </div>

      <SectionCard
        title="Storage"
        description={`${formatBytes(stats.used)} used of ${formatBytes(STORAGE_LIMIT)}`}
        action={<span className="text-[11px] font-medium text-ink">{storagePct}%</span>}
      >
        <Progress value={storagePct} className="mt-1" />
        <p className="mt-2 text-[10px] text-muted">
          {storagePct < 70 ? 'You have plenty of room for new documents.' : 'Consider archiving older files to free up space.'}
        </p>
      </SectionCard>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search documents…" className="w-full sm:w-56" />
          <FilterMenu
            label="Category"
            options={CATEGORIES.map((category) => ({
              value: category,
              label: category,
              count: state.documents.filter((document) => document.category === category).length,
            }))}
            selected={categoryFilter}
            onChange={setCategoryFilter}
            onClear={() => setCategoryFilter([])}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-line bg-card p-0.5 shadow-card">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                view === 'grid' ? 'bg-secondary text-ink' : 'text-muted hover:text-soft',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                view === 'list' ? 'bg-secondary text-ink' : 'text-muted hover:text-soft',
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="secondary" size="md" onClick={() => setUploadOpen(true)}>
            <UploadCloud className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents found"
          description="Upload contracts, invoices, or brand assets to keep everything organised."
          action={
            <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
              <UploadCloud className="h-3.5 w-3.5" />
              Upload document
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((document) => {
            const client = getClient(state, document.clientId);
            const project = state.projects.find((item) => item.id === document.projectId);
            const Icon = extIcon(document.ext);
            return (
              <div
                key={document.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewingId(document.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setViewingId(document.id);
                  }
                }}
                className="group flex cursor-pointer flex-col rounded-xl border border-line bg-card p-4 text-left shadow-card transition-all hover:border-line-soft hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', extTint(document.ext))}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div onClick={(event) => event.stopPropagation()}>
                    <ActionMenu
                      label={`Actions for ${document.name}`}
                      items={[
                        { label: 'Preview', icon: Eye, onClick: () => setViewingId(document.id) },
                        { label: 'Download', icon: Download, onClick: () => handleDownload(document) },
                        { label: 'Delete', icon: Trash2, onClick: () => setDeleting(document), danger: true, separator: true },
                      ]}
                    />
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 min-h-[32px] text-[12px] font-medium leading-snug text-ink" title={document.name}>
                  {document.name}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge tone={categoryTone[document.category]}>{document.category}</Badge>
                  <span className="text-[9.5px] text-muted">{formatBytes(document.size)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                  <span className="truncate text-[9.5px] text-muted">
                    {client?.businessName ?? project?.name ?? 'Personal'}
                  </span>
                  <span className="shrink-0 text-[9.5px] text-muted">{formatDate(document.uploadDate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
          <DataTable minWidth={960}>
            <thead>
              <tr>
                <Th>Document Name</Th>
                <Th>Category</Th>
                <Th>Linked To</Th>
                <Th align="right">Size</Th>
                <Th>Upload Date</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((document) => {
                const client = getClient(state, document.clientId);
                const project = state.projects.find((item) => item.id === document.projectId);
                const Icon = extIcon(document.ext);
                return (
                  <TableRow key={document.id} onClick={() => setViewingId(document.id)}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', extTint(document.ext))}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate text-[11px] font-medium text-ink">{document.name}</p>
                          <p className="text-[9.5px] uppercase text-muted">{document.ext}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><Badge tone={categoryTone[document.category]}>{document.category}</Badge></Td>
                    <Td><span className="text-[10.5px] text-soft">{client?.businessName ?? project?.name ?? 'Personal'}</span></Td>
                    <Td align="right"><span className="text-[10.5px] text-soft">{formatBytes(document.size)}</span></Td>
                    <Td><span className="whitespace-nowrap text-[10.5px]">{formatDate(document.uploadDate)}</span></Td>
                    <Td align="right">
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <ActionMenu
                          label={`Actions for ${document.name}`}
                          items={[
                            { label: 'Preview', icon: Eye, onClick: () => setViewingId(document.id) },
                            { label: 'Download', icon: Download, onClick: () => handleDownload(document) },
                            { label: 'Delete', icon: Trash2, onClick: () => setDeleting(document), danger: true, separator: true },
                          ]}
                        />
                      </div>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      )}

      {uploadOpen && (
        <UploadDocumentDrawer
          nextNumber={nextSequence(state.documents.map((document) => document.id), 'DOC')}
          onClose={() => setUploadOpen(false)}
          onUploaded={handleUploaded}
        />
      )}

      {viewing && (
        <DocumentPreviewModal
          document={viewing}
          onClose={() => setViewingId(null)}
          onDownload={() => handleDownload(viewing)}
          onDelete={() => {
            setViewingId(null);
            setDeleting(viewing);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteDocument(deleting.id);
            toast({ title: 'Document deleted', description: deleting.name });
          }
          setDeleting(null);
        }}
        title="Delete this document?"
        description={deleting ? `${deleting.name} (${formatBytes(deleting.size)}) will be permanently removed.` : ''}
        confirmLabel="Delete document"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

function DocumentPreviewModal({
  document,
  onClose,
  onDownload,
  onDelete,
}: {
  document: AppDocument;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const { state } = useAppData();
  const client = getClient(state, document.clientId);
  const project = state.projects.find((item) => item.id === document.projectId);
  const Icon = extIcon(document.ext);

  return (
    <Modal
      open
      onClose={onClose}
      title="Document preview"
      description={`${document.id} · ${document.category}`}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger hover:bg-danger/10 hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            <Button variant="primary" size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-secondary/40 px-4 py-9 text-center">
          <span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl border', extTint(document.ext))}>
            <Icon className="h-6 w-6" />
          </span>
          <p className="mt-3 max-w-sm break-words text-[12.5px] font-medium text-ink">{document.name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
            {document.ext} · {formatBytes(document.size)}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onDownload}>
            <Download className="h-3.5 w-3.5" /> Download file
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Category</dt>
            <dd className="mt-1"><Badge tone={categoryTone[document.category]}>{document.category}</Badge></dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Uploaded</dt>
            <dd className="mt-1 text-[11.5px] text-ink">{formatDate(document.uploadDate)}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Client</dt>
            <dd className="mt-1 text-[11.5px] text-ink">{client?.businessName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Project</dt>
            <dd className="mt-1 text-[11.5px] text-ink">{project?.name ?? '—'}</dd>
          </div>
        </dl>

        <div>
          <p className="text-[9.5px] uppercase tracking-[0.08em] text-muted">Notes</p>
          <p className="mt-1 rounded-lg border border-line bg-secondary/30 p-2.5 text-[11px] leading-relaxed text-soft">
            {document.notes || 'No notes attached to this document.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload                                                                     */
/* -------------------------------------------------------------------------- */

function UploadDocumentDrawer({
  nextNumber,
  onClose,
  onUploaded,
}: {
  nextNumber: number;
  onClose: () => void;
  onUploaded: (documents: AppDocument[]) => void;
}) {
  const { state } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('Personal');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const completedRef = useRef(false);

  const projects = clientId ? state.projects.filter((project) => project.clientId === clientId) : state.projects;

  useEffect(() => {
    if (!uploading) return;
    const timer = window.setInterval(() => {
      setFiles((current) =>
        current.map((item) => ({
          ...item,
          progress: Math.min(100, item.progress + 8 + Math.random() * 16),
        })),
      );
    }, 170);
    return () => window.clearInterval(timer);
  }, [uploading]);

  useEffect(() => {
    if (!uploading || completedRef.current || files.length === 0) return;
    if (!files.every((item) => item.progress >= 100)) return;
    completedRef.current = true;
    const timer = window.setTimeout(() => {
      onUploaded(
        files.map((item, index) => ({
          id: `DOC-${String(nextNumber + index).padStart(3, '0')}`,
          name: item.file.name,
          category,
          size: item.file.size,
          ext: item.file.name.split('.').pop()?.toLowerCase() ?? 'file',
          clientId: clientId || undefined,
          projectId: projectId || undefined,
          uploadDate: todayISO(),
          notes: notes.trim(),
        })),
      );
    }, 420);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, uploading]);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (!list.length) return;
    const tooLarge = list.find((file) => file.size > 25 * 1024 * 1024);
    if (tooLarge) {
      setError(`${tooLarge.name} is larger than 25 MB.`);
      return;
    }
    setError('');
    setFiles((current) => [
      ...current,
      ...list.map((file) => ({ id: uid('upload'), file, progress: 0 })),
    ]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const totalSize = files.reduce((total, item) => total + item.file.size, 0);

  return (
    <Drawer
      open
      onClose={() => {
        if (!uploading) onClose();
      }}
      title="Upload documents"
      description="Add files to your personal document library."
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-[10.5px] text-muted">
            {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} · ${formatBytes(totalSize)}` : 'No files selected'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={uploading}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={uploading}
              disabled={files.length === 0}
              onClick={() => {
                if (!files.length) return;
                setError('');
                setUploading(true);
              }}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors',
            dragging ? 'border-accent bg-accent-soft' : 'border-line bg-secondary/40 hover:border-line-soft',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card text-muted shadow-card">
            <UploadCloud className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-[11.5px] font-medium text-ink">
            Drag &amp; drop files here, or <span className="text-accent-strong">browse</span>
          </p>
          <p className="mt-1 text-[9.5px] text-muted">PDF, DOC, images, spreadsheets and archives · up to 25 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </div>
        {error && <p className="text-[10.5px] text-danger">{error}</p>}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((item) => {
              const Icon = extIcon(item.file.name.split('.').pop()?.toLowerCase() ?? 'file');
              return (
                <div key={item.id} className="rounded-lg border border-line bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-secondary/60 text-muted">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-medium text-ink">{item.file.name}</p>
                      <p className="text-[9px] text-muted">{formatBytes(item.file.size)}</p>
                    </div>
                    {!uploading && (
                      <IconButton
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => setFiles((current) => current.filter((file) => file.id !== item.id))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </IconButton>
                    )}
                    {uploading && (
                      <span className="text-[9.5px] font-medium text-muted">{Math.round(item.progress)}%</span>
                    )}
                  </div>
                  {uploading && <Progress value={item.progress} className="mt-2" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory)}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Client" hint="Optional">
            <Select
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                setProjectId('');
              }}
            >
              <option value="">No client</option>
              {state.clients.map((client) => (
                <option key={client.id} value={client.id}>{client.businessName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Project" hint="Optional" className="sm:col-span-2">
            <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What is this document for?"
            className="min-h-[64px]"
          />
        </Field>

        <div className="flex items-start gap-2 rounded-lg border border-line bg-secondary/40 p-3 text-[10px] leading-relaxed text-muted">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Files are stored as workspace metadata in this demo. Uploading simulates the storage flow end to end.
        </div>
      </div>
    </Drawer>
  );
}
