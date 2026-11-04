import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Timer, Clock, RefreshCw, StopCircle } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import type { StudySession, Subject } from '../../types';
import { timerSeconds, clock, todayISO, subjectMap, totalMinutes } from '../../lib/study';
import { uid } from '../../lib/utils';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import { Button, EmptyState, Field, Input, Modal, Select, useToast } from '../../components/ui';

type TimerMode = 'stopwatch' | 'pomodoro' | 'countdown';

const MODES: { value: TimerMode; label: string }[] = [
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'countdown', label: 'Countdown' },
];

const STORAGE_KEY = 'personal-tracker:active-timer';

export function StudyTimerPage() {
  const { state, addSession, updateSubject } = useStudyData();
  const { toast } = useToast() as any;
  const navigate = useNavigate();
  const { subjects, sessions } = state;
  const byId = subjectMap(subjects);

  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulated, setAccumulated] = useState(0);
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [round, setRound] = useState(1);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [countdownMinutes, setCountdownMinutes] = useState(25);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nowSeconds = timerSeconds(startedAt, accumulated);
  const displaySeconds = mode === 'countdown' ? Math.max(0, countdownMinutes * 60 - nowSeconds) : nowSeconds;
  const isPomodoro = mode === 'pomodoro';

  // Restore an in-progress timer from sessionStorage so it survives navigation.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload && payload.running && payload.startedAt) {
        const elapsed = timerSeconds(payload.startedAt, payload.accumulated);
        setMode(payload.mode ?? 'stopwatch');
        setSubjectId(payload.subjectId ?? '');
        setDescription(payload.description ?? '');
        setAccumulated(elapsed);
        setStartedAt(Date.now());
        setRunning(true);
        setTick(0);
        setPhase(payload.phase ?? 'focus');
        setRound(payload.round ?? 1);
        setPomodoroMinutes(payload.pomodoroMinutes ?? 25);
        setShortBreakMinutes(payload.shortBreakMinutes ?? 5);
        setLongBreakMinutes(payload.longBreakMinutes ?? 15);
        setCountdownMinutes(payload.countdownMinutes ?? 25);
      }
    } catch {
      // Ignore storage issues.
    }
  }, []);

  // Persist active timer state.
  useEffect(() => {
    if (running && startedAt) {
      const payload = {
        mode, subjectId, description, startedAt, accumulated, phase, round,
        pomodoroMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes,
        running: true,
      };
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
    }
  }, [running, startedAt, mode, subjectId, description, accumulated, phase, round, pomodoroMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes]);

  // Tick every second to force re-render while timer runs.
  useEffect(() => {
    if (!running || !startedAt) return;
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, startedAt]);

  // Auto-advance pomodoro phases.
  useEffect(() => {
    if (!running || !isPomodoro || !startedAt) return;
    const elapsed = timerSeconds(startedAt, accumulated);
    const limit = phase === 'focus' ? pomodoroMinutes : phase === 'shortBreak' ? shortBreakMinutes : longBreakMinutes;
    if (elapsed >= limit * 60) {
      if (phase === 'focus') {
        setRound((r) => r + 1);
        setPhase(round % 4 === 0 ? 'longBreak' : 'shortBreak');
        setStartedAt(Date.now());
        setAccumulated(0);
        setTick(0);
      } else {
        setPhase('focus');
        setStartedAt(Date.now());
        setAccumulated(0);
        setTick(0);
      }
    }
  }, [tick, running, startedAt, accumulated, isPomodoro, phase, round, pomodoroMinutes, shortBreakMinutes, longBreakMinutes]);

  // Countdown auto-stop.
  useEffect(() => {
    if (!running || mode !== 'countdown' || !startedAt) return;
    const elapsed = timerSeconds(startedAt, accumulated);
    if (elapsed >= countdownMinutes * 60) {
      setRunning(false);
      setStartedAt(null);
      setAccumulated(0);
      setTick(0);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      if (toast) toast({ title: '', variant: '' });
    }
  }, [tick, running, mode, startedAt, accumulated, countdownMinutes]);

  const totalToday = totalMinutes(sessions.filter((s) => s.date === todayISO()));

  function start() {
    if (running) return;
    setStartedAt(Date.now());
    setAccumulated(0);
    setTick(0);
    setRunning(true);
    if (mode === 'pomodoro') setPhase('focus');
  }

  function pause() {
    if (!running || !startedAt) return;
    setAccumulated(timerSeconds(startedAt, accumulated));
    setStartedAt(null);
    setRunning(false);
  }

  function resume() {
    if (running || startedAt === null) return;
    setStartedAt(Date.now());
    setTick(0);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setStartedAt(null);
    setAccumulated(0);
    setTick(0);
    setPhase('focus');
    setRound(1);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function finishSession() {
    if (!subjectId) {
      if (toast) toast({ title: '', variant: '' });
      return;
    }
    const secs = timerSeconds(startedAt, accumulated);
    if (secs < 10) {
      if (toast) toast({ title: '', variant: '' });
      return;
    }
    const now = new Date();
    const date = todayISO();
    const session: StudySession = {
      id: uid('ses'),
      subjectId,
      date,
      startTime: now.toTimeString().slice(0, 5),
      endTime: new Date(now.getTime() + secs * 1000).toTimeString().slice(0, 5),
      durationMinutes: Math.round(secs / 60),
      type: mode === 'pomodoro' ? 'Pomodoro' : mode === 'countdown' ? 'Countdown' : 'Stopwatch',
      notes: description,
      completed: true,
      createdAt: now.toISOString(),
    };
    addSession(session);
    const subj = byId.get(subjectId);
    if (subj) {
      updateSubject({ ...subj, progress: Math.min(100, (subj.progress || 0) + Math.round(secs / 60 / (subj.targetHours || 1) * 10)), lastStudied: date });
    }
    if (toast) toast({ title: '', variant: '' });
    stop();
    setDescription('');
  }

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Study Timer"
        description="Focused study sessions with Pomodoro, stopwatch and countdown modes."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/study/sessions')}>
            View sessions
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Session time" value={clock(displaySeconds)} detail="Running" icon={Timer} />
        <StatCard label="Today" value={formatHours(totalToday)} detail="Study time" icon={Clock} />
      </div>

      <Panel>
        <SectionHead title="Timer" subtitle="Keep going. One block at a time." />
        <div className="flex flex-col items-center justify-center gap-4 pt-6">
          <div className="relative">
            <span className="absolute -inset-1.5 rounded-[22px] bg-accent/10 blur blur-md" />
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-soft/40">
              <span className="text-[48px] font-semibold tracking-tighter text-ink tabular-nums">{clock(displaySeconds)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-muted">
            {isPomodoro && (
              <span className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short break' : 'Long break'} · Round {round}
              </span>
            )}
            <span>{mode === 'countdown' ? `${countdownMinutes}m countdown` : mode}</span>
          </div>
          <div className="flex gap-2">
            {!running ? (
              <Button variant="primary" size="lg" onClick={start} disabled={!subjectId}>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="lg" onClick={pause}>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
                <Button variant="outline" size="lg" onClick={finishSession}>
                  <StopCircle className="mr-2 h-4 w-4" /> Finish
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={stop} disabled={!running && displaySeconds === 0}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted">{running ? 'Timer is running in the background' : 'Ready when you are'}</p>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel>
          <SectionHead title="Mode" subtitle="Choose how you want to time your study." />
          <div className="space-y-2">
            {MODES.map((m) => {
              const active = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setMode(m.value); if (m.value === 'countdown') setStartedAt(Date.now()); }}
                  className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${active ? 'bg-accent-soft border-accent text-accent-strong' : 'text-soft hover:bg-card/60 hover:text-ink border-transparent'}`}
                >
                  <Timer className="h-4 w-4 shrink-0" />
                  <span>{m.label}</span>
                  {active && <span className="ml-auto w-2 h-2 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Subject" subtitle="What are you studying right now?" />
          <Field label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjectOptions.map((o) => (
                <option key={o.value} value={o.value} style={{ color: o.color }}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Session notes (optional)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you focusing on?" />
          </Field>
        </Panel>

        <Panel>
          <SectionHead title="Durations" subtitle="Customise Pomodoro and countdown lengths." />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">Study</span>
              <Input type="number" value={String(pomodoroMinutes)} onChange={(e) => setPomodoroMinutes(Number(e.target.value) || 25)} className="w-20" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">Short break</span>
              <Input type="number" value={String(shortBreakMinutes)} onChange={(e) => setShortBreakMinutes(Number(e.target.value) || 5)} className="w-20" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">Long break</span>
              <Input type="number" value={String(longBreakMinutes)} onChange={(e) => setLongBreakMinutes(Number(e.target.value) || 15)} className="w-20" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted">Countdown</span>
              <Input type="number" value={String(countdownMinutes)} onChange={(e) => setCountdownMinutes(Number(e.target.value) || 25)} className="w-20" />
            </div>
          </div>
        </Panel>
      </div>
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

