import { useRef } from "react";
import { FaCheck } from "react-icons/fa";

export const PaintingCard = ({ src, title, items, description }) => {
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    videoRef.current?.pause();
  };

  return (
    <div
      className="painting-card-modern"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="painting-video-wrap">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="painting-video"
        >
          <source src={src} />
        </video>

        <div className="painting-video-overlay"></div>
      </div>

      <div className="painting-card-content">
        <div className="painting-card-top">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <ul className="painting-services-list">
          {items.map((item, index) => (
            <li key={index}>
              <div className="painting-check">
                <FaCheck />
              </div>

              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};