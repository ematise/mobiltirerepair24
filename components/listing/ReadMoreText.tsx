'use client';

import { useState } from 'react';

export default function ReadMoreText({
  text,
  maxChars = 160,
}: {
  text: string;
  maxChars?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = text.length > maxChars;

  if (!needsTruncate) {
    return (
      <p className="text-[15px] text-muted leading-relaxed mb-8 [font-family:var(--font-body)]">
        {text}
      </p>
    );
  }

  const preview = text.slice(0, maxChars).trimEnd();

  return (
    <p className="text-[15px] text-muted leading-relaxed mb-8 [font-family:var(--font-body)]">
      {expanded ? text : `${preview}…`}{' '}
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="text-cta font-medium hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </p>
  );
}
