import type { Task } from '../../../types';
import { TODAY } from '../../../data/dummy';

interface WeeklyProgressChartProps {
  tasks: Task[];
  data?: any; // 追加: API (GET /api/dashboard/summary) からの集計データ
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const WEEK_DAYS = [
  { date: daysAgo(6), label: '月' },
  { date: daysAgo(5), label: '火' },
  { date: daysAgo(4), label: '水' },
  { date: daysAgo(3), label: '木' },
  { date: daysAgo(2), label: '金' },
  { date: daysAgo(1), label: '土' },
  { date: daysAgo(0), label: '日' },
];

// Recompute label based on actual weekday
const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];
const daysWithLabel = WEEK_DAYS.map(({ date }) => {
  const d = new Date(date);
  return { date, label: WEEKDAY_JP[d.getDay()] };
});

export function WeeklyProgressChart({ tasks, data }: WeeklyProgressChartProps) {
  const stats = daysWithLabel.map(({ date, label }) => {
    // 1. APIデータ (data) 内に対象の日付があるか探す
    const apiDayData = data?.find((d: any) => d.date === date);

    let total, done;

    if (apiDayData) {
      // APIデータがあればそれを優先
      total = apiDayData.total;
      done = apiDayData.done;
    } else {
      // APIデータがなければ、Propsとして渡された tasks から算出（フォールバック）
      const dayGoals = tasks.filter((t) => t.date === date);
      total = dayGoals.length;
      done = dayGoals.filter((t) => t.completed).length;
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { date, label, total, done, pct, isToday: date === TODAY };
  });

  const maxTotal = Math.max(...stats.map((s) => s.total), 1);

  return (
    <section className="card">
      <div className="card__title">
        <span className="card__title-dot" style={{ background: 'var(--accent-teal)' }} />
        週間の進捗
      </div>
      <div className="weekly-chart">
        {stats.map(({ date, label, total, done, pct, isToday }) => {
          const heightPct = total > 0 ? (total / maxTotal) * 100 : 8;
          return (
            <div key={date} className="weekly-chart__bar-wrap">
              <div
                className={`weekly-chart__bar${isToday ? ' today' : total > 0 ? ' has-data' : ''}`}
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
