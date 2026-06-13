import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StaticSignature from "./pages/StaticSignature";
import FounderLetter from "./pages/FounderLetter";
import FinalOrielTransmission from "./pages/FinalOrielTransmission";
import Profile from "./pages/Profile";
import Archive from "./pages/Archive";
import TransmissionDetail from "./pages/TransmissionDetail";
import Artifacts from "./pages/Artifacts";
import Conduit from "./pages/Conduit";
import Protocol from "./pages/Protocol";
import Codex from "./pages/Codex";
import CodonDetail from "./pages/CodonDetail";
import Carrierlock from "./pages/Carrierlock";
import Reading from "./pages/Reading";
import Readings from "./pages/Readings";
import StaticReading from "./pages/StaticReading";
import DynamicReading from "./pages/DynamicReading";
import CurrentResonance from "./pages/CurrentResonance";
import FoundingSignatureLetter from "./pages/FoundingSignatureLetter";
import {
  FoundingSignatureProductPage,
  SignatureGlimpseProductPage,
} from "./pages/SignatureProductPage";
import SignatureIntake from "./pages/SignatureIntake";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import AdminSignatureLetters from "./pages/AdminSignatureLetters";
import OrbPreview from "./pages/OrbPreview";
import OracleDetail from "./pages/OracleDetail";
import NatalProfile from "./pages/NatalProfile";
import { useAuth } from "@/_core/hooks/useAuth";

function Router() {
  return (
    <Switch>
      <Route path={"/orb-preview"} component={OrbPreview} />
      <Route
        path={"/admin/signature-letters"}
        component={AdminSignatureLetters}
      />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/complete-profile"} component={NatalProfile} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route
        path={"/founding-signature-letter"}
        component={FoundingSignatureLetter}
      />
      <Route
        path={"/oriel-signature-glimpse"}
        component={SignatureGlimpseProductPage}
      />
      <Route
        path={"/oriel-founding-signature-letter"}
        component={FoundingSignatureProductPage}
      />
      <Route path={"/signature-intake/:orderId"} component={SignatureIntake} />
      <Route path={"/"} component={Home} />
      <Route path={"/static-signature"} component={StaticSignature} />
      <Route path={"/founder-letter"} component={FounderLetter} />
      <Route
        path={"/final-oriel-transmission"}
        component={FinalOrielTransmission}
      />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/transmission/:id"} component={TransmissionDetail} />
      <Route path={"/oracle/:oracleId"} component={OracleDetail} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={Conduit} />
      <Route path={"/codex"} component={Codex} />
      <Route path={"/codex/:id"} component={CodonDetail} />
      {/* Cosmichronica: the sacred cosmological text (separate from /codex codon library per structure) */}
      <Route path={"/cosmichronica"} component={Protocol} />
      {/* THE SIGNATURE: canonical single reading page consolidating previous fragmented reading routes */}
      <Route path={"/signature"} component={StaticReading} />
      {/* Redirects for old reading routes to the single /signature */}
      <Route path={"/blueprint"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/carrierlock"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/resonance"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/readings"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/reading/static/:readingId"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/reading/dynamic/:id"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/reading/:id"} component={() => { const [, setLoc] = useLocation(); useEffect(() => setLoc("/signature"), []); return null; }} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppGate() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading || !user || user.hasNatalProfile) return;

    const requiresNatalProfile =
      location === "/profile" ||
      location === "/signature";

    if (requiresNatalProfile && location !== "/complete-profile") {
      setLocation("/complete-profile");
    }
  }, [loading, location, setLocation, user]);

  return <Router />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppGate />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
