import { useEffect } from "react";

import { TetradicSignatureEditorial } from "@/features/tetradic-signature/TetradicSignatureEditorial";
import "@/features/tetradic-signature/tetradic-signature-editorial.css";

export default function TetradicSignatureEditorialExperience() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return <TetradicSignatureEditorial />;
}
