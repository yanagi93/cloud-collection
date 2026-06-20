import { Suspense } from "react";
import BattleContent from "./BattleContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BattleContent />
    </Suspense>
  );
}
