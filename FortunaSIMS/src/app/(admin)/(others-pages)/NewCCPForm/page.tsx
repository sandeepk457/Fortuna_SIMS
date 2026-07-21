import { Suspense } from "react";
import NewCCPFormClient from "./NewCCPFormClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewCCPFormClient />
    </Suspense>
  );
}