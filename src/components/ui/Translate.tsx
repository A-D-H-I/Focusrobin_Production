"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Loader2 } from 'lucide-react';

interface TranslateProps {
  children: string | ReactNode;
  sourceLanguage?: string;
  fallback?: ReactNode;
  className?: string;
  showLoader?: boolean;
}

/**
 * Component that automatically translates its children text based on current language
 * 
 * @example
 * <Translate>Hello, world!</Translate>
 * <Translate sourceLanguage="en">Welcome</Translate>
 */
export default function Translate({ 
  children, 
  sourceLanguage,
  fallback,
  className,
  showLoader = false 
}: TranslateProps) {
  const { translate, isTranslating, shouldTranslate } = useTranslation({ sourceLanguage });
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Only process string children
  const textToTranslate = typeof children === 'string' ? children : null;

  useEffect(() => {
    if (!textToTranslate || !shouldTranslate) {
      setTranslatedText(textToTranslate || '');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    translate(textToTranslate)
      .then((translated) => {
        if (!cancelled) {
          setTranslatedText(translated);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslatedText(textToTranslate);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [textToTranslate, shouldTranslate, translate]);

  // If not a string, render as-is
  if (!textToTranslate) {
    return <>{children}</>;
  }

  // Show loader if requested and translating
  if ((isLoading || isTranslating) && showLoader) {
    return (
      <span className={className}>
        {fallback || (
          <span className="inline-flex items-center gap-1">
            {textToTranslate}
            <Loader2 className="h-3 w-3 animate-spin opacity-50" />
          </span>
        )}
      </span>
    );
  }

  // Show translated or original text
  const displayText = shouldTranslate && translatedText ? translatedText : textToTranslate;

  return <span className={className}>{displayText}</span>;
}

