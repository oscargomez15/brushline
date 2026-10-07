import { Link, useLocation } from "react-router-dom";
import { Mic } from "lucide-react";
import logo from "../Assets/logo/brushline-logo-white-letters.webp";
import "../Styling/AssistantLauncher.css";

const enabledRoutes = ["/", "/painting", "/drywall", "/cleaning", "/home-services"];

export default function AssistantLauncher() {
  const { pathname } = useLocation();
  const visible = enabledRoutes.includes(pathname) || pathname.startsWith("/service-area/");


  if (!visible) return null;
  return <aside className="assistant-launcher" aria-label="Brushline project assistant">
    <Link to="/assistant" className="assistant-launch-button" aria-label="Talk with the Brushline project assistant">
      <span className="assistant-launch-logo"><img src={logo} alt=""/></span>
      <span className="assistant-launch-copy"><strong>Free estimate</strong><small>Talk with our assistant</small></span>
      <Mic className="assistant-launch-mic"/>
    </Link>
  </aside>;
}
