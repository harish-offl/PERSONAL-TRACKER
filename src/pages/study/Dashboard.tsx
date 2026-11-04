import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  Flame,
  NotebookPen,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import {
  formatHours,
  hourDecimal,
  parseISODate,
  relativeDate,
  sessionsBetween,
  shortWeekdays,
  startOfWeek,
  subjectMap,
  todayISO,
  totalMinutes,
  weekDates,
  weekdayNames,
} from '../../lib/study';
import { Panel, SectionHead, StatCard, SubjectIcon } from '../../components/study/shared';
import { Progress } from '../../components/ui';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function StudyDashboardPage() {
  const { state } = useStudyData();
  const { subjects, sessions, schedules, notes, events, settings } = state;
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const weekEnd = weekDates(today)[6];
  const todaySessions = sessions.filter((session) => session.date === today);
  const weekSessions = sessionsBetween(sessions, weekStart, weekEnd);
  const todayMinutes = totalMinutes(todaySessions);
  const weekMinutes = totalMinutes(weekSessions);
  const avgProgress = subjects.length
    ? Math.round(subjects.reduce((sum, subject) => sum + subject.progress, 0) / subjects.length)
    : 0;
  const todaySchedule = schedules
    .filter((schedule) => schedule.day === new Date().getDay())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcoming = events
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const pinned = notes.filter((note) => note.pinned).slice(0, 2);
  const recentNotes = pinned.length ? pinned : notes.slice(0, 2);
  const subjectsById = subjectMap(subjects);
  const weeklyTarget = settings.goals.weeklyHours;
  const weeklyPct = Math.min(100, Math.round((weekMinutes / (weeklyTarget * 60 || 1)) * 100));

  const weekData = weekDates(today).map((date, index) => {
    const daySessions = sessions.filter((session) => session.date === date);
    return {
      day: shortWeekdays[parseISODate(date).getDay()],
      hours: hourDecimal(totalMinutes(daySessions)),
      target: settings.goals.dailyHours,
      active: date === today,
      index,
    };
  });

  const trendData = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - index) * 7);
    const start = startOfWeek(date.toISOString().slice(0, 10));
    const end = weekDates(start)[6];
    return {
      week: `${date.getDate()}/${date.getMonth() + 1}`,
      hours: hourDecimal(totalMinutes(sessionsBetween(sessions, start, end))),
    };
  });

  const completedToday = todaySessions.filter((session) => session.completed).length;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-strong">
            {weekdayNames[new Date().getDay()]}, {parseISODate(today).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1.5 text-[27px] font-semibold leading-tight tracking-[-0.05em] sm:text-[31px]">
            {greeting()}, {settings.profile.name}.
          </h1>
          <p className="mt-1 text-[12px] text-soft">
            {todayMinutes
              ? `${formatHours(todayMinutes)} of focus already logged. Keep the thread.`
              : 'A clear mind and one good block of attention is enough to begin.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/study/timer"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-[12px] font-medium text-white shadow-sm transition hover:bg-accent-hover"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Start focus
          </Link>
          <Link
            to="/study/sessions?create=1"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-card px-3.5 text-[12px] font-medium text-ink shadow-card transition hover:bg-secondary"
          >
            Log session
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={formatHours(todayMinutes)}
          detail={`${completedToday} focused session${completedToday === 1 ? '' : 's'} · goal ${settings.goals.dailyHours}h`}
          icon={Clock3}
        />
        <StatCard
          label="This week"
          value={formatHours(weekMinutes)}
          detail={`${weeklyPct}% of ${weeklyTarget}h weekly goal`}
          icon={TrendingUp}
          tone="info"
        />
        <StatCard
          label="Current streak"
          value={`${Math.max(1, weekSessions.length ? new Set(weekSessions.map((s) => s.date)).size : 0)} days`}
          detail="Consistency measured by real sessions"
          icon={Flame}
          tone="warning"
        />
        <StatCard
          label="Avg. completion"
          value={`${avgProgress}%`}
          detail={`Across ${subjects.length} active subjects`}
          icon={Target}
          tone="success"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel>
          <SectionHead
            title="This week's rhythm"
            subtitle="Hours studied against your daily target"
            action={
              <Link to="/study/progress" className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-strong">
                Full report <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barCategoryGap={16} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border-secondary)" strokeDasharray="3 5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-secondary)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    boxShadow: '0 12px 30px -12px rgba(0,0,0,.18)',
                  }}
                  formatter={(value: number) => [`${value}h`, 'Studied']}
                />
                <Bar dataKey="target" fill="var(--border-secondary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
            <span className="flex items-center gap-2 text-[9.5px] text-muted">
              <span className="h-2 w-2 rounded-sm bg-accent" /> Focus hours
              <span className="ml-2 h-2 w-2 rounded-sm bg-secondary" /> Daily target
            </span>
            <span className="text-[9.5px] text-muted">{formatHours(weekMinutes)} / {weeklyTarget}h</span>
          </div>
        </Panel>

        <Panel>
          <SectionHead
            title="Today's plan"
            subtitle={`${todaySchedule.length} scheduled block${todaySchedule.length === 1 ? '' : 's'}`}
            action={
              <Link to="/study/timetable" className="text-[10px] font-semibold text-accent-strong">
                Timetable
              </Link>
            }
          />
          {todaySchedule.length ? (
            <div className="space-y-2.5">
              {todaySchedule.map((schedule) => {
                const subject = subjectsById.get(schedule.subjectId);
                return (
                  <div key={schedule.id} className="flex items-center gap-3 rounded-xl border border-line-soft bg-app/50 p-2.5">
                    <SubjectIcon name={subject?.icon ?? 'BookOpenText'} color={subject?.color ?? '#6558D3'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold">{subject?.name ?? 'General study'}</p>
                      <p className="truncate text-[9.5px] text-muted">{schedule.notes || 'Focused study block'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold">{schedule.startTime}</p>
                      <p className="text-[8.5px] text-muted">to {schedule.endTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-line text-center">
              <CalendarDays className="h-4 w-4 text-muted" />
              <p className="mt-2 text-[10.5px] font-medium">No blocks planned today</p>
              <Link to="/study/timetable" className="mt-1 text-[9.5px] font-semibold text-accent-strong">
                Plan a study block
              </Link>
            </div>
          )}
          <div className="mt-3 rounded-xl bg-accent-soft p-3">
            <div className="flex items-center justify-between text-[9.5px] font-semibold text-accent-strong">
              <span>Weekly goal</span>
              <span>{weeklyPct}%</span>
            </div>
            <Progress value={weeklyPct} className="mt-2 bg-white/60" />
            <p className="mt-2 text-[9px] text-soft">
              {Math.max(0, weeklyTarget * 60 - weekMinutes) > 0
                ? `${formatHours(weeklyTarget * 60 - weekMinutes)} left to hit your target.`
                : 'Weekly target reached. Protect the recovery time.'}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Panel>
          <SectionHead
            title="Subject momentum"
            subtitle="Completion and recency across your active learning"
            action={
              <Link to="/study/subjects" className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-strong">
                All subjects <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="space-y-3">
            {subjects.slice(0, 5).map((subject) => (
              <div key={subject.id} className="flex items-center gap-3">
                <SubjectIcon name={subject.icon} color={subject.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-semibold">{subject.name}</p>
                    <span className="text-[10px] font-semibold" style={{ color: subject.color }}>
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${subject.progress}%`, backgroundColor: subject.color }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-muted">
                    {subject.completedChapters}/{subject.totalChapters} chapters
                    {subject.lastStudied ? ` · ${relativeDate(subject.lastStudied)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <SectionHead title="Upcoming" subtitle="Keep the important dates visible" />
            {upcoming.length ? (
              <div className="space-y-2">
                {upcoming.map((event) => (
                  <Link
                    key={event.id}
                    to="/study/calendar"
                    className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
                      <span className="text-[8px] font-semibold uppercase text-muted">
                        {parseISODate(event.date).toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="-mt-0.5 text-[12px] font-semibold">{parseISODate(event.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-semibold">{event.title}</p>
                      <p className="text-[9px] text-muted">{event.type} · {relativeDate(event.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-5 text-center text-[10.5px] text-muted">No upcoming dates yet.</p>
            )}
          </Panel>

          <Panel className="bg-[linear-gradient(135deg,var(--bg-card),var(--accent-soft))]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent bg-card text-accent shadow-sm">
                <BookOpenText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold">A small prompt</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-soft">
                  Before your next session, write one sentence about what you want to understand better.
                  End by writing what changed.
                </p>
                <Link to="/study/notes" className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-accent-strong">
                  Open notes <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel>
          <SectionHead
            title="Recent notes"
            subtitle="Ideas you decided were worth keeping"
            action={
              <Link to="/study/notes" className="text-[10px] font-semibold text-accent-strong">
                All notes
              </Link>
            }
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                to={`/study/notes?note=${note.id}`}
                className="group rounded-xl border border-line-soft bg-app/40 p-3 transition hover:border-accent hover:bg-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <NotebookPen className="h-3.5 w-3.5 text-accent" />
                  {note.pinned && <span className="text-[8px] font-semibold uppercase tracking-wide text-warning">Pinned</span>}
                </div>
                <p className="mt-2 line-clamp-1 text-[10.5px] font-semibold">{note.title}</p>
                <p className="mt-1 line-clamp-2 text-[9.5px] leading-relaxed text-muted">{note.content}</p>
                <p className="mt-2 text-[8.5px] text-muted">{relativeDate(note.updatedAt.slice(0, 10))}</p>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Eight-week trend" subtitle="Total focused time by week" />
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 2, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border-secondary)" strokeDasharray="3 5" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                  }}
                  formatter={(value: number) => [`${value}h`, 'Focused']}
                />
                <Area type="monotone" dataKey="hours" stroke="var(--accent)" strokeWidth={2} fill="url(#studyTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

