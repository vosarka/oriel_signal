import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import "./supporter-lock.css";

/**
 * A supporter feature, shown greyed and out of reach to everyone else, with
 * a lock that explains why and leads to /tiers. Decided with Vos, 2026-10-02.
 * The server withholds what matters (ORIEL's written reading); this is the
 * visible half of the lock.
 */
export function SupporterLock({
  locked,
  label,
  floating = false,
  children,
}: {
  locked: boolean;
  /** Whole-page locks: the lock stays in view at the foot of the screen. */
  floating?: boolean;
  /** What is locked, in a few words: "Static Signature reading". */
  label: string;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className={floating ? "supporter-lock supporter-lock--floating" : "supporter-lock"}>
      <div className="supporter-lock__content" inert aria-hidden="true">
        {children}
      </div>
      <div className="supporter-lock__seal">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/tiers" className="supporter-lock__badge">
              <Lock size={15} strokeWidth={1.5} aria-hidden="true" />
              <span>{label} · for supporters</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="supporter-lock__tip">
            This opens for those who help keep the field alive: the Garden,
            the Deep Garden, or any gift. See how the field is held.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
