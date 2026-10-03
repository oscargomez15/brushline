import React from 'react';
import { Link } from 'react-router-dom';
import '../Styling/ServiceQuestions.css';

export default function ServiceQuestions({ city }) {
  return <section className="service-questions" aria-labelledby="service-questions-title">
    <span>Planning your project</span>
    <h2 id="service-questions-title">Painting and home service questions{city ? ` in ${city}` : ''}</h2>
    <details><summary>Where does Brushline Services work?</summary><p>We serve Cape Coral, Fort Myers, Estero, Bonita Springs, and Naples in Southwest Florida. Explore our local pages for <Link to="/service-area/cape-coral-painter">Cape Coral</Link>, <Link to="/service-area/fort-myers-painter">Fort Myers</Link>, <Link to="/service-area/estero-painter">Estero</Link>, <Link to="/service-area/bonita-springs-painter">Bonita Springs</Link>, and <Link to="/service-area/naples-painter">Naples</Link>.</p></details>
    <details><summary>Can you help with painting and drywall repairs?</summary><p>Brushline offers <Link to="/painting">interior and exterior painting</Link> and <Link to="/drywall">drywall repair, installation, and finishing</Link>. Tell us about damaged walls, ceilings, surfaces to repaint, and your project location when requesting an estimate.</p></details>
    <details><summary>How do I request a free estimate?</summary><p>Call <a href="tel:+12397773713">(239) 777-3713</a>, email <a href="mailto:contact@brushlineservices.com">contact@brushlineservices.com</a>, or use the contact form below. Include your location, the services you need, and any project details so we can discuss the scope.</p></details>
    <details><summary>Do you offer cleaning services too?</summary><p>Yes. Our <Link to="/cleaning">cleaning services</Link> include residential cleaning, window cleaning, move-in and move-out cleaning, and deep cleaning. Contact us to discuss your property and the work needed.</p></details>
  </section>;
}
