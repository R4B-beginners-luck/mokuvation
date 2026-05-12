import { useState } from 'react';
import type { Goal, ShortTermGoal, Task } from '../types';
import { longTermGoals, midTermGoals } from '../data/dummy';
import { GoalGraph, GoalDetailPanel } from '../features/goals';

interface GoalsPageProps {
  shortTermGoals: ShortTermGoal[];
  tasks: Task[];
}

export function GoalsPage({ shortTermGoals, tasks }: GoalsPageProps) {
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
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-12 -12 24 24">
                <polygon points="10,0 5,8.66 -5,8.66 -10,0 -5,-8.66 5,-8.66" fill="var(--node-long)" />
              </svg>
              長期目標
            </div>
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-10 -10 20 20">
                <rect x="-8.5" y="-8.5" width="17" height="17" fill="var(--node-mid)" />
              </svg>
              中期目標
            </div>
            <div className="graph-legend__item" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="-10 -10 20 20">
                <circle cx="0" cy="0" r="8" fill="var(--node-short)" />
              </svg>
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
        tasks={tasks}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}
