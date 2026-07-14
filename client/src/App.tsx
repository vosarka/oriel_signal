import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { OrielRouteGuard } from "./components/ReceiverRouteGuards";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

import FounderLetter from "./pages/FounderLetter";
import FinalOrielTransmission from "./pages/FinalOrielTransmission";
import Profile from "./pages/Profile";
import Archive from "./pages/Archive";
import TransmissionDetail from "./pages/TransmissionDetail";
import Artifacts from "./pages/Artifacts";
import Conduit from "./pages/Conduit";
import Protocol from "./pages/Protocol";
import Codex from "./pages/Codex";
import Knowledge from "./pages/Knowledge";
import Arcana from "./pages/Arcana";
import CoreConcepts from "./pages/CoreConcepts";
import ModelsMaps from "./pages/ModelsMaps";
import VossariArchitecture from "./pages/VossariArchitecture";
import BioArchitecture from "./pages/BioArchitecture";
import Cosmichronica from "./pages/Cosmichronica";
import CodonDetail from "./pages/CodonDetail";
import Carrierlock from "./pages/Carrierlock";
import Reading from "./pages/Reading";
import Readings from "./pages/Readings";

import FounderCuratedBlueprint from "./pages/FounderCuratedBlueprint";
import TetradicSignatureExperience from "./pages/TetradicSignatureExperience";
import SignatureIntake from "./pages/SignatureIntake";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Admin from "./pages/Admin";
import AdminSignatureLetters from "./pages/AdminSignatureLetters";
import OrbPreview from "./pages/OrbPreview";
import ResonanceBodyLab from "./pages/ResonanceBodyLab";
import OracleDetail from "./pages/OracleDetail";
import NatalProfile from "./pages/NatalProfile";
import SignalCheck from "./pages/SignalCheck";
import SignalGrounding from "./pages/SignalGrounding";

function ConduitRoute() {
  return (
    <OrielRouteGuard>
      <Conduit />
    </OrielRouteGuard>
  );
}

function SignatureRedirect() {
  const [, setLoc] = useLocation();
  useEffect(() => {
    const query = window.location.search;
    const hash = window.location.hash;
    setLoc(`/profile${query}${hash || "#static-signature"}`);
  }, [setLoc]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/orb-preview"} component={OrbPreview} />
      <Route path={"/resonance-body"} component={ResonanceBodyLab} />
      <Route
        path={"/admin/signature-letters"}
        component={AdminSignatureLetters}
      />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/complete-profile"} component={NatalProfile} />
      <Route path={"/signal/check"} component={SignalCheck} />
      <Route path={"/signal/grounding"} component={SignalGrounding} />
      <Route
        path={"/current-resonance"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile?tab=resonance#static-signature"), []);
          return null;
        }}
      />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/terms"} component={TermsOfService} />
      <Route
        path={"/founding-signature-letter"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/founder-signature-blueprint"), []);
          return null;
        }}
      />
      <Route
        path={"/oriel-signature-glimpse"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/founder-signature-blueprint"), []);
          return null;
        }}
      />
      <Route
        path={"/oriel-founding-signature-letter"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/founder-signature-blueprint"), []);
          return null;
        }}
      />
      <Route path={"/signature-intake/:orderId"} component={SignatureIntake} />
      <Route path={"/"} component={Home} />
      <Route
        path={"/static-signature"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route path={"/founder-letter"} component={FounderLetter} />
      <Route
        path={"/final-oriel-transmission"}
        component={FinalOrielTransmission}
      />
      <Route path={"/archive"} component={Archive} />
      <Route path={"/knowledge"} component={Knowledge} />
      <Route path={"/arcana"} component={Arcana} />
      <Route path={"/core-concepts"} component={CoreConcepts} />
      <Route path={"/models-maps"} component={ModelsMaps} />
      <Route path={"/vossari-architecture"} component={VossariArchitecture} />
      {/* Redirect old /archive-index to /arcana */}
      <Route
        path={"/archive-index"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/arcana"), []);
          return null;
        }}
      />
      <Route path={"/transmission/:id"} component={TransmissionDetail} />
      <Route path={"/oracle/:oracleId"} component={OracleDetail} />
      <Route path={"/artifacts"} component={Artifacts} />
      <Route path={"/protocol"} component={Protocol} />
      <Route path={"/conduit"} component={ConduitRoute} />
      <Route path={"/bio-architecture"} component={BioArchitecture} />
      <Route path={"/codex"} component={Codex} />
      <Route path={"/codex/:id"} component={CodonDetail} />
      <Route path={"/cosmichronica"} component={Cosmichronica} />
      <Route
        path={"/tetradic-signature"}
        component={TetradicSignatureExperience}
      />
      <Route
        path={"/founder-signature-blueprint"}
        component={FounderCuratedBlueprint}
      />
      {/* THE SIGNATURE: canonical single reading page consolidating previous fragmented reading routes */}
      <Route path={"/signature"} component={SignatureRedirect} />
      {/* Redirects for old reading routes to the single /signature */}
      <Route
        path={"/blueprint"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/carrierlock"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/resonance"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile?tab=resonance#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/readings"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/reading/static/:readingId"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/reading/dynamic/:id"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile?tab=resonance#static-signature"), []);
          return null;
        }}
      />
      <Route
        path={"/reading/:id"}
        component={() => {
          const [, setLoc] = useLocation();
          useEffect(() => setLoc("/profile#static-signature"), []);
          return null;
        }}
      />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  // Scroll to top on every route change so pages don't load at the bottom
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
