import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  StudyEvent,
  StudyNote,
  StudyResource,
  StudySchedule,
  StudySession,
  StudySettings,
  StudyState,
  Subject,
} from '../types';
import { createStudySeed } from '../data/studySeed';
import { applyTheme, readStoredTheme } from '../lib/theme';
import { uid } from '../lib/utils';

const STORAGE_KEY = 'personal-tracker:study-state:v1';

function mergeSettings(base: StudySettings, patch?: Partial<StudySettings>): StudySettings {
  return {
    ...base,
    ...patch,
    profile: { ...base.profile, ...(patch?.profile ?? {}) },
    goals: { ...base.goals, ...(patch?.goals ?? {}) },
    theme: readStoredTheme(patch?.theme ?? base.theme),
  };
}

function loadState(): StudyState {
  const seed = createStudySeed();
  seed.settings.theme = readStoredTheme(seed.settings.theme);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return {
      ...seed,
      ...parsed,
      subjects: parsed.subjects ?? seed.subjects,
      schedules: parsed.schedules ?? seed.schedules,
      sessions: parsed.sessions ?? seed.sessions,
      notes: parsed.notes ?? seed.notes,
      resources: parsed.resources ?? seed.resources,
      events: parsed.events ?? seed.events,
      settings: mergeSettings(seed.settings, parsed.settings),
    };
  } catch {
    return seed;
  }
}

interface StudyDataContextValue {
  state: StudyState;
  isLoading: boolean;
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  addSchedule: (schedule: StudySchedule) => void;
  updateSchedule: (schedule: StudySchedule) => void;
  deleteSchedule: (id: string) => void;
  addSession: (session: StudySession) => void;
  updateSession: (session: StudySession) => void;
  deleteSession: (id: string) => void;
  addNote: (note: StudyNote) => void;
  updateNote: (note: StudyNote) => void;
  deleteNote: (id: string) => void;
  addResource: (resource: StudyResource) => void;
  updateResource: (resource: StudyResource) => void;
  deleteResource: (id: string) => void;
  addEvent: (event: StudyEvent) => void;
  updateEvent: (event: StudyEvent) => void;
  deleteEvent: (id: string) => void;
  updateSettings: (patch: Partial<StudySettings>) => void;
  resetData: () => void;
}

const StudyDataContext = createContext<StudyDataContextValue | null>(null);

export function StudyDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(loadState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persist in memory if browser storage is full or unavailable.
    }
  }, [state]);

  useEffect(() => {
    applyTheme(state.settings.theme);
  }, [state.settings.theme]);

  const addSubject = useCallback((subject: Subject) => {
    setState((prev) => ({ ...prev, subjects: [subject, ...prev.subjects] }));
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((item) => (item.id === subject.id ? subject : item)),
    }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((item) => item.id !== id),
      schedules: prev.schedules.filter((item) => item.subjectId !== id),
      sessions: prev.sessions.filter((item) => item.subjectId !== id),
      notes: prev.notes.map((item) =>
        item.subjectId === id ? { ...item, subjectId: undefined } : item,
      ),
      resources: prev.resources.map((item) =>
        item.subjectId === id ? { ...item, subjectId: undefined } : item,
      ),
    }));
  }, []);

  const addSchedule = useCallback((schedule: StudySchedule) => {
    setState((prev) => ({ ...prev, schedules: [...prev.schedules, schedule] }));
  }, []);

  const updateSchedule = useCallback((schedule: StudySchedule) => {
    setState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((item) => (item.id === schedule.id ? schedule : item)),
    }));
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((item) => item.id !== id),
    }));
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      subjects: prev.subjects.map((subject) =>
        subject.id === session.subjectId
          ? { ...subject, lastStudied: session.date }
          : subject,
      ),
    }));
  }, []);

  const updateSession = useCallback((session: StudySession) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((item) => (item.id === session.id ? session : item)),
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((item) => item.id !== id),
    }));
  }, []);

  const addNote = useCallback((note: StudyNote) => {
    setState((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
  }, []);

  const updateNote = useCallback((note: StudyNote) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((item) => (item.id === note.id ? note : item)),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((prev) => ({ ...prev, notes: prev.notes.filter((item) => item.id !== id) }));
  }, []);

  const addResource = useCallback((resource: StudyResource) => {
    setState((prev) => ({ ...prev, resources: [resource, ...prev.resources] }));
  }, []);

  const updateResource = useCallback((resource: StudyResource) => {
    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((item) => (item.id === resource.id ? resource : item)),
    }));
  }, []);

  const deleteResource = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      resources: prev.resources.filter((item) => item.id !== id),
    }));
  }, []);

  const addEvent = useCallback((event: StudyEvent) => {
    setState((prev) => ({
      ...prev,
      events: [...prev.events, event].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, []);

  const updateEvent = useCallback((event: StudyEvent) => {
    setState((prev) => ({
      ...prev,
      events: prev.events
        .map((item) => (item.id === event.id ? event : item))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((prev) => ({ ...prev, events: prev.events.filter((item) => item.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<StudySettings>) => {
    setState((prev) => ({ ...prev, settings: mergeSettings(prev.settings, patch) }));
  }, []);

  const resetData = useCallback(() => {
    setState(createStudySeed());
  }, []);

  const value = useMemo<StudyDataContextValue>(
    () => ({
      state,
      isLoading,
      addSubject,
      updateSubject,
      deleteSubject,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addSession,
      updateSession,
      deleteSession,
      addNote,
      updateNote,
      deleteNote,
      addResource,
      updateResource,
      deleteResource,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      resetData,
    }),
    [
      state,
      isLoading,
      addSubject,
      updateSubject,
      deleteSubject,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addSession,
      updateSession,
      deleteSession,
      addNote,
      updateNote,
      deleteNote,
      addResource,
      updateResource,
      deleteResource,
      addEvent,
      updateEvent,
      deleteEvent,
      updateSettings,
      resetData,
    ],
  );

  return <StudyDataContext.Provider value={value}>{children}</StudyDataContext.Provider>;
}

export function useStudyData() {
  const context = useContext(StudyDataContext);
  if (!context) throw new Error('useStudyData must be used inside StudyDataProvider');
  return context;
}

export function newStudyId(prefix: string) {
  return uid(prefix);
}
