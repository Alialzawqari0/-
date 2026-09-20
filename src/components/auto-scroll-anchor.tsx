"use client";

import * as React from "react";

export function AutoScrollAnchor({ trigger }: { trigger: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [trigger]);

  return <div ref={ref} />;
}
