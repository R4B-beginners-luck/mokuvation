import type { LongTermGoal, MidTermGoal, ShortTermGoal, Task } from '../types';
import { COLOR_PALETTE } from '../const/colors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysAfter(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
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
const D10   = daysAgo(10);
const D14   = daysAgo(14);
const D30   = daysAgo(30);

const F3    = daysAfter(3);
const F7    = daysAfter(7);
const F14   = daysAfter(14);
const F21   = daysAfter(21);
const F30   = daysAfter(30);
const F45   = daysAfter(45);
const F60   = daysAfter(60);
const F75   = daysAfter(75);
const F90   = daysAfter(90);
const F120  = daysAfter(120);
const F150  = daysAfter(150);
const F180  = daysAfter(180);

// ─── Long-term goals ──────────────────────────────────────────────────────────

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
  {
    id: 'lt3',
    type: 'long',
    title: 'TOEIC 800点達成',
    description:
      '英語試験スコアを大幅に向上させ、国際的な技術情報を自在に理解・発信できるようになる。リスニングとリーディングの両面を強化する。',
    createdAt: '2024-03-15',
  },
  {
    id: 'lt4',
    type: 'long',
    title: '卒業研究・PWA家計簿アプリ完成',
    description:
      'Progressive Web App技術を活用した家計簿アプリを実装し、卒業論文を完成させる。オフライン対応とデータ永続化の実装を通じて、PWA開発の実践知見を獲得する。',
    createdAt: '2024-01-20',
  },
  {
    id: 'lt5',
    type: 'long',
    title: 'お金・生活管理の安定',
    description:
      '毎月の支出を把握し、貯金計画を立てて実行する。サブスクリプション管理や家計簿の自動化を進め、経済的な安定基盤を構築する。',
    createdAt: '2024-02-20',
  },
];

// ─── Mid-term goals ───────────────────────────────────────────────────────────

export const midTermGoals: MidTermGoal[] = [
  // ── under lt1: エンジニアとしてのキャリアアップ ──────────────
  {
    id: 'mt1',
    type: 'mid',
    title: 'Webフルスタックスキルの習得',
    description:
      'React / TypeScript / Node.js / PostgreSQL を体系的に学び、フロント〜バックまで一人で開発できるようにする。',
    longTermGoalId: 'lt1',
    dueDate: F90,
    relatedMidTermGoalIds: [],
    labelIds: ['dev'],
    primaryLabelId: 'dev',
  },
  {
    id: 'mt2',
    type: 'mid',
    title: '組み込み基礎の習得',
    description:
      'C言語の基礎とマイコン開発の初歩を学ぶ。Arduino や STM32 を使った簡単なプロジェクトを1～2件完成させる。',
    longTermGoalId: 'lt1',
    dueDate: F180,
    relatedMidTermGoalIds: [],
    labelIds: ['embedded', 'dev'],
    primaryLabelId: 'embedded',
  },
  {
    id: 'mt3',
    type: 'mid',
    title: '個人開発アプリの完成',
    description:
      'mokuvation（目標管理アプリ）を完成させ、GitHubで公開する。UI/UXの改善とバグ修正を進める。',
    longTermGoalId: 'lt1',
    dueDate: F60,
    relatedMidTermGoalIds: [],
    labelIds: ['dev', 'share'],
    primaryLabelId: 'dev',
  },
  {
    id: 'mt4',
    type: 'mid',
    title: '技術発信の継続',
    description:
      'Zenn や X で技術記事・開発ログを週1回以上の頻度で発信する。月単位でまとめ記事も発信する。',
    longTermGoalId: 'lt1',
    dueDate: '',
    relatedMidTermGoalIds: [],
    labelIds: ['share'],
    primaryLabelId: 'share',
  },
  {
    id: 'mt5',
    type: 'mid',
    title: 'GitHub 運用の改善',
    description:
      'リポジトリのREADME充実、Issue・PR テンプレート作成、自動化ワークフロー構築など、運用効率を向上させる。',
    longTermGoalId: 'lt1',
    dueDate: F30,
    relatedMidTermGoalIds: [],
    labelIds: ['dev'],
    primaryLabelId: 'dev',
  },
  // ── under lt2: 健康的な生活習慣の構築 ──────────────────────
  {
    id: 'mt6',
    type: 'mid',
    title: '運動習慣の定着',
    description:
      'ジムでの筋トレを週3回以上継続する。3ヶ月で体脂肪率を2%低下させることを目標とする。',
    longTermGoalId: 'lt2',
    dueDate: F90,
    relatedMidTermGoalIds: [],
    labelIds: ['health'],
    primaryLabelId: 'health',
  },
  {
    id: 'mt7',
    type: 'mid',
    title: '食事管理の習慣化',
    description:
      '毎日の食事を記録し、タンパク質・炭水化物・脂質のバランスを意識する。外食は週3回以内に抑える。',
    longTermGoalId: 'lt2',
    dueDate: '',
    relatedMidTermGoalIds: [],
    labelIds: ['health', 'money'],
    primaryLabelId: 'health',
  },
  {
    id: 'mt8',
    type: 'mid',
    title: '睡眠リズムの改善',
    description:
      '毎日22時就寝・6時起床を目指す。就寝前のスマートフォン使用を控え、寝付きを改善する。',
    longTermGoalId: 'lt2',
    dueDate: F60,
    relatedMidTermGoalIds: [],
    labelIds: ['health'],
    primaryLabelId: 'health',
  },
  // ── under lt3: TOEIC 800点達成 ────────────────────────────
  {
    id: 'mt9',
    type: 'mid',
    title: 'リスニング力の強化',
    description:
      'Part1・Part2で高得点を目指す。毎日30分のリスニング練習を継続し、3ヶ月でPart1・2で90%以上を狙う。',
    longTermGoalId: 'lt3',
    dueDate: F90,
    relatedMidTermGoalIds: [],
    labelIds: ['eng', 'cert'],
    primaryLabelId: 'eng',
  },
  {
    id: 'mt10',
    type: 'mid',
    title: 'リーディング力の強化',
    description:
      'Part5・Part6の文法問題と Part7 の長文読解を強化する。速読スキルを身につけ、制限時間内にすべて解く練習。',
    longTermGoalId: 'lt3',
    dueDate: F90,
    relatedMidTermGoalIds: [],
    labelIds: ['eng', 'cert'],
    primaryLabelId: 'eng',
  },
  {
    id: 'mt11',
    type: 'mid',
    title: '単語学習の継続',
    description:
      'TOEIC出題頻度の高い単語・表現を集中的に習得する。毎日50語の復習と5語の新出単語学習を進める。',
    longTermGoalId: 'lt3',
    dueDate: '',
    relatedMidTermGoalIds: [],
    labelIds: ['eng', 'cert'],
    primaryLabelId: 'eng',
  },
  {
    id: 'mt12',
    type: 'mid',
    title: '模試演習の習慣化',
    description:
      '月1回の公式模試と週1回の過去問演習を実施。自分の弱点を分析し、重点的に対策する。',
    longTermGoalId: 'lt3',
    dueDate: F120,
    relatedMidTermGoalIds: [],
    labelIds: ['cert'],
    primaryLabelId: 'cert',
  },
  // ── under lt4: 卒業研究・PWA家計簿アプリ完成 ────────────────
  {
    id: 'mt13',
    type: 'mid',
    title: '既存家計簿アプリ調査',
    description:
      '市場にある3～5個の家計簿アプリを詳しく調査し、それぞれの機能・UX・技術スタックをまとめる。',
    longTermGoalId: 'lt4',
    dueDate: F30,
    relatedMidTermGoalIds: [],
    labelIds: ['research'],
    primaryLabelId: 'research',
  },
  {
    id: 'mt14',
    type: 'mid',
    title: 'PWA家計簿アプリ実装',
    description:
      'Vite + React + PWA技術でアプリを実装。Service Worker・Cache API・IndexedDBを活用しオフライン対応を実現する。',
    longTermGoalId: 'lt4',
    dueDate: F120,
    relatedMidTermGoalIds: [],
    labelIds: ['dev', 'research'],
    primaryLabelId: 'dev',
  },
  {
    id: 'mt15',
    type: 'mid',
    title: '卒論本文の作成',
    description:
      'PWA採用理由、設計思想、実装の工夫、使用技術の選定理由などを詳しく執筆する。数値化できる成果も盛り込む。',
    longTermGoalId: 'lt4',
    dueDate: F150,
    relatedMidTermGoalIds: [],
    labelIds: ['research'],
    primaryLabelId: 'research',
  },
  // ── under lt5: お金・生活管理の安定 ──────────────────────
  {
    id: 'mt16',
    type: 'mid',
    title: '月の支出把握',
    description:
      '固定費・変動費を分類し、カテゴリ別に月の支出をまとめる。3ヶ月の平均値から月の適正予算を決定する。',
    longTermGoalId: 'lt5',
    dueDate: F60,
    relatedMidTermGoalIds: [],
    labelIds: ['money'],
    primaryLabelId: 'money',
  },
  {
    id: 'mt17',
    type: 'mid',
    title: '貯金計画の見直し',
    description:
      '月の手取りと支出から貯金可能額を算出。1年後の目標貯金額を決め、毎月の貯金ペースを設定する。',
    longTermGoalId: 'lt5',
    dueDate: F30,
    relatedMidTermGoalIds: [],
    labelIds: ['money'],
    primaryLabelId: 'money',
  },
  {
    id: 'mt18',
    type: 'mid',
    title: 'サブスク管理の実施',
    description:
      '現在契約中のサブスクをすべて洗い出し、不要なものを解約する。月の総額を5000円以下に抑える。',
    longTermGoalId: 'lt5',
    dueDate: F14,
    relatedMidTermGoalIds: [],
    labelIds: ['money'],
    primaryLabelId: 'money',
  },
];

// ─── Short-term goals ──────────────────────────────────────────────────────

export const shortTermGoalsInitial: ShortTermGoal[] = [
  // ── under lt1・mt1: Webフルスタックスキル ──────────────
  {
    id: 'st1',
    type: 'short',
    title: 'Reactフロントエンドの実装',
    description: 'mokuvationのUIコンポーネントを完成させ、ルーティングを整理する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt3',
    dueDate: F14,
    labelIds: ['dev'],
  },
  {
    id: 'st2',
    type: 'short',
    title: 'Node.js API設計と実装',
    description: 'バックエンドのCRUD APIを構築し、Postman でテストする。',
    completed: true,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt1',
    dueDate: '2026-06-15',
    labelIds: ['dev'],
  },
  {
    id: 'st3',
    type: 'short',
    title: 'PostgreSQL の運用構築',
    description: 'データベーススキーマを設計し、マイグレーションスクリプトを整備する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt1',
    dueDate: F30,
    labelIds: ['dev'],
  },
  {
    id: 'st4',
    type: 'short',
    title: 'TypeScript の型設計',
    description:
      '複雑な型定義を重点的に学び、プロジェクト全体の型安全性を向上させる。Union・Intersection・Conditional Types を活用する。',
    completed: true,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt1',
    dueDate: '2026-07-01',
    labelIds: ['dev'],
  },
  // ── under lt1・mt2: 組み込み基礎 ────────────────────────
  {
    id: 'st5',
    type: 'short',
    title: 'C言語の基礎を復習',
    description: 'ポインタ・配列・構造体・ファイルI/Oを重点的に復習。実際に小規模なプログラムを作成する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt2',
    dueDate: F60,
    labelIds: ['embedded'],
  },
  {
    id: 'st6',
    type: 'short',
    title: 'マイコンの基本を学ぶ',
    description: 'Arduino のセットアップと LED・センサー制御の入門を進める。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt2',
    dueDate: F90,
    labelIds: ['embedded', 'dev'],
  },
  // ── under lt1・mt3: 個人開発アプリの完成 ──────────────
  {
    id: 'st7',
    type: 'short',
    title: 'mokuvation の目標マップを改善',
    description:
      'ノード表示の視認性向上、ラベル機能の整備、詳細パネルの充実などを実施する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt3',
    dueDate: F7,
    labelIds: ['dev'],
  },
  {
    id: 'st8',
    type: 'short',
    title: '認証・認可機能を実装',
    description:
      'JWTベースの認証機能を実装し、ユーザー登録・ログイン・ログアウトを動作させる。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt1',
    dueDate: F45,
    labelIds: ['dev'],
  },
  {
    id: 'st9',
    type: 'short',
    title: 'デプロイメント環境を整備',
    description: 'Vercel と Heroku（または類似サービス）にデプロイし、本番環境でテストする。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt3',
    dueDate: F60,
    labelIds: ['dev'],
  },
  // ── under lt1・mt4: 技術発信 ──────────────────────────
  {
    id: 'st10',
    type: 'short',
    title: 'X で開発ログを投稿',
    description: 'mokuvation の進捗状況や学んだことを X（Twitter）で週1回以上投稿する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt4',
    dueDate: '',
    labelIds: ['share', 'dev'],
  },
  {
    id: 'st11',
    type: 'short',
    title: 'Zenn で技術記事を執筆',
    description:
      'React・TypeScript・PWA などのテーマで、月1～2本の技術記事を公開する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt4',
    dueDate: F30,
    labelIds: ['share', 'dev'],
  },
  {
    id: 'st12',
    type: 'short',
    title: 'IssueとPRの運用を定着',
    description:
      'GitHub で Issue テンプレート・PR テンプレートを作成し、プロセスを標準化する。',
    completed: false,
    longTermGoalId: 'lt1',
    midTermGoalId: 'mt5',
    dueDate: F21,
    labelIds: ['dev'],
  },
  // ── under lt2・mt6: 運動習慣 ────────────────────────────
  {
    id: 'st13',
    type: 'short',
    title: '週3回以上ジムで運動',
    description: 'ジムまたは自宅で筋トレを週3回以上実施。胸・背中・脚・肩を順番に鍛える。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt6',
    dueDate: '',
    labelIds: ['health'],
  },
  {
    id: 'st14',
    type: 'short',
    title: '1日30分ストレッチ',
    description: 'ヨガ・ストレッチを毎日実施し、柔軟性と血行を改善する。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt6',
    dueDate: '',
    labelIds: ['health'],
  },
  {
    id: 'st15',
    type: 'short',
    title: '体重・体脂肪率を週1回測定',
    description: '毎週同じ時間に測定し、推移グラフで進捗を確認する。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt6',
    dueDate: '',
    labelIds: ['health'],
  },
  // ── under lt2・mt7: 食事管理 ────────────────────────────
  {
    id: 'st16',
    type: 'short',
    title: '食事記録を毎日つける',
    description: '朝昼晩の食事内容をアプリに記録。タンパク質の摂取量を確認する。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt7',
    dueDate: '',
    labelIds: ['health'],
  },
  {
    id: 'st17',
    type: 'short',
    title: '夜食を週1回以下に減らす',
    description: '就寝2時間前の食事は避け、外食時も夜遅い時間を避ける。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt7',
    dueDate: F30,
    labelIds: ['health'],
  },
  // ── under lt2・mt8: 睡眠リズム ──────────────────────────
  {
    id: 'st18',
    type: 'short',
    title: '毎日22時に就寝',
    description: '就寝前のスマートフォン使用を20時で終了し、入眠儀式を整える。',
    completed: false,
    longTermGoalId: 'lt2',
    midTermGoalId: 'mt8',
    dueDate: '',
    labelIds: ['health'],
  },
  // ── under lt3・mt9: リスニング ──────────────────────────
  {
    id: 'st19',
    type: 'short',
    title: '毎日30分リスニング',
    description: 'TOEIC Part 1・2 問題集を使い、毎日30分のリスニング演習を実施する。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt9',
    dueDate: '',
    labelIds: ['eng', 'cert'],
  },
  {
    id: 'st20',
    type: 'short',
    title: '英語Podcast を週3回聴く',
    description: 'Syntax.fm や EconTalk などで英語に慣れ、ナチュラルスピードのリスニングを強化する。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt9',
    dueDate: '',
    labelIds: ['eng'],
  },
  // ── under lt3・mt10: リーディング ────────────────────
  {
    id: 'st21',
    type: 'short',
    title: 'Part 5 文法問題を毎日解く',
    description: 'TOEIC Part 5 の文法問題を毎日20問解き、間違いを分析する。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt10',
    dueDate: '',
    labelIds: ['cert', 'eng'],
  },
  {
    id: 'st22',
    type: 'short',
    title: 'Part 7 速読練習',
    description: '長文読解をスピード重視で解く練習。15分で4本の長文を読了する目標を設定。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt10',
    dueDate: F60,
    labelIds: ['cert', 'eng'],
  },
  // ── under lt3・mt11: 単語学習 ────────────────────────
  {
    id: 'st23',
    type: 'short',
    title: 'TOEIC 単語を毎日50語復習',
    description: 'Anki や Quizlet で TOEIC 出題単語の重要表現を毎日50語復習する。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt11',
    dueDate: '',
    labelIds: ['cert', 'eng'],
  },
  {
    id: 'st24',
    type: 'short',
    title: '苦手単語をまとめる',
    description: '模試や問題集で間違えた単語・表現を集めてノートにまとめる。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt11',
    dueDate: '',
    labelIds: ['cert', 'eng'],
  },
  // ── under lt3・mt12: 模試演習 ────────────────────────
  {
    id: 'st25',
    type: 'short',
    title: '月1回公式模試を実施',
    description: 'TOEIC 公式問題集の模試を月1回、本番さながらの環境で解く。',
    completed: false,
    longTermGoalId: 'lt3',
    midTermGoalId: 'mt12',
    dueDate: F30,
    labelIds: ['cert'],
  },
  // ── under lt4・mt13: 既存アプリ調査 ──────────────────
  {
    id: 'st26',
    type: 'short',
    title: '既存家計簿アプリ3つを調査',
    description: 'MoneyForward・Zaim・家計簿Zaim などをダウンロードして使用し、機能・UXをまとめる。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt13',
    dueDate: F14,
    labelIds: ['research'],
  },
  {
    id: 'st27',
    type: 'short',
    title: '不足機能を整理',
    description: '既存アプリにない機能や改善点を洗い出し、要件定義ドキュメントにまとめる。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt13',
    dueDate: F21,
    labelIds: ['research'],
  },
  // ── under lt4・mt14: PWA実装 ────────────────────────
  {
    id: 'st28',
    type: 'short',
    title: 'Service Worker の実装を試す',
    description: 'キャッシュ戦略を決定し、Service Worker でオフラインページを配信する実装を進める。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt14',
    dueDate: F60,
    labelIds: ['dev', 'research'],
  },
  {
    id: 'st29',
    type: 'short',
    title: 'IndexedDB で データ永続化',
    description: 'IndexedDB を使用してオフラインでも家計簿データを保存・参照できる機能を実装する。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt14',
    dueDate: F75,
    labelIds: ['dev', 'research'],
  },
  // ── under lt4・mt15: 卒論作成 ────────────────────────
  {
    id: 'st30',
    type: 'short',
    title: 'PWA 採用理由を文章化',
    description: 'オフライン対応・高速化・スマートフォン対応などの技術的メリットを詳しく記述する。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt15',
    dueDate: F60,
    labelIds: ['research'],
  },
  {
    id: 'st31',
    type: 'short',
    title: '発表スライドの構成を作成',
    description: '卒業発表用のスライド構成案を作成。導入・手法・結果・考察の流れを整理する。',
    completed: false,
    longTermGoalId: 'lt4',
    midTermGoalId: 'mt15',
    dueDate: F120,
    labelIds: ['research'],
  },
  // ── under lt5: お金管理 ──────────────────────────────
  {
    id: 'st32',
    type: 'short',
    title: '今月の固定費を確認',
    description: '家賃・光熱費・通信費などの固定費をすべて洗い出し、合計金額をまとめる。',
    completed: false,
    longTermGoalId: 'lt5',
    midTermGoalId: 'mt16',
    dueDate: F3,
    labelIds: ['money'],
  },
  {
    id: 'st33',
    type: 'short',
    title: '不要なサブスクを解約',
    description: '登録しているサブスク全一覧を作成し、使っていないものを解約する。',
    completed: false,
    longTermGoalId: 'lt5',
    midTermGoalId: 'mt18',
    dueDate: F7,
    labelIds: ['money'],
  },
  {
    id: 'st34',
    type: 'short',
    title: '月の予算を決定',
    description:
      '過去3ヶ月の平均支出をベースに、月の目標予算を決めて家計簿に反映させる。',
    completed: false,
    longTermGoalId: 'lt5',
    midTermGoalId: 'mt16',
    dueDate: F30,
    labelIds: ['money'],
  },
  {
    id: 'st35',
    type: 'short',
    title: '貯金目標を設定',
    description: '1年後の目標貯金額を決め、毎月の貯金ペースを逆算する。',
    completed: false,
    longTermGoalId: 'lt5',
    midTermGoalId: 'mt17',
    dueDate: F14,
    labelIds: ['money'],
  },
];

// ─── Labels ───────────────────────────────────────────────────────────────────

export const labels = [
  { id: 'dev', name: '開発', color: COLOR_PALETTE[4] }, // 青系
  { id: 'eng', name: '英語', color: COLOR_PALETTE[3] }, // 緑系
  { id: 'cert', name: '資格', color: COLOR_PALETTE[5] }, // 紫系
  { id: 'health', name: '健康', color: COLOR_PALETTE[1] }, // オレンジ系
  { id: 'research', name: '研究', color: COLOR_PALETTE[0] }, // 赤系
  { id: 'share', name: '発信', color: COLOR_PALETTE[6] }, // ピンク系
  { id: 'embedded', name: '組み込み', color: COLOR_PALETTE[7] }, // シアン系
  { id: 'money', name: 'お金', color: COLOR_PALETTE[8] }, // ティール系
];

// ─── Tasks ────────────────────────────────────────────────────────

let _taskId = 1;
const tid = () => 'task' + _taskId++;

export const tasksInitial: Task[] = [
  // ── D30-D26: 基礎期間 ───────────────────────────────────────────────────────────────────────
  { id: tid(), title: '30分ウォーキングする', date: daysAgo(30), completed: true, goalId: 'st13' },
  { id: tid(), title: '今月の固定費を確認する', date: daysAgo(30), completed: true, goalId: 'st32' },
  { id: tid(), title: '就寝時間を記録する', date: daysAgo(30), completed: true, goalId: 'st14' },
  { id: tid(), title: 'ReactのuseReducerを学ぶ', date: daysAgo(29), completed: true, goalId: 'st1' },
  { id: tid(), title: 'TOEIC単語を50語復習する', date: daysAgo(29), completed: true, goalId: 'st23' },
  { id: tid(), title: '目標マップのラベル表示案をスクショで比較する', date: daysAgo(29), completed: true, goalId: 'mt1' },
  { id: tid(), title: 'Issueを1件作成する', date: daysAgo(29), completed: true, goalId: 'mt2' },
  { id: tid(), title: '既存家計簿アプリを1つ調査する', date: daysAgo(28), completed: true, goalId: 'st26' },
  { id: tid(), title: 'ストレッチをする', date: daysAgo(28), completed: true, goalId: 'st13' },
  { id: tid(), title: '不要なサブスクを洗い出す', date: daysAgo(28), completed: true, goalId: 'st32' },
  { id: tid(), title: 'TypeScript型チャレンジを3問解く', date: daysAgo(27), completed: true, goalId: 'st1' },
  { id: tid(), title: 'Part5の文法問題を10問解く', date: daysAgo(27), completed: true, goalId: 'st23' },
  { id: tid(), title: 'LaravelのAPI設計を整理する', date: daysAgo(27), completed: true, goalId: 'mt1' },
  { id: tid(), title: 'ダミーデータを追加する', date: daysAgo(27), completed: true },
  { id: tid(), title: '目標マップの表示崩れを確認する', date: daysAgo(25), completed: true, goalId: 'mt1' },
  { id: tid(), title: '30分リスニングする', date: daysAgo(25), completed: true, goalId: 'st23' },
  { id: tid(), title: '夜食を控える', date: daysAgo(25), completed: true, goalId: 'st14' },
  { id: tid(), title: 'Service Workerのキャッシュ方針を整理する', date: daysAgo(24), completed: true, goalId: 'st26' },
  { id: tid(), title: 'PayPayカードの支払日を確認する', date: daysAgo(24), completed: true, goalId: 'st32' },
  { id: tid(), title: '部屋を片付ける', date: daysAgo(24), completed: true },
  { id: tid(), title: 'PRテンプレートを確認する', date: daysAgo(23), completed: true, goalId: 'mt1' },
  { id: tid(), title: 'TOEIC模試の復習をする', date: daysAgo(23), completed: true, goalId: 'st23' },
  { id: tid(), title: 'Reactコンポーネント構成を見直す', date: daysAgo(23), completed: true, goalId: 'st1' },
  { id: tid(), title: '苦手な単語をまとめる', date: daysAgo(23), completed: true, goalId: 'st23' },
  { id: tid(), title: '水分を多めに取る', date: daysAgo(22), completed: true, goalId: 'st14' },
  { id: tid(), title: 'IndexedDBの保存処理を試す', date: daysAgo(21), completed: true, goalId: 'st26' },
  { id: tid(), title: '今週の支出を記録する', date: daysAgo(21), completed: true, goalId: 'st32' },
  { id: tid(), title: '英語技術記事を1本精読する', date: daysAgo(21), completed: true, goalId: 'st20' },
  { id: tid(), title: '30分ジョギング', date: daysAgo(20), completed: true, goalId: 'st13' },
  { id: tid(), title: '就寝時間を記録する', date: daysAgo(20), completed: false, goalId: 'st14' },
  { id: tid(), title: 'GitHub Issueを2件作成する', date: daysAgo(18), completed: true, goalId: 'mt2' },
  { id: tid(), title: 'Part3のリスニング練習をする', date: daysAgo(18), completed: true, goalId: 'st23' },
  { id: tid(), title: 'ダミーデータの構造を見直す', date: daysAgo(18), completed: true },
  { id: tid(), title: '卒論の要旨の骨組みを作る', date: daysAgo(18), completed: true, goalId: 'st26' },
  { id: tid(), title: 'ストレッチをする', date: daysAgo(17), completed: true, goalId: 'st13' },
  { id: tid(), title: '不要なサブスクを整理する', date: daysAgo(17), completed: true, goalId: 'st32' },
  { id: tid(), title: '夜食を控える', date: daysAgo(17), completed: true, goalId: 'st14' },
  { id: tid(), title: 'TypeScript型定義を追加する', date: daysAgo(16), completed: true, goalId: 'st1' },
  { id: tid(), title: 'TOEIC単語を50語復習する', date: daysAgo(16), completed: true, goalId: 'st23' },
  { id: tid(), title: '発表スライド構成を考える', date: daysAgo(16), completed: true, goalId: 'st26' },
  { id: tid(), title: 'Reactコンポーネントをリファクタリング', date: daysAgo(15), completed: true, goalId: 'st1' },
  { id: tid(), title: '30分ウォーキング', date: daysAgo(15), completed: true, goalId: 'st13' },
  { id: tid(), title: '今月の固定費をまとめる', date: daysAgo(15), completed: true, goalId: 'st32' },
  { id: tid(), title: 'APIエンドポイントのドキュメント作成', date: daysAgo(13), completed: true, goalId: 'mt1' },
  { id: tid(), title: 'Part4の音声問題を解く', date: daysAgo(13), completed: true, goalId: 'st23' },
  { id: tid(), title: '目標マップのパフォーマンス測定', date: daysAgo(13), completed: true },
  { id: tid(), title: 'C言語のポインタを復習する', date: daysAgo(13), completed: false, goalId: 'st21' },
  { id: tid(), title: 'ストレッチをする', date: daysAgo(12), completed: true, goalId: 'st13' },
  { id: tid(), title: 'IndexedDBの削除処理を実装する', date: daysAgo(12), completed: true, goalId: 'st26' },
  { id: tid(), title: '水分を多めに取る', date: daysAgo(12), completed: true, goalId: 'st14' },
  { id: tid(), title: 'GitHub Issueのコメントに返信する', date: daysAgo(11), completed: true, goalId: 'mt2' },
  { id: tid(), title: 'TOEIC模試を1回解く', date: daysAgo(11), completed: true, goalId: 'st23' },
  { id: tid(), title: 'CSS Gridレイアウトを復習', date: daysAgo(11), completed: true, goalId: 'st1' },
  { id: tid(), title: 'UIコンポーネントライブラリを評価', date: daysAgo(10), completed: true },
  { id: tid(), title: '今週の支出を記録する', date: daysAgo(10), completed: true, goalId: 'st32' },
  { id: tid(), title: 'React Query を導入する', date: daysAgo(10), completed: false, goalId: 'st1' },
  { id: tid(), title: '30分ジョギング', date: daysAgo(9), completed: true, goalId: 'st13' },
  { id: tid(), title: 'Part5の文法問題を20問解く', date: daysAgo(9), completed: true, goalId: 'st23' },
  { id: tid(), title: '就寝時間を記録する', date: daysAgo(9), completed: true, goalId: 'st14' },
  { id: tid(), title: '夜食を控える', date: daysAgo(9), completed: true, goalId: 'st14' },
  { id: tid(), title: 'Vite設定を最適化する', date: daysAgo(8), completed: true, goalId: 'st1' },
  { id: tid(), title: 'PWA採用理由を文章化する', date: daysAgo(8), completed: true, goalId: 'st26' },
  { id: tid(), title: 'ダミーデータを拡張する', date: daysAgo(8), completed: true },
  { id: tid(), title: 'TypeScript厳密モードを有効化', date: daysAgo(6), completed: true, goalId: 'st1' },
  { id: tid(), title: 'TOEIC単語を100語復習する', date: daysAgo(6), completed: true, goalId: 'st23' },
  { id: tid(), title: '30分ウォーキング', date: daysAgo(6), completed: true, goalId: 'st13' },
  { id: tid(), title: '部屋を片付ける', date: daysAgo(6), completed: true },
  { id: tid(), title: '既存UIの改善案を出す', date: daysAgo(6), completed: true, goalId: 'mt1' },
  { id: tid(), title: 'OSのメモリ管理について調べる', date: daysAgo(6), completed: true, goalId: 'st21' },
  { id: tid(), title: 'React.memoを使ってコンポーネント最適化', date: daysAgo(5), completed: true, goalId: 'st1' },
  { id: tid(), title: 'ストレッチをする', date: daysAgo(5), completed: true, goalId: 'st13' },
  { id: tid(), title: 'PayPayの支払い明細を確認', date: daysAgo(5), completed: true, goalId: 'st32' },
  { id: tid(), title: 'リーディングセクションを30分練習', date: daysAgo(4), completed: true, goalId: 'st23' },
  { id: tid(), title: '発表資料の最終確認', date: daysAgo(4), completed: true, goalId: 'st26' },
  { id: tid(), title: 'エンベデッドシステムの参考書を読む', date: daysAgo(4), completed: false, goalId: 'st21' },
  { id: tid(), title: 'LaravelルートをRESTful化', date: daysAgo(3), completed: true, goalId: 'mt1' },
  { id: tid(), title: '月の支出を集計する', date: daysAgo(3), completed: true, goalId: 'st32' },
  { id: tid(), title: 'GitHub Issueをクローズ', date: daysAgo(3), completed: true, goalId: 'mt2' },
  { id: tid(), title: '30分リスニング', date: daysAgo(2), completed: true, goalId: 'st23' },
  { id: tid(), title: '就寝時間を記録', date: daysAgo(2), completed: true, goalId: 'st14' },
  { id: tid(), title: 'React Query を導入する', date: daysAgo(2), completed: false, goalId: 'st1' },
  { id: tid(), title: 'ESLintルールを追加', date: daysAgo(1), completed: true, goalId: 'st1' },
  { id: tid(), title: 'TOEIC単語を50語復習', date: daysAgo(1), completed: true, goalId: 'st23' },
  { id: tid(), title: 'Componentを10個テスト', date: daysAgo(1), completed: false, goalId: 'st1' },

  // ── Today (TODAY) ────────────────────────────────────────────────────────────────────────────
  { id: tid(), title: 'ReactのuseReducerをドキュメントで学ぶ', description: '公式ドキュメントのuseReducerページを通読し、サンプルコードを写経する。', date: TODAY, completed: false, goalId: 'st1' },
  { id: tid(), title: 'TypeScript型チャレンジを3問解く', description: 'type-challenges リポジトリから medium 難度を3問選んで解く。', date: TODAY, completed: true, goalId: 'st1' },
  { id: tid(), title: '英語技術記事を1本精読する', date: TODAY, completed: false, goalId: 'st20' },
  { id: tid(), title: '30分ジョギング', description: '近所の公園を2周（約30分）走る。ペースはキロ6分程度でOK。', date: TODAY, completed: false, goalId: 'st13' },
  { id: tid(), title: 'TOEIC 単語を50個復習', description: 'Anki で Part 3・4 よく出る単語を50語復習する。', date: TODAY, completed: false, goalId: 'st23' },
  { id: tid(), title: '月の固定費リストを完成させる', description: 'Google Sheets で固定費の一覧表を作成し、合計金額を計算する。', date: TODAY, completed: false, goalId: 'st32' },
  { id: tid(), title: 'Reactのコンポーネント構成を見直す', description: '現在のコンポーネント階層を図に落とし、改善案を2つ出す。', date: TODAY, completed: true, goalId: 'mt1' },
  { id: tid(), title: 'GitHub Issueを1件作成する', date: TODAY, completed: false, goalId: 'mt2' },
  { id: tid(), title: 'ストレッチをする', date: TODAY, completed: false, goalId: 'st13' },
  { id: tid(), title: '目標マップのラベル色が正しく反映されているか確認', date: TODAY, completed: false },

  // ── Tomorrow (F1) ────────────────────────────────────────────────────────────────────────────
  { id: tid(), title: 'Part5の文法問題を10問解く', description: '金のフレーズから Part5 セクションを10問ランダム選択して解く。', date: daysAfter(1), completed: false, goalId: 'st23' },
  { id: tid(), title: 'ストレッチをする', date: daysAfter(1), completed: false, goalId: 'st13' },
  { id: tid(), title: '不要なサブスクを洗い出す', description: 'クレジットカード明細から月3回以上の利用がないサービスをリストアップ。', date: daysAfter(1), completed: false, goalId: 'st32' },
  { id: tid(), title: '学校の課題レポートを作成する', date: daysAfter(1), completed: false },

  // ── Future (F7, F14, F30) ────────────────────────────────────────────────────────────────────────
  { id: tid(), title: 'TOEIC試験日', description: 'TOEIC公開テストの受験日。', date: daysAfter(7), completed: false, goalId: 'lt3' },
  { id: tid(), title: '学校の定期試験', date: daysAfter(14), completed: false },
  { id: tid(), title: '友人との食事予約', date: daysAfter(30), completed: false },
];

export const tasksNoToday: Task[] = tasksInitial.filter(
  (t) => t.date !== TODAY
);
