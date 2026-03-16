import type { FC, ReactNode } from 'react';

export type CardVariant = 'default' | 'interactive';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

export const Card: FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
}) => {
  const interactive =
    variant === 'interactive'
      ? 'hover:shadow-md hover:-translate-y-[1px] cursor-pointer'
      : '';

  return (
    <div
      className={[
        'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-150',
        'flex flex-col gap-3',
        interactive,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader: FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={[
      'flex items-center justify-between gap-3',
      'pb-2 border-b border-slate-100/80',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle: FC<CardTitleProps> = ({ children, className = '' }) => (
  <h2
    className={['text-sm font-semibold tracking-tight text-slate-900', className]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </h2>
);

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const CardContent: FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={['pt-1 text-sm text-slate-700', className].filter(Boolean).join(' ')}>
    {children}
  </div>
);


