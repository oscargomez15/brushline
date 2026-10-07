import PaintingEstimateForm from '../Components/PaintingEstimateForm';
import { Hammer, Sofa, Wrench, Check } from 'lucide-react';
import { Reviews } from './Reviews';
import { ServiceAreaSection } from './ServiceAreaSection';
import PaintingReviewCard from '../Components/PaintingReviewCard';
import '../Styling/Painting.css';
import '../Styling/PaintingFunnel.css';
import '../Styling/ServiceHero.css';
import '../Styling/HomeServices.css';

const services = [
  { Icon: Wrench, title: 'Small repairs & maintenance', text: 'Help with the everyday repairs that keep your home comfortable and looking its best.', items: ['Door and trim adjustments', 'Caulking and finish touch-ups', 'Minor wall repairs', 'General home maintenance'] },
  { Icon: Sofa, title: 'Furniture assembly', text: 'Get your new furniture assembled carefully, without spending your weekend on instructions.', items: ['Dressers and storage furniture', 'Tables, desks, and chairs', 'Bed frames', 'Shelving and organizers'] },
  { Icon: Hammer, title: 'Home improvements', text: 'Practical updates and finishing work for the spaces you use every day.', items: ['Shelves and wall accessories', 'Trim and finishing details', 'Painting and drywall touch-ups', 'A list of small projects in one visit'] },
];
export default function HomeServices() {
  return <div className="page painting-funnel-page home-services-page">
    <section className="painting-conversion-hero" id="contact">
      <div className="painting-hero-copy"><span className="painting-eyebrow">Fort Myers · Estero · Bonita Springs · Naples</span><h1>Small projects.<br/><span>A better home.</span></h1><p>Home repairs, furniture assembly, and practical improvements—with careful workmanship and clear communication from Brushline Services.</p><div className="painting-hero-actions"><a className="painting-call-button" href="tel:+12397773713"><strong>Call for a Free Estimate<br/>(239) 777-3713</strong></a><span className="painting-call-note">Let’s talk about your project. No obligation.</span></div><figure><img src="/images/brushline-owner-portrait.jpg" alt="Brushline Services owner beside the company truck" fetchPriority="high"/></figure><PaintingReviewCard/></div>
      <div className="painting-estimate-options"><PaintingEstimateForm service="home_services" /><div className="painting-or-divider"><span>OR</span></div><div className="painting-assistant-option"><h2>Plan your visit with our AI assistant</h2><a href="/assistant">Talk to Our AI Assistant →</a><small>Choose an available time and confirm your details.</small></div></div>
    </section>
    <Reviews/>
    <section className="painting-services-section"><div className="painting-services-container"><div className="painting-services-header"><span>HOME SERVICES</span><h2>Help with your home’s to-do list</h2><p>Tell us what you need. We’ll review the scope and explain the next steps before work begins.</p></div><div className="home-services-grid">{services.map(({Icon,title,text,items})=><article className="home-service-card" key={title}><Icon size={30}/><h3>{title}</h3><p>{text}</p><ul>{items.map(item=><li key={item}><Check size={17}/>{item}</li>)}</ul></article>)}</div></div></section>
    <ServiceAreaSection/>
    <div className="painting-final-action"><h2>One project or a whole list?</h2><a href="#contact">Request a Free Estimate</a><p>Let’s discuss the work and find a time that suits you.</p></div>
    <section className="service-questions" aria-labelledby="home-services-faq"><span>PLANNING YOUR PROJECT</span><h2 id="home-services-faq">Home service questions</h2>{[['Can I request several small jobs?','Yes. Include your project list so we can discuss the work together and plan the visit.'],['Can you assemble furniture I already purchased?','Yes. Tell us the furniture type and model, and whether it has been delivered.'],['How is the work priced?','Pricing depends on the scope, materials, and time involved. We’ll discuss your project and provide a proposal before work begins.'],['Do you handle every type of repair?','We review each request first. Work requiring a specialist or licensed trade will be discussed before scheduling the job.']].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
  </div>;
}
