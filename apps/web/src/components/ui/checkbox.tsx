'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Exibe traço (−) indicando seleção parcial */
  readonly indeterminate?: boolean;
}

/**
 * Checkbox customizado com tema dark (slate/indigo).
 * Suporta estados: unchecked · checked · indeterminate · disabled.
 * Compatível com forwardRef para acesso ao elemento nativo.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, className, disabled, checked, onChange, ...rest }, forwardedRef) => {
    const innerRef = useRef<HTMLInputElement>(null);

    const mergedRef = useCallback(
      (el: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }
      },
      [forwardedRef],
    );

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    const isChecked = checked === true;
    const isActive = isChecked || (indeterminate ?? false);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      onChange?.(e);
    }

    return (
      <span className={`relative inline-flex flex-shrink-0 ${className ?? ''}`}>
        {/* Input nativo oculto — mantém acessibilidade e semântica */}
        <input
          ref={mergedRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          {...rest}
        />

        {/* Visual customizado */}
        <span
          aria-hidden="true"
          className={[
            'w-[18px] h-[18px] rounded flex items-center justify-center select-none',
            'border-2 transition-all duration-150 ease-in-out',
            isActive
              ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]'
              : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800',
            !disabled && !isActive
              ? 'group-hover:border-slate-500 peer-hover:border-slate-500 dark:group-hover:border-slate-400 dark:peer-hover:border-slate-400'
              : '',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-900',
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Checkmark */}
          {isChecked && !(indeterminate ?? false) && (
            <svg
              className="w-[10px] h-[10px] text-white"
              viewBox="0 0 12 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 5 4.5 8.5 11 1" />
            </svg>
          )}

          {/* Traço de indeterminate */}
          {(indeterminate ?? false) && (
            <span className="w-[8px] h-[2px] bg-white rounded-full block" />
          )}
        </span>
      </span>
    );
  },
);

Checkbox.displayName = 'Checkbox';
