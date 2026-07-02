interface GoalPositionSaveToastProps {
  message: string;
  type: 'success' | 'error';
}

export function GoalPositionSaveToast({ message, type }: GoalPositionSaveToastProps) {
  return (
    <div
      className={`goal-position-save-toast goal-position-save-toast--${type}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
