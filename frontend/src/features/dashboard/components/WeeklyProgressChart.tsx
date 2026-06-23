import type { Task } from '../../../types';

interface WeeklyProgressChartProps {
  tasks: Task[];
  data?: any; // 追加: API (GET /api/dashboard/summary) からの集計データ
}

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

function getLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getLast7Days(): Array<{ date: string; label: string }> {
  const today = new Date();
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - idx));
    const date = getLocalDateString(d);
    return { date, label: WEEKDAY_JP[d.getDay()] };
  });
}

export function WeeklyProgressChart({ tasks, data }: WeeklyProgressChartProps) {
  const today = getLocalDateString(new Date());
  const daysWithLabel = getLast7Days();
  const stats = daysWithLabel.map(({ date, label }) => {
    const dayGoals = tasks.filter((t) => t.date === date);
    const taskTotal = dayGoals.length;
    const taskDone = dayGoals.filter((t) => t.completed).length;

    let total = taskTotal;
    let done = taskDone;

    if (total === 0) {
      const apiDayData = data?.find((d: any) => d.date === date);
      if (apiDayData) {
        total = apiDayData.total;
        done = apiDayData.done;
      }
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { date, label, total, done, pct, isToday: date === today };
  });

  const maxDone = Math.max(...stats.map((s) => s.done), 1);

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-teal)' }} />
        週間の進捗
      </div>
      <div className="weekly-chart">
        {stats.map(({ date, label, total, done, pct, isToday }) => {
          const heightPct = done > 0 ? (done / maxDone) * 100 : 8;
          return (
            <div key={date} className="weekly-chart__bar-wrap">
              <div
                className={`weekly-chart__bar${isToday ? ' today' : done > 0 ? ' has-data' : ''}`}
                style={{ height: `${heightPct}%` }}
                title={total > 0 ? `${done}/${total} 完了 (${pct}%)` : '目標なし'}
              />
              <span className={`weekly-chart__label${isToday ? ' today' : ''}`}>{label}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-1)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>過去7日間</span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-teal)' }}>
          {stats.reduce((a, s) => a + s.done, 0)} タスク完了
        </span>
      </div>
    </section>
  );
}
