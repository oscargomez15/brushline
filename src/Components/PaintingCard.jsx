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
        className="item-card cartoon-box"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            className="video"
          >
            <source src={src} />
          </video>

            <div className="item-info">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>

      </div>
    );
  };