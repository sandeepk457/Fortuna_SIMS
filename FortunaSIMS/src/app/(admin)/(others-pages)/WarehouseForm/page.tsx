import { Suspense } from "react";
import WarehouseFormClient from "./WarehouseFormClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WarehouseFormClient />
    </Suspense>
  );
}