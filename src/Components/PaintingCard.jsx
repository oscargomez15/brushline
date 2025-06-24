import { useRef } from "react";
export const PaintingCard = ({ src, title, description }) => {

    const videoRef = useRef(null); // Unique ref per component
  
    const handleMouseEnter = () => {
      videoRef.current?.play();
    };
  
    const handleMouseLeave = () => {
      videoRef.current?.pause();
    };
  
    return (
      <div
        className="item-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="video-container">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="metadata"
            className="video"
          >
            <source src={src} />
          </video>

            <div className="item-info">
              <h2>{title}</h2>
              <h3>{description}</h3>
            </div>


        </div>

      </div>
    );
  };