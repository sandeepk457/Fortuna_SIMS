import { Suspense } from "react";
import RFQFormClient from "./RFQFormClient";

export default function RFQFormPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading RFQ...</div>}>
      <RFQFormClient />
    </Suspense>
  );
}