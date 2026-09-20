"use client";

import * as React from "react";

export function EditableTitle({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => void | Promise<void>;
}) {
  const [text, setText] = React.useState(value);

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text.trim() && text !== value) onSave(text.trim());
      }}
      className="w-full bg-transparent text-title font-semibold text-ink outline-none"
    />
  );
}

export function EditableDescription({
  value,
  onSave,
}: {
  value: string;
  onSave: (value: string) => void | Promise<void>;
}) {
  const [text, setText] = React.useState(value);

  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== value) onSave(text);
      }}
      placeholder="أضف وصفاً للمشروع…"
      className="w-full bg-transparent text-body text-graphite outline-none placeholder:text-ash"
    />
  );
}
