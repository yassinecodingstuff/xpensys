import type { FC, HTMLAttributes, ReactNode } from 'react';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export const Table: FC<TableProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table
          className={['min-w-full border-separate border-spacing-0 text-sm', className]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHeader: FC<TableHeaderProps> = ({ children, className = '', ...props }) => (
  <thead
    className={['bg-slate-50 text-xs uppercase tracking-wide text-slate-500', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </thead>
);

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableBody: FC<TableBodyProps> = ({ children, className = '', ...props }) => (
  <tbody
    className={['divide-y divide-slate-100 bg-white text-slate-700', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </tbody>
);

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  interactive?: boolean;
}

export const TableRow: FC<TableRowProps> = ({
  children,
  interactive = false,
  className = '',
  ...props
}) => (
  <tr
    className={[
      'transition-colors',
      interactive ? 'hover:bg-slate-50 cursor-pointer' : 'hover:bg-slate-50/60',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </tr>
);

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TableHead: FC<TableHeadProps> = ({ children, className = '', ...props }) => (
  <th
    scope="col"
    className={[
      'border-b border-slate-100 px-4 py-3 text-left text-xs font-medium text-slate-500',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </th>
);

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export const TableCell: FC<TableCellProps> = ({ children, className = '', ...props }) => (
  <td
    className={[
      'whitespace-nowrap px-4 py-3 align-middle text-sm text-slate-700',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </td>
);

