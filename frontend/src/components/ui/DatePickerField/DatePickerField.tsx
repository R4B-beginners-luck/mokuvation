import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { DatePickerDesktop } from './DatePickerDesktop';
import { DatePickerMobile } from './DatePickerMobile';
import { formatDisplayDate } from './dateUtils';
import './date-picker.css';

export interface DatePickerFieldProps {
  id?: string;
  /** YYYY-MM-DD。clearable 時は空文字 = 未設定 */
  value: string;
  onChange: (value: string) => void;
  /** true = 未設定に戻す操作を表示（目標の期限など任意項目向け） */
  clearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePickerField({
  id,
  value,
  onChange,
  clearable = false,
  disabled = false,
  placeholder = '日付を選択',
}: DatePickerFieldProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);

  const displayText = value ? formatDisplayDate(value) : placeholder;
  const isEmpty = !value;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={[
          'date-picker-trigger',
          isEmpty && 'date-picker-trigger--empty',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{displayText}</span>
        <CalendarDays size={16} strokeWidth={1.75} className="date-picker-trigger__icon" aria-hidden />
      </button>

      {open && !isMobile && (
        <DatePickerDesktop
          anchorRef={triggerRef}
          value={value}
          clearable={clearable}
          onSelect={onChange}
          onClear={() => onChange('')}
          onClose={() => setOpen(false)}
        />
      )}

      {open && isMobile && (
        <DatePickerMobile
          value={value}
          clearable={clearable}
          onConfirm={onChange}
          onClear={() => onChange('')}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
