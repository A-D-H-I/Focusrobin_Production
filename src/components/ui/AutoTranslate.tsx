"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AutoTranslateProps {
  children: ReactNode;
  className?: string;
}

/**
 * Higher-order component that automatically translates all text content
 * when language changes. This uses a data attribute approach to mark
 * translatable elements.
 * 
 * Usage: Wrap your content with <AutoTranslate>
 */
export default function AutoTranslate({ children, className }: AutoTranslateProps) {
  const { language, isLoading } = useLanguage();
  const { translate, shouldTranslate } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState<ReactNode>(children);

  useEffect(() => {
    if (isLoading || !shouldTranslate) {
      setTranslatedContent(children);
      return;
    }

    // Find all text nodes and translate them
    const translateContent = async () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent && node.textContent.trim().length > 0) {
          // Skip if parent has data-translate="false"
          const parent = node.parentElement;
          if (parent && parent.getAttribute('data-translate') === 'false') {
            continue;
          }
          textNodes.push(node as Text);
        }
      }

      // Translate all text nodes
      for (const textNode of textNodes) {
        const originalText = textNode.textContent || '';
        if (originalText.trim().length > 0) {
          try {
            const translated = await translate(originalText);
            if (translated !== originalText) {
              textNode.textContent = translated;
            }
          } catch (error) {
            console.error('Translation error:', error);
          }
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      translateContent();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [language, isLoading, shouldTranslate, translate, children]);

  return <div className={className}>{translatedContent}</div>;
}

