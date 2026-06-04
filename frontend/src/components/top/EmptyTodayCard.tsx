interface EmptyTodayCardProps {
  onOpenModal: () => void;
}

export function EmptyTodayCard({ onOpenModal }: EmptyTodayCardProps) {
  return (
    <div className="empty-today-card" onClick={onOpenModal} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpenModal(); }}>
      <span className="empty-today-card__emoji">🌱</span>
      <p className="empty-today-card__text">今日の目標設定してないよぉ</p>
      <p className="empty-today-card__sub">
        今日やることを決めると、<br />
        モチベーションが上がるよ！
      </p>
      <button className="empty-today-card__cta" onClick={(e) => { e.stopPropagation(); onOpenModal(); }}>
        <span>＋</span> 今日の目標を追加する
      </button>
    </div>
  );
}
