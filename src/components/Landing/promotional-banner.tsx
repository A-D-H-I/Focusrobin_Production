"use client";

import { useState, useEffect } from "react";
import { getScrollingBanners } from "@/app/actions/scrollingBanner";
import React from "react";

// Helper function to parse and render text with bold formatting
// Supports <b>text</b> or <strong>text</strong> tags
function parseBoldText(text: string): (string | React.ReactElement)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /<(b|strong)>(.*?)<\/\1>/gi;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${key++}`} className="font-black">
        {match[2]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

interface PromotionalBannerProps {
  banners: string[];
}

export default function PromotionalBanner({ banners }: PromotionalBannerProps) {
  const bannerTexts = banners;

  // Create a sequence where all offers are shown together, then repeated
  const textSequence: string[] = [];
  for (let i = 0; i < 15; i++) {
    bannerTexts.forEach((text) => {
      textSequence.push(text);
    });
  }

  if (bannerTexts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 w-full bg-brand-blue text-white py-3 sm:py-4 overflow-hidden z-[101]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 101
      }}
    >
      <div className="flex animate-scroll whitespace-nowrap">
        {/* First set of messages */}
        {textSequence.map((item, index) => (
          <span
            key={`first-${index}`}
            className="text-sm sm:text-base font-bold uppercase tracking-wide inline-block mr-12"
          >
            {parseBoldText(item)}
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {textSequence.map((item, index) => (
          <span
            key={`second-${index}`}
            className="text-sm sm:text-base font-bold uppercase tracking-wide inline-block mr-12"
          >
            {parseBoldText(item)}
          </span>
        ))}
      </div>
    </div>
  );
}
