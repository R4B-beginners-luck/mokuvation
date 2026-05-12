import { useState, useRef, useCallback, useEffect } from 'react';
import type {  LongTermGoal, MidTermGoal, ShortTermGoal, Goal, NodePosition  } from '../../../types';

interface GoalGraphProps {
  longTermGoal: LongTermGoal;
  midTermGoals: MidTermGoal[];
  shortTermGoals: ShortTermGoal[];
  selectedId: string | null;
  onSelectNode: (goal: Goal) => void;
}

const NODE_CONFIG = {
  long:  { r: 36, color: '#e8a234', textColor: '#e8a234', fontSize: 13, fontWeight: '700' },
  mid:   { r: 26, color: '#5ab5a0', textColor: '#5ab5a0', fontSize: 12, fontWeight: '600' },
  short: { r: 18, color: '#9b7fd4', textColor: '#c2b3e6', fontSize: 11, fontWeight: '500' },
};

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function getPolygonPoints(type: string, radius: number): string {
  if (type === 'long') {
    // Hexagon
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${radius * Math.cos(angle_rad)},${radius * Math.sin(angle_rad)}`);
    }
    return points.join(' ');
  }
  if (type === 'mid') {
    // Square
    const size = radius;
    return `-${size},-${size} ${size},-${size} ${size},${size} -${size},${size}`;
  }
  return '';
}

function computeInitialPositions(
  lt: LongTermGoal,
  mids: MidTermGoal[],
  shorts: ShortTermGoal[],
  cx: number,
  cy: number
): Record<string, NodePosition> {
  const pos: Record<string, NodePosition> = {};

  pos[lt.id] = { x: cx, y: cy };

  const R1 = 170;
  mids.forEach((m, i) => {
    const angle = (i / mids.length) * 2 * Math.PI - Math.PI / 2;
    pos[m.id] = { x: cx + R1 * Math.cos(angle), y: cy + R1 * Math.sin(angle) };
  });

  const grouped: Record<string, ShortTermGoal[]> = {};
  shorts.forEach((s) => {
    const pid = s.midTermGoalId ?? lt.id;
    if (!grouped[pid]) grouped[pid] = [];
    grouped[pid].push(s);
  });

  Object.entries(grouped).forEach(([parentId, children]) => {
    const parent = pos[parentId];
    if (!parent) return;

    const R2 = parentId === lt.id ? 280 : 115;
    const baseAngle = parentId === lt.id ? 0 : Math.atan2(parent.y - cy, parent.x - cx);
    const spread = children.length > 1 ? Math.min(Math.PI * 0.55, (children.length - 1) * 0.3) : 0;

    children.forEach((s, i) => {
      const offset = children.length > 1
        ? -spread / 2 + (spread / (children.length - 1)) * i
        : 0;
      const angle = baseAngle + offset;
      pos[s.id] = {
        x: parent.x + R2 * Math.cos(angle),
        y: parent.y + R2 * Math.sin(angle),
      };
    });
  });

  return pos;
}

export function GoalGraph({
  longTermGoal,
  midTermGoals,
  shortTermGoals,
  selectedId,
  onSelectNode,
}: GoalGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;

  const [positions, setPositions] = useState<Record<string, NodePosition>>(() =>
    computeInitialPositions(longTermGoal, midTermGoals, shortTermGoals, cx, cy)
  );

  useEffect(() => {
    setPositions(computeInitialPositions(longTermGoal, midTermGoals, shortTermGoals, cx, cy));
  }, [longTermGoal.id, midTermGoals.length, shortTermGoals.length, cx, cy]);

  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const svg = svgRef.current!;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    dragRef.current = {
      id,
      ox: svgP.x - (positions[id]?.x ?? 0),
      oy: svgP.y - (positions[id]?.y ?? 0),
    };
  }, [positions]);

  const onSvgMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const svg = svgRef.current!;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const { id, ox, oy } = dragRef.current;
    setPositions((prev) => ({ ...prev, [id]: { x: svgP.x - ox, y: svgP.y - oy } }));
  }, []);

  const onSvgMouseUp = useCallback((e: React.MouseEvent, clickedId?: string) => {
    if (dragRef.current) {
      const wasDrag =
        dragRef.current.id === clickedId
          ? false
          : true;
      if (!wasDrag && clickedId) {
      }
    }
    dragRef.current = null;
  }, []);

  const drawnMidEdges = new Set<string>();

  const edges: {
    x1: number; y1: number; x2: number; y2: number;
    dashed: boolean; color: string; opacity: number;
  }[] = [];

  const addEdge = (
    fromId: string, toId: string,
    dashed: boolean, color: string, opacity: number
  ) => {
    const a = positions[fromId];
    const b = positions[toId];
    if (!a || !b) return;
    edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, dashed, color, opacity });
  };

  midTermGoals.forEach((m) => {
    addEdge(longTermGoal.id, m.id, false, '#e8a234', 0.5);
  });

  shortTermGoals
    .filter((s) => !s.midTermGoalId)
    .forEach((s) => addEdge(longTermGoal.id, s.id, false, '#9b7fd4', 0.4));

  shortTermGoals
    .filter((s) => s.midTermGoalId)
    .forEach((s) => addEdge(s.midTermGoalId!, s.id, false, '#5ab5a0', 0.45));

  midTermGoals.forEach((m) => {
    m.relatedMidTermGoalIds.forEach((relId) => {
      const key = [m.id, relId].sort().join('--');
      if (!drawnMidEdges.has(key)) {
        drawnMidEdges.add(key);
        addEdge(m.id, relId, true, '#5ab5a0', 0.3);
      }
    });
  });

  const allGoals: Goal[] = [
    longTermGoal,
    ...midTermGoals,
    ...shortTermGoals,
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size.w} ${size.h}`}
      onMouseMove={onSvgMouseMove}
      onMouseUp={(e) => onSvgMouseUp(e)}
      onMouseLeave={() => { dragRef.current = null; }}
      style={{ display: 'block', userSelect: 'none' }}
    >
      <defs>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g>
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.color}
            strokeWidth={e.dashed ? 1.5 : 1.5}
            strokeOpacity={e.opacity}
            strokeDasharray={e.dashed ? '5,4' : undefined}
          />
        ))}
      </g>

      <g>
        {allGoals.map((goal) => {
          const p = positions[goal.id];
          if (!p) return null;

          const cfg        = NODE_CONFIG[goal.type];
          const isSelected = goal.id === selectedId;
          const isShort    = goal.type === 'short';
          const isDone     = isShort && (goal as ShortTermGoal).completed;

          const maxLen = goal.type === 'long' ? 14 : goal.type === 'mid' ? 12 : 10;
          const displayTitle = truncateText(goal.title, maxLen);
          const iconYOffset = cfg.r * 1.5;

          return (
            <g
              key={goal.id}
              transform={`translate(${p.x},${p.y})`}
              style={{ cursor: 'pointer' }}
              onMouseDown={(e) => onNodeMouseDown(e, goal.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (!dragRef.current) onSelectNode(goal);
              }}
            >
              {isSelected && goal.type !== 'short' && (
                <>
                  <polygon
                    points={getPolygonPoints(goal.type, cfg.r + 10)}
                    fill={cfg.color}
                    opacity={0.15}
                  />
                  <polygon
                    points={getPolygonPoints(goal.type, cfg.r + 6)}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth={3}
                    strokeOpacity={0.8}
                  />
                </>
              )}
              {isSelected && goal.type === 'short' && (
                <>
                  <circle
                    r={cfg.r + 10}
                    fill={cfg.color}
                    opacity={0.15}
                  />
                  <circle
                    r={cfg.r + 6}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth={3}
                    strokeOpacity={0.8}
                  />
                </>
              )}

              {goal.type !== 'short' ? (
                <polygon
                  points={getPolygonPoints(goal.type, cfg.r)}
                  fill={cfg.color}
                  stroke={isSelected ? cfg.color : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
              ) : (
                <circle
                  r={cfg.r}
                  fill={isDone ? '#3a3840' : cfg.color}
                  stroke={isSelected ? cfg.color : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isDone ? 0.6 : 1}
                />
              )}

              {isDone && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={cfg.r * 0.7}
                  fill={cfg.color}
                  opacity={0.9}
                  style={{ pointerEvents: 'none' }}
                >
                  ✓
                </text>
              )}

              {/* Title outside the shape */}
              <text
                textAnchor="middle"
                fontSize={cfg.fontSize}
                fontWeight={cfg.fontWeight}
                fontFamily="'DM Sans', sans-serif"
                fill={isSelected ? '#ffffff' : cfg.textColor}
                y={iconYOffset}
                style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {displayTitle}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
