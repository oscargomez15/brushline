import React, { useRef, useEffect } from 'react';

export const HoverVideo = ({ src, startTime = 0 }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      video.currentTime = startTime;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [startTime]);

  const handleMouseEnter = () => {
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    videoRef.current?.pause();
    videoRef.current.currentTime = startTime;
  };

  return (
    <video
      ref={videoRef}
      src={src}
      className="hover-video"
      muted
      playsInline
      preload="metadata"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

// Usage example: