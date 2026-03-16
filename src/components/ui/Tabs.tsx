import type { FC, ReactNode } from 'react';
import { useState } from 'react';

export type TabsVariant = 'underline' | 'pills';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  variant?: TabsVariant;
  className?: string;
}

export const Tabs: FC<TabsProps> = ({
  items,
  defaultValue,
  value,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || (items[0]?.id ?? ''),
  );

  const activeId = value ?? internalValue;
  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  const handleChange = (id: string) => {
    if (!value) {
      setInternalValue(id);
    }
    onChange?.(id);
  };

  const baseTabClasses =
    'relative inline-flex items-center justify-center text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full';

  const underlineClasses =
    'rounded-none px-0 pb-2 pt-1 text-slate-500 hover:text-slate-900';

  const pillsClasses = 'px-3 py-1.5 text-slate-600 hover:text-slate-900';

  return (
    <div className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}>
      <div
        className={
          variant === 'underline'
            ? 'flex gap-4 border-b border-slate-100'
            : 'inline-flex gap-1 rounded-full bg-slate-50 p-1'
        }
      >
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleChange(item.id)}
              className={[
                baseTabClasses,
                variant === 'underline' ? underlineClasses : pillsClasses,
                isActive
                  ? variant === 'underline'
                    ? 'text-slate-900'
                    : 'bg-white text-slate-900 shadow-sm'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
              {variant === 'underline' && isActive && (
                <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div className="pt-1 text-sm text-slate-700">{activeItem.content}</div>
      )}
    </div>
  );
};

export default Tabs;

