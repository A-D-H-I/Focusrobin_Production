"use client";

import React from 'react';

interface ScrollingBannerProps {
  banners?: Array<{ text: string }> | null;
}

// Helper function to parse and render text with bold formatting
// Supports <b>text</b> or <strong>text</strong> tags
function parseBoldText(text: string): (string | React.ReactElement)[] {
  // Replace <b> and </b> tags with bold spans
  // Also replace <strong> and </strong>
  const parts: (string | JSX.Element)[] = [];
  const regex = /<(b|strong)>(.*?)<\/\1>/gi;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${key++}`} className="font-black">
        {match[2]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches, return original text
  return parts.length > 0 ? parts : [text];
}

export default function ScrollingBanner({ banners }: ScrollingBannerProps) {
  // Get all active banner texts, or use default
  const bannerTexts = banners && banners.length > 0 
    ? banners.map(b => b.text)
    : ["BUY 1, GET 1 FREE ON ALL GLASSES! CODE: XMAS2X1"];
  
  // Create a sequence where all offers are shown together, then repeated
  // Example: [Offer1, Offer2, Offer3, Offer1, Offer2, Offer3, ...]
  // This ensures all offers are visible in the scrolling banner
  const textSequence: string[] = [];
  for (let i = 0; i < 15; i++) {
    // Add all offers in sequence
    bannerTexts.forEach((text) => {
      textSequence.push(text);
    });
  }

  return (
    <div className="bg-brand-blue text-white py-3 sm:py-4 overflow-hidden relative">
      <div className="flex animate-scroll whitespace-nowrap">
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

