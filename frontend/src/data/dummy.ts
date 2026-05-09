import type { LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const TODAY = daysAgo(0);
const D1    = daysAgo(1);
const D2    = daysAgo(2);
const D3    = daysAgo(3);
const D4    = daysAgo(4);
const D5    = daysAgo(5);
const D7    = daysAgo(7);
const D8    = daysAgo(8);
const D9    = daysAgo(9);
const D10   = daysAgo(10);
const D12   = daysAgo(12);
const D14   = daysAgo(14);

// ─── Long-term goals ─────────────────────────────────────────────────────────

export const longTermGoals: LongTermGoal[] = [
  {
    id: 'lt1',
    type: 'long',
    title: 'エンジニアとしてのキャリアアップ',
    description:
      '3年以内にシニアエンジニアとして活躍できる技術力とリーダーシップを身につける。OSS貢献や社内プレゼンスを高めることで、チームへの影響力を拡大する。',
    createdAt: '2024-01-10',
  },
  {
    id: 'lt2',
    type: 'long',
    title: '健康的な生活習慣の構築',
    description:
      '心身ともに健康で持続可能な生活スタイルを確立する。運動・食事・睡眠のトライアングルを整えることで、仕事のパフォーマンスも向上させる。',
    createdAt: '2024-02-01',
  },
];

// ─── Mid-term goals ───────────────────────────────────────────────────────────

export const midTermGoals: MidTermGoal[] = [
  // ── under lt1 ──────────────────────────────────────────────────
  {
    id: 'mt1',
    type: 'mid',
    title: 'Webフルスタックスキルの習得',
    description:
      'React / TypeScript / Node.js / PostgreSQL を体系的に学び、フロント〜バックまで一人で開発できるようにする。',
    longTermGoalId: 'lt1',
    relatedMidTermGoalIds: ['mt3'],
  },
  {
    id: 'mt2',
    type: 'mid',
    title: 'OSS貢献を始める',
    description:
      'GitHub で実際のプロジェクトに Issue コメント・PR を出し、実践的なコードレビュー経験を積む。',
    longTermGoalId: 'lt1',
    relatedMidTermGoalIds: ['mt3'],
  },
  {
    id: 'mt3',
    type: 'mid',
    title: '英語技術文書の読解力向上',
    description:
      '英語の RFC・仕様書・ドキュメントを辞書なしで読めるようにする。週1本英語記事を精読する習慣をつける。',
    longTermGoalId: 'lt1',
    relatedMidTermGoalIds: ['mt1', 'mt2'],
  },
  // ── under lt2 ──────────────────────────────────────────────────
  {
    id: 'mt4',
    type: 'mid',
    title: '週3回以上の運動習慣',
    description:
      'ジムまたは自宅トレーニングを週3回以上継続する。3ヶ月後に体脂肪率を2%下げることを目標とする。',
    longTermGoalId: 'lt2',
    relatedMidTermGoalIds: ['mt5'],
  },
  {
    id: 'mt5',
    type: 'mid',
    title: '食事管理の習慣化',
    description:
      '毎日の食事を記録し、タンパク質・炭水化物・脂質のバランスを意識する。外食は週3回以内に抑える。',
    longTermGoalId: 'lt2',
    relatedMidTermGoalIds: ['mt4'],
  },
];

// ─── Short-term goals ────────────────────────────────────────────────────────

export const shortTermGoalsInitial: ShortTermGoal[] = [
  {
    id: 'st1', type: 'short',
    title: 'Reactフロントエンドの実装',
    description: 'モックアップに合わせたUIを作成し、ルーティングを整理する。',
    completed: false,
    longTermGoalId: 'lt1', midTermGoalId: 'mt1',
  },
  {
    id: 'st2', type: 'short',
    title: 'ジムの月額プラン契約',
    description: '継続するために家の近くのジムを契約する。',
    completed: true,
    longTermGoalId: 'lt2', midTermGoalId: 'mt4',
  }
];

// ─── Tasks ────────────────────────────────────────────────────────

let _taskId = 1;
const tid = () => 'task' + _taskId++;

export const tasksInitial: Task[] = [
  // ── Today (lt1) ────────────────────────────────────────────────
  {
    id: tid(),
    title: 'ReactのuseReducerをドキュメントで学ぶ',
    description: '公式ドキュメントのuseReducerページを通読し、サンプルコードを写経する。',
    date: TODAY, completed: false, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'TypeScript型チャレンジを3問解く',
    description: 'type-challenges リポジトリから medium 難度を3問選んで解く。',
    date: TODAY, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: '英語技術記事を1本精読する',
    description: 'Dev.to か Medium で英語記事を1本選び、知らない単語を10語メモする。',
    date: TODAY, completed: false, goalId: 'mt3',
    },
{
    id: tid(),
    title: '30分ジョギング',
    description: '近所の公園を2周（約30分）走る。ペースはキロ6分程度でOK。',
    date: TODAY, completed: false, goalId: 'mt4',
    },
{
    id: tid(),
    title: 'ExpressでCRUD APIを作る',
    description: 'Node.js + Express で Todo CRUD API を実装してPostmanでテストする。',
    date: D1, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'OSSのissueに1件コメントする',
    description: '関心のあるOSSのissueを読み込み、建設的なコメントを残す。',
    date: D1, completed: true, goalId: 'mt2',
    },
{
    id: tid(),
    title: '食事記録をつける（全食）',
    description: '朝昼晩の食事内容をアプリに記録。タンパク質の摂取量を確認する。',
    date: D1, completed: true, goalId: 'mt5',
    },
{
    id: tid(),
    title: 'CSSグリッドレイアウトを復習',
    description: 'CSS Grid チートシートを眺めて、実際に複雑なレイアウトを組んでみる。',
    date: D2, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'ジムで胸・肩トレーニング',
    description: 'ベンチプレス・ショルダープレス・ラテラルレイズをこなす。',
    date: D2, completed: false, goalId: 'mt4',
    },
{
    id: tid(),
    title: 'PostgreSQL入門チュートリアル',
    description: 'PostgreSQL 公式チュートリアルをセクション3まで進める。',
    date: D3, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: '英語Podcastを30分聴く',
    description: 'Syntax.fm の最新エピソードを通勤中に聴く。',
    date: D3, completed: true, goalId: 'mt3',
    },
{
    id: tid(),
    title: '夕食の自炊（高タンパク）',
    description: '鶏胸肉＋野菜炒めを作って食事記録に追加する。',
    date: D3, completed: true, goalId: 'mt5',
    },
{
    id: tid(),
    title: 'GitHubのPRレビューに参加',
    description: '職場のPRをレビューして、コメントを2件以上残す。',
    date: D4, completed: true, goalId: 'mt2',
    },
{
    id: tid(),
    title: '体重・体脂肪率を測定',
    description: '朝食前に体重計で計測し、記録シートに追記する。',
    date: D4, completed: true, goalId: 'lt2',
    },
{
    id: tid(),
    title: 'Reactパフォーマンス最適化を調べる',
    description: 'memo, useMemo, useCallbackの使い分けを整理してZennに下書きを書く。',
    date: D5, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: '筋トレ（脚の日）',
    description: 'スクワット・デッドリフト・レッグプレスのルーティン。',
    date: D5, completed: true, goalId: 'mt4',
    },
{
    id: tid(),
    title: 'TypeScriptハンドブックを読む',
    description: 'Generics の章を重点的に読み込む。',
    date: D7, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'OSSへのPRを作成',
    description: 'ドキュメントの誤字修正でいいのでPRを1件出してみる。',
    date: D7, completed: false, goalId: 'mt2',
    },
{
    id: tid(),
    title: '英語技術書を5ページ読む',
    description: '"You Don\'t Know JS" の第3章を進める。',
    date: D8, completed: true, goalId: 'mt3',
    },
{
    id: tid(),
    title: '有酸素30分（サイクリング）',
    description: '近所をロードバイクで30分走る。',
    date: D8, completed: true, goalId: 'mt4',
    },
{
    id: tid(),
    title: 'フロントエンド設計の記事を読む',
    description: 'Feature-Sliced Design について調べてまとめる。',
    date: D9, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'REST API設計を学ぶ',
    description: 'RESTful APIのベストプラクティスを調べ、メモにまとめる。',
    date: D10, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: '体重測定 & 記録',
    description: '朝食前に測定して2週間の推移グラフを確認する。',
    date: D10, completed: true, goalId: 'lt2',
    },
{
    id: tid(),
    title: 'Vitest入門',
    description: 'VitestでReactコンポーネントのユニットテストを書く。',
    date: D12, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: 'CI/CDをGitHub Actionsで構築',
    description: 'テスト自動実行 + Vercelデプロイのワークフローを作る。',
    date: D14, completed: true, goalId: 'mt1',
    },
{
    id: tid(),
    title: '栄養管理アプリを設定',
    description: 'MyFitnessPalの目標カロリーを再設定して記録を再開する。',
    date: D14, completed: true, goalId: 'mt5',
    },
];

export const tasksNoToday: Task[] = tasksInitial.filter(
  (t) => t.date !== TODAY
);
