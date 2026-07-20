import { useEffect } from "react";

import { TetradicSignatureVideoExperience } from "@/features/tetradic-signature/TetradicSignatureVideoExperience";

export default function TetradicSignatureSimpleExperience() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return <TetradicSignatureVideoExperience />;
}
