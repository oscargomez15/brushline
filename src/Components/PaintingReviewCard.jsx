import { useEffect, useState } from 'react';
import reviews from './paintingReviews.json';

export default function PaintingReviewCard() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState({});
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || reducedMotion) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % reviews.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion, index]);
  const review = reviews[index];
  return (
    <section className="painting-review-card" aria-label="Customer reviews" aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="painting-review-slide" key={index} aria-roledescription="slide" aria-label={`${index + 1} of ${reviews.length}`}>
        <div className="painting-review-avatar">
          {review.photo && !failedPhotos[index] ? <img src={review.photo} alt={`${review.name}'s Google profile`} width="56" height="56" referrerPolicy="no-referrer" onError={() => setFailedPhotos(value => ({...value, [index]: true}))}/> : <span aria-hidden="true">{review.name.charAt(0)}</span>}
        </div>
        <div className="painting-review-body"><div className="painting-review-heading"><strong>{review.name}</strong><span className="painting-review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div><blockquote>{review.text}</blockquote></div>
      </div>
      <div className="painting-review-controls">
        <a href={review.url} target="_blank" rel="noreferrer">Full review on Google ↗</a>
        <span>{index + 1} / {reviews.length}</span>
        <button type="button" aria-label="Previous review" onClick={() => setIndex(value => (value - 1 + reviews.length) % reviews.length)}>←</button>
        {!reducedMotion && <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Play' : 'Pause'}</button>}
        <button type="button" aria-label="Next review" onClick={() => setIndex(value => (value + 1) % reviews.length)}>→</button>
      </div>
    </section>
  );
}
