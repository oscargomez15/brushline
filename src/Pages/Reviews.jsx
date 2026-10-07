import React, { useState } from 'react';
import reviews from '../Components/paintingReviews.json';
import '../Styling/Reviews.css';
import { FaGoogle, FaStar } from 'react-icons/fa';

export const Reviews = () => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / 2);
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

          <div className="brushline-reviews-panel">
            <div className="brushline-review-grid">{reviews.slice(page * 2, page * 2 + 2).map(review => <article className="brushline-review" key={review.url}>
              <header><span className="brushline-review-avatar" aria-hidden="true">{review.name.charAt(0)}</span><div><strong>{review.name}</strong><span>Google review</span></div></header>
              <div className="reviews-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({length:review.rating},(_,i)=><FaStar key={i} aria-hidden="true"/>)}</div>
              <blockquote>{review.text}</blockquote>
              <a href={review.url} target="_blank" rel="noopener noreferrer">Read on Google ↗</a>
            </article>)}</div>
            <div className="brushline-review-navigation"><a href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9" target="_blank" rel="noopener noreferrer">See more on Google ↗</a><div><button type="button" aria-label="Previous reviews" onClick={()=>setPage((page+totalPages-1)%totalPages)}>←</button><span role="status">{page+1} / {totalPages}</span><button type="button" aria-label="Next reviews" onClick={()=>setPage((page+1)%totalPages)}>→</button></div></div>
          </div>
        </div>
      </div>
    </section>
  );
};
