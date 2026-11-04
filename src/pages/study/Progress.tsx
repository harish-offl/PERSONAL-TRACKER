import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpenText, Clock3, Target, TrendingUp } from 'lucide-react';
import { useStudyData } from '../../context/StudyDataContext';
import { hourDecimal, monthKey, formatMonth, subjectMap, sessionsBetween, totalMinutes, todayISO, weekDates, startOfWeek } from '../../lib/study';
import { PageHeader } from '../../components/layout/PageHeader';
import { Panel, SectionHead, SubjectIcon, StatCard } from '../../components/study/shared';
import { Button, Badge, EmptyState, Progress } from '../../components/ui';

export function StudyProgressPage() {
  const { state } = useStudyData();
  const { subjects, sessions, settings } = state;
  const byId = subjectMap(subjects);

  const today = todayISO();
  const weekStart = startOfWeek(today);
  const weekEnd = weekDates(today)[6];
  const weekSessions = sessionsBetween(sessions, weekStart, weekEnd);
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
  const weekHours = totalMinutes(weekSessions) / 60;

  const weeklyTarget = settings.goals.weeklyHours;
  const weeklyPct = Math.min(100, Math.round((weekHours / (weeklyTarget || 1)) * 100));

  const subjectStats = useMemo(
    () =>
      subjects.map((subject) => {
        const subjSessions = sessions.filter((s) => s.subjectId === subject.id);
        const hours = totalMinutes(subjSessions) / 60;
        return { ...subject, hours };
      }),
    [subjects, sessions],
  );

  const trendData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (7 - index) * 7);
        const start = startOfWeek(date.toISOString().slice(0, 10));
        const end = weekDates(start)[6];
        return {
          week: `${date.getDate()}/${date.getMonth() + 1}`,
          hours: hourDecimal(totalMinutes(sessionsBetween(sessions, start, end))),
        };
      }),
    [sessions],
  );

  const monthMap = new Map<string, number>();
  sessions.forEach((s) => {
    const key = monthKey(s.date);
    monthMap.set(key, (monthMap.get(key) || 0) + s.durationMinutes);
  });
  const monthData = Array.from(monthMap.entries()).map(([month, minutes]) => ({
    month: formatMonth(month),
    hours: Math.round((minutes / 60) * 10) / 10,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Progress"
        description="Visual charts and trends across your learning."
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Export
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total hours" value={totalHours.toFixed(1)} detail="All logged" icon={Clock3} />
        <StatCard label="This week" value={weekHours.toFixed(1)} detail={`${weeklyPct}% of ${weeklyTarget}h`} icon={TrendingUp} tone="info" />
        <StatCard label="Weekly goal" value={`${weeklyPct}%`} detail={`${weeklyTarget}h target`} icon={Target} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Panel>
          <SectionHead title="Weekly focus" subtitle="Hours studied per week against your target" />
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barCategoryGap={16} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border-secondary)" strokeDasharray="3 5" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-secondary)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 11,
                  }}
                  formatter={(value: number) => [`${value}h`, 'Studied']}
                />
                <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Weekly goal" subtitle="Stay consistent" />
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-accent-strong">
              <span>Weekly target</span>
              <span>{weeklyPct}%</span>
            </div>
            <Progress value={weeklyPct} className="mt-2 bg-white/60" />
            <p className="text-[9px] text-soft">
              {weekHours >= weeklyTarget ? 'Weekly target reached. Protect recovery time.' : `${Math.max(0, weeklyTarget - weekHours).toFixed(1)}h left to hit your target.`}
            </p>
            <div className="mt-3 flex items-center gap-2 text-[9px] text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" /> Focused this week
              <span>{weekHours.toFixed(1)}h / {weeklyTarget}h</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <SectionHead title="Subject breakdown" subtitle="Hours and completion per subject" />
          <div className="space-y-3">
            {subjectStats.length === 0 ? (
              <EmptyState icon={BookOpenText} title="No subjects" description="Add subjects to see your progress breakdown." className="py-10" />
            ) : (
              subjectStats.map((subject) => {
                const sessionsForSubject = state.sessions.filter((s) => s.subjectId === subject.id);
                const hours = totalMinutes(sessionsForSubject) / 60;
                return (
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
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} />
                      </div>
                      <p className="mt-1 text-[9px] text-muted">
                        {hours.toFixed(1)}h / {subject.targetHours}h target &middot; {subject.completedChapters}/{subject.totalChapters} chapters
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHead title="Monthly distribution" subtitle="Hours by month" />
          <div className="space-y-3">
            {monthData.length === 0 ? (
              <p className="py-5 text-center text-[10.5px] text-muted">No data yet.</p>
            ) : (
              monthData.map((m) => (
                <div key={m.month} className="flex items-center justify-between gap-3 px-2">
                  <span className="text-[10.5px] text-muted">{m.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-ink">{m.hours}h</span>
                    <Progress value={(m.hours / Math.max(1, ...monthData.map((x) => x.hours))) * 100} className="w-24 h-1.5" barClassName="bg-accent" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {subjects.slice(0, 3).map((subject) => {
          const subjSessions = state.sessions.filter((s) => s.subjectId === subject.id);
          const hours = totalMinutes(subjSessions) / 60;
          const pct = Math.min(100, Math.round((hours / (subject.targetHours || 1)) * 100));
          return (
            <Panel key={subject.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SubjectIcon name={subject.icon} color={subject.color} />
                  <p className="mt-1 text-[11px] font-semibold">{subject.name}</p>
                  <p className="text-[9px] text-muted">{hours.toFixed(1)}h studied</p>
                </div>
                <Badge tone="blue">{subject.priority}</Badge>
              </div>
              <Progress value={pct} className="mt-3" />
              <p className="mt-1 text-[9px] text-soft">
                {pct}% of {subject.targetHours}h target
              </p>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

