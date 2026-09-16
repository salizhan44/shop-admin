import { Suspense, type ReactNode } from "react";
import DashboardLoading from "./loading";

export default function DashboardTemplate({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <Suspense fallback={<DashboardLoading />}>{children}</Suspense>;
}
