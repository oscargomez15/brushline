import React from 'react';
import { ReviewsWidget } from '../Components/ReviewsWidget';
import '../Styling/Reviews.css';
import { FaGoogle, FaStar } from 'react-icons/fa';

export const Reviews = () => {
  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <div className="reviews-header">
          <span>Customer Reviews</span>
          <h2>Trusted By Homeowners Across Southwest Florida</h2>
          <p>
            See why customers choose Brushline Services for clean work,
            dependable communication, and lasting results.
          </p>
        </div>

        <div className="reviews-layout">
          <div className="reviews-summary-card">
            <div className="google-badge">
              <FaGoogle />
              Google Reviews
            </div>

            <h3>5.0</h3>

            <div className="reviews-stars">
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </div>

            <p>Highly rated by local homeowners and businesses.</p>

            <a href="#contact" className="reviews-cta">
              Request a Free Estimate
            </a>
          </div>

          <div className="reviews-widget-card">
            <ReviewsWidget />
          </div>
        </div>
      </div>
    </section>
  );
};