import { FaArrowRight, FaTiktok } from "react-icons/fa";
import "../Styling/SocialVideos.css";

const TIKTOK_VIDEOS = [
  "7525981501712862494",
  "7484432249455185182",
  "7475560715646946591",
  "7497813078541634846",
  "7503237013169081631",
  "7620118910699834654",
  "7586893664958549279",
];

export function SocialVideos() {
  return (
    <section className="social-videos" aria-labelledby="social-videos-title">
      <div className="social-videos-heading">
        <div>
          <span className="social-videos-kicker">
            <FaTiktok aria-hidden="true" /> On the job
          </span>
          <h2 id="social-videos-title">See Our Work in Action</h2>
          <p>
            Step behind the scenes with Brushline and watch real painting projects
            come together across Southwest Florida.
          </p>
        </div>

        <a
          className="social-videos-profile"
          href="https://www.tiktok.com/@brushlinepainting"
          target="_blank"
          rel="noreferrer"
        >
          Follow on TikTok <FaArrowRight aria-hidden="true" />
        </a>
      </div>

      <div className="social-videos-track" aria-label="Brushline TikTok videos">
        {TIKTOK_VIDEOS.map((videoId, index) => (
          <article className="social-video-card" key={videoId}>
            <iframe
              src={`https://www.tiktok.com/player/v1/${videoId}?controls=1&description=1&music_info=0&rel=0&autoplay=0`}
              title={`Brushline painting project video ${index + 1}`}
              loading="lazy"
              allow="fullscreen"
              allowFullScreen
            />
          </article>
        ))}
      </div>

      <p className="social-videos-hint">Swipe or scroll to see more projects</p>
    </section>
  );
}
