import { Suspense } from "react";
import PurchaseRequisitionClient from "./PurchaseRequisitionClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseRequisitionClient />
    </Suspense>
  );
}