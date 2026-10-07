import React from "react";
import "../Styling/Privacy.css";

export const Accessibility = () => (
  <section className="page" aria-labelledby="accessibility-title">
    <div className="privacy-policy cartoon-box">
      <h1 id="accessibility-title" className="section-subtitle">
        Accessibility
      </h1>
      <p>
        Brushline LLC is committed to making our website and online services
        accessible to people of all abilities. We are working toward the Web
        Content Accessibility Guidelines (WCAG) 2.2 Level AA.
      </p>
      <div className="privacy-section">
        <h2>Need assistance?</h2>
        <p>
          If you have difficulty using any part of this website, need
          information in another format, or encounter an accessibility barrier,
          please contact us. We will make reasonable efforts to provide the
          information or service through an accessible alternative.
        </p>
        <p>
          Email: <a href="mailto:contact@brushlineservices.com">contact@brushlineservices.com</a>
          <br />
          Phone: <a href="tel:+12397773713">(239) 777-3713</a>
        </p>
      </div>
      <div className="privacy-section">
        <h2>When reporting an issue</h2>
        <p>
          Please include the page address, a short description of the problem,
          the browser or assistive technology you were using, and the best way
          to contact you. This helps us investigate and respond more quickly.
        </p>
      </div>
    </div>
  </section>
);
