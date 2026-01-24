"use client";

import { useEffect } from 'react';

export function LayoutShiftDebugger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // #region agent log
    // Track element positions to detect actual shifts
    const logElementPositions = (event: string) => {
      const header = document.querySelector('header');
      const container = document.querySelector('.container');
      const main = document.querySelector('main');
      
      const logData = {
        timestamp: Date.now(),
        location: 'LayoutShiftDebugger.tsx:' + event,
        message: event,
        data: {
          viewportWidth: window.innerWidth,
          documentClientWidth: document.documentElement.clientWidth,
          scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
          headerWidth: header?.getBoundingClientRect().width,
          headerLeft: header?.getBoundingClientRect().left,
          headerRight: header?.getBoundingClientRect().right,
          containerWidth: container?.getBoundingClientRect().width,
          containerLeft: container?.getBoundingClientRect().left,
          mainWidth: main?.getBoundingClientRect().width,
          mainLeft: main?.getBoundingClientRect().left,
          bodyDataScrollLocked: document.body.getAttribute('data-scroll-locked'),
          htmlOverflow: window.getComputedStyle(document.documentElement).overflowY,
          bodyOverflow: window.getComputedStyle(document.body).overflowY,
        },
        sessionId: 'debug-session',
        runId: 'run3',
        hypothesisId: 'H3,H4,H5'
      };
      fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    };

    // Log initial state
    logElementPositions('INITIAL');

    // Track body mutations and log element positions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-scroll-locked') {
          const newValue = (mutation.target as Element).getAttribute('data-scroll-locked');
          logElementPositions(newValue ? 'LOCKED' : 'UNLOCKED');
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked']
    });
    // #endregion

    return () => observer.disconnect();
  }, []);

  return null;
}

