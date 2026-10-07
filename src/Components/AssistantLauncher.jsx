import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mic, X } from "lucide-react";
import logo from "../Assets/logo/brushline-logo-white-letters.webp";
import "../Styling/AssistantLauncher.css";

const enabledRoutes = ["/", "/painting", "/drywall", "/cleaning"];

export default function AssistantLauncher() {
  const { pathname } = useLocation();
  const [nudged, setNudged] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = enabledRoutes.includes(pathname) || pathname.startsWith("/service-area/");

  useEffect(() => {
    setNudged(false);
    setDismissed(false);
    if (!visible) return undefined;
    const timer = window.setTimeout(() => setNudged(true), 25000);
    return () => window.clearTimeout(timer);
  }, [pathname, visible]);

  if (!visible) return null;
  return <aside className="assistant-launcher" aria-label="Brushline project assistant">
    {nudged && !dismissed && <div className="assistant-nudge" role="status"><button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss"><X/></button><strong>Have questions about your project?</strong><span>Talk with our assistant and request a free estimate.</span></div>}
    <Link to="/assistant" className="assistant-launch-button" aria-label="Talk with the Brushline project assistant">
      <span className="assistant-launch-logo"><img src={logo} alt=""/></span>
      <span className="assistant-launch-copy"><strong>Free estimate</strong><small>Talk with our assistant</small></span>
      <Mic className="assistant-launch-mic"/>
    </Link>
  </aside>;
}
