"use client";

import { ReactNode } from "react";
import { DriverProvider } from "./context/DriverContext";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return <DriverProvider>{children}</DriverProvider>;
}
