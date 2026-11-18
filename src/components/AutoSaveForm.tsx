"use client";

import type { ReactNode } from "react";

// saves as soon as you leave the field
export default function AutoSaveForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <form action={action} onBlur={(e) => e.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}