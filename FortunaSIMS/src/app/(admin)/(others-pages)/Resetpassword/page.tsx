import { Suspense } from "react";
import ResetpasswordClient from "./ResetpasswordClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetpasswordClient />
    </Suspense>
  );
}