"use client";

import { ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TranslateProps {
  children: string | ReactNode;
  /** @deprecated Source text is always English */
  sourceLanguage?: string;
  /** @deprecated Translations are synchronous */
  fallback?: ReactNode;
  className?: string;
  /** @deprecated Translations are synchronous */
  showLoader?: boolean;
}

/**
 * Component that translates its children text based on current language
 *
 * @example
 * <Translate>Hello, world!</Translate>
 */
export default function Translate({ children, className }: TranslateProps) {
  const { t } = useTranslation();

  // If not a string, render as-is
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  return <span className={className}>{t(children)}</span>;
}
