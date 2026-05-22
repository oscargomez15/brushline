import React from 'react';
import '../Styling/Gallery.css';
import { SwiperSlide, Swiper } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export const SwiperGallery = () => {
  const imagesContext = require.context(
    '../Assets/jobs',
    false,
    /\.(png|jpe?g|svg|webp|jpg)$/
  );

  const imageFiles = imagesContext.keys().map((key) => {
    const fileName = key
      .replace('./', '')
      .replace(/\.(png|jpe?g|svg|webp|jpg)$/i, '')
      .replace(/\(\d*\)/g, '')
      .replace(/\d+/g, '');

    const [locationPart, namePart] = fileName.split('_');

    const location = locationPart
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const name = namePart
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return {
      src: imagesContext(key),
      name,
      location,
    };
  });

  return (
    <>
      <div className="gallery-header">
        <span>Our Work</span>
        <h2>See The Quality Behind Every Project</h2>
        <p>
          Explore recent painting, drywall, handyman, and home improvement work
          completed across Southwest Florida.
        </p>
      </div>

      <Swiper
        className="modern-gallery-swiper"
        spaceBetween={24}
        slidesPerView={3}
        navigation
        modules={[Navigation]}
        breakpoints={{
          1100: { slidesPerView: 3 },
          760: { slidesPerView: 2 },
          320: { slidesPerView: 1 },
        }}
      >
        {imageFiles.map((job, index) => (
          <SwiperSlide key={index}>
            <div className="gallery-card-modern">
              <img src={job.src} alt={`${job.name} in ${job.location}`} />

              <div className="gallery-card-overlay"></div>

              <div className="gallery-card-info">
                <h3>{job.name}</h3>
                <p>{job.location}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
};