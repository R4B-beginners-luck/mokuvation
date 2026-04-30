import { useState } from 'react';
import type { Goal, ShortTermGoal } from '../types';
import { longTermGoals, midTermGoals } from '../data/dummy';
import { GoalGraph, GoalDetailPanel } from '../features/goals';

interface GoalsPageProps {
  shortTermGoals: ShortTermGoal[];
}

export function GoalsPage({ shortTermGoals }: GoalsPageProps) {
  const [activeLtId, setActiveLtId]   = useState(longTermGoals[0]?.id ?? '');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const activeLt    = longTermGoals.find((l) => l.id === activeLtId)!;
  const activeMids  = midTermGoals.filter((m) => m.longTermGoalId === activeLtId);
  const activeShorts = shortTermGoals.filter((s) => s.longTermGoalId === activeLtId);

  const handleSelectNode = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  return (
    <div className="goals-page">
      {/* Graph area */}
      <div className="goals-page__graph-area">
        <div className="goals-page__header">
          <h1 className="goals-page__title">🗺️ 目標マップ</h1>
          <div className="goals-page__selector">
            {longTermGoals.map((lt) => (
              <button
                key={lt.id}
                className={`goal-selector-btn${activeLtId === lt.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveLtId(lt.id);
                  setSelectedGoal(null);
                }}
              >
                {lt.title}
              </button>
            ))}
          </div>
        </div>

        <div className="graph-canvas-wrap">
          {activeLt && (
            <GoalGraph
              longTermGoal={activeLt}
              midTermGoals={activeMids}
              shortTermGoals={activeShorts}
              selectedId={selectedGoal?.id ?? null}
              onSelectNode={handleSelectNode}
            />
          )}

          {/* Legend */}
          <div className="graph-legend">
            <div className="graph-legend__item">
              <span className="graph-legend__dot" style={{ background: 'var(--node-long)' }} />
              長期目標
            </div>
            <div className="graph-legend__item">
              <span className="graph-legend__dot" style={{ background: 'var(--node-mid)' }} />
              中期目標
            </div>
            <div className="graph-legend__item">
              <span className="graph-legend__dot" style={{ background: 'var(--node-short)' }} />
              短期目標
            </div>
            <div className="graph-legend__item" style={{ marginLeft: 'var(--sp-2)', paddingLeft: 'var(--sp-2)', borderLeft: '1px solid var(--border)' }}>
              <span style={{ borderBottom: '1.5px dashed var(--accent-teal)', width: 16, display: 'inline-block', marginRight: 6 }} />
              中期↔中期
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <GoalDetailPanel
        selected={selectedGoal}
        longTermGoals={longTermGoals}
        midTermGoals={midTermGoals}
        shortTermGoals={shortTermGoals}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}
