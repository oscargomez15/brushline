import React, { useState } from 'react';
import reviews from '../Components/paintingReviews.json';
import '../Styling/Reviews.css';
import { FaGoogle, FaStar } from 'react-icons/fa';
import GoogleReviewLink from '../Components/GoogleReviewLink';

export const Reviews = () => {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState({});
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
              <blockquote className={!expanded[review.url] ? 'review-collapsed' : ''}>{review.text}</blockquote>
              {review.text.length > 220 && <button className="review-expand" type="button" aria-expanded={Boolean(expanded[review.url])} onClick={()=>setExpanded(current=>({...current,[review.url]:!current[review.url]}))}>{expanded[review.url]?'Show less':'Read more'}</button>}
              <GoogleReviewLink href={review.url}>Read on Google</GoogleReviewLink>
            </article>)}</div>
            <div className="brushline-review-navigation"><GoogleReviewLink href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9">See all Google reviews</GoogleReviewLink><div><button type="button" aria-label="Previous reviews" onClick={()=>setPage((page+totalPages-1)%totalPages)}>←</button><span role="status">{page+1} / {totalPages}</span><button type="button" aria-label="Next reviews" onClick={()=>setPage((page+1)%totalPages)}>→</button></div></div>
          </div>
        </div>
      </div>
    </section>
  );
};
