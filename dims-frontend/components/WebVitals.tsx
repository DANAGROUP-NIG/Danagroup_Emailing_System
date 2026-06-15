"use client";

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals } from "@/lib/vitals";

export function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}
