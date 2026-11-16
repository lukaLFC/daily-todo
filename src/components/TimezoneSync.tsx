"use client";

import { useEffect } from "react";
import { updateTimezone } from "@/app/lists/actions";

export default function TimezoneSync({ current }: { current: string }) {
  // useEffect runs after the component appears in the browser, like ngOnInit in Angular
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && zone !== current) updateTimezone(zone);
  }, [current]);

  return null;
}