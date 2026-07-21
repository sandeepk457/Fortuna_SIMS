import { Suspense } from "react";
import ItemMasterFormClient from "./ItemMasterFormClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItemMasterFormClient />
    </Suspense>
  );
}