import type { ReactNode } from 'react';
import {
  GOALS_SHEET_LEVELS,
  SnapBottomSheet,
} from '../../../components/common/SnapBottomSheet';

export type GoalDetailSheetLevel = 'peek' | 'half' | 'full';

interface GoalDetailSheetProps {
  goalId: string;
  isClosing?: boolean;
  onClose: () => void;
  onSheetHeightChange?: (heightPx: number) => void;
  children: (sheetLevel: GoalDetailSheetLevel) => ReactNode;
}

/**
 * 目標マップ用ボトムシート。
 * スワイプ実装は SnapBottomSheet に委譲し、3段階（peek/half/full）と
 * マップ連動（高さ通知・full→half 閉じ）だけをここで指定する。
 */
export function GoalDetailSheet({
  goalId,
  isClosing = false,
  onClose,
  onSheetHeightChange,
  children,
}: GoalDetailSheetProps) {
  return (
    <SnapBottomSheet
      levels={GOALS_SHEET_LEVELS}
      initialLevelId="peek"
      resetKey={goalId}
      title="目標の詳細"
      ariaLabel="目標の詳細"
      isClosing={isClosing}
      onClose={onClose}
      onSheetHeightChange={onSheetHeightChange}
      collapseLevelId="half"
      expandHintFromLevelId="half"
      expandToLevelId="full"
      hasBackdrop={false}
      classPrefix="goal-detail-sheet"
      draggingBodyClassName="goal-sheet-dragging"
    >
      {(levelId) => children(levelId as GoalDetailSheetLevel)}
    </SnapBottomSheet>
  );
}
