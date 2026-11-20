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
 * Checkbox customizado nos tokens semânticos (ADR 0002).
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
              ? 'bg-primary border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--ged-primary)_18%,transparent)]'
              : 'border-muted-foreground bg-surface',
            !disabled && !isActive
              ? 'group-hover:border-foreground peer-hover:border-foreground'
              : '',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
            disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Checkmark */}
          {isChecked && !(indeterminate ?? false) && (
            <svg
              className="w-[10px] h-[10px] text-primary-foreground"
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
            <span className="w-[8px] h-[2px] bg-primary-foreground rounded-full block" />
          )}
        </span>
      </span>
    );
  },
);

Checkbox.displayName = 'Checkbox';
