import { Suspense } from "react";
import VendorFormClient from "./VendorFormClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorFormClient />
    </Suspense>
  );
}