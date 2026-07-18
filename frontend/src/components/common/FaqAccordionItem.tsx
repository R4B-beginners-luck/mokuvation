import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqAccordionItemProps {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** ヘルプ FAQ 用の折りたたみ項目（複数同時オープン可） */
export function FaqAccordionItem({
  question,
  children,
  defaultOpen = false,
}: FaqAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button
        type="button"
        id={buttonId}
        className="faq-item__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="faq-item__question">{question}</span>
        {open ? (
          <ChevronUp size={18} strokeWidth={1.75} className="faq-item__icon" aria-hidden />
        ) : (
          <ChevronDown size={18} strokeWidth={1.75} className="faq-item__icon" aria-hidden />
        )}
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="faq-item__answer"
        >
          {children}
        </div>
      )}
    </div>
  );
}
