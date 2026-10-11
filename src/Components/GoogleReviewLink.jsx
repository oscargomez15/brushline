import { FaGoogle } from 'react-icons/fa';
import { ExternalLink } from 'lucide-react';
import '../Styling/GoogleReviewLink.css';

export default function GoogleReviewLink({ href, children, compact = false }) {
  return <a className={`google-review-link${compact ? ' google-review-link--compact' : ''}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${children} (opens in a new tab)`}>
    <span className="google-review-link-icon" aria-hidden="true"><FaGoogle /></span>
    <span>{children}</span>
    <ExternalLink className="google-review-link-arrow" size={15} aria-hidden="true" />
  </a>;
}
