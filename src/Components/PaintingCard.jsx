import { useRef } from "react";
import { FaCheckCircle } from "react-icons/fa";
export const PaintingCard = ({ src, title, items, description }) => {

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
              <h2>{title}</h2>
              <p>{description}</p>
              <ul className="item-description">
                {items.map((item, index) => (
                  <li key={index}>
                    <FaCheckCircle style={{color:'#2561e8'}}/>
                    <p>{item}</p>
                  </li>))}
              </ul>
            </div>

      </div>
    );
  };