import { Link } from "react-router-dom";
import { ArrowRight, MessageSquareText, Mic, ShieldCheck } from "lucide-react";
import logo from "../Assets/logo/brushline-logo-white-letters.webp";
import "../Styling/HomeAssistantCTA.css";

export default function HomeAssistantCTA() {
  return <section className="home-assistant-cta" aria-labelledby="home-assistant-title"><div className="home-assistant-brand"><img src={logo} alt="Brushline Services"/><span><ShieldCheck/> AI-assisted estimate request</span></div><div className="home-assistant-content"><div><span className="home-assistant-eyebrow">Start your project your way</span><h2 id="home-assistant-title">Planning a project?</h2><p>Tell our assistant what you need and request a free in-home estimate, one simple question at a time.</p></div><div className="home-assistant-actions"><Link to="/assistant" className="home-assistant-primary"><Mic/> Talk with our assistant <ArrowRight/></Link><a href="#contact" className="home-assistant-secondary"><MessageSquareText/> Fill out the form instead</a></div></div><small>No appointment is booked until a Brushline team member confirms it.</small></section>;
}
