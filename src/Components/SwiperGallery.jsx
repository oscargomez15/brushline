import React from 'react'
import '../Styling/Gallery.css'
import { SwiperSlide, Swiper } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export const SwiperGallery = () => {
  const imagesContext = require.context('../Assets/jobs', false, /\.(png|jpe?g|svg|webp|jpg)$/);
  const imageFiles = imagesContext.keys().map((key) => {
  const fileName = key
  .replace('./', '')
  .replace(/\.(png|jpe?g|svg|webp|jpg)$/i, '')
  .replace(/\(\d*\)/g, '')
  .replace(/\d+/g, '');
  
  const [locationPart, namePart] = fileName.split('_');
  const location = locationPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const name = namePart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return {
    src: imagesContext(key),
    name,
    location
  };
});

  return (
    <section className="testimonial-carousel">
    <div className="sub-heading">
      <h1 className="title"><span>Our Work</span> In Action</h1>
      <p className="subtitle">
        Explore our gallery to see the quality and craftsmanship we bring to every project
      </p>
    </div>

      <Swiper
        spaceBetween={30}
        slidesPerView={3}
        navigation={true}
        modules={[Navigation]}
        breakpoints={{
          1024: { slidesPerView: 3 },
          768: { slidesPerView: 2 },
          320: { slidesPerView: 1 },
        }}
      >
        {imageFiles.map((job, index) => (
          <SwiperSlide key={index}>
            <div className="card-gallery">
              <div className="image-container">
                <img src={job.src} alt={`${job.name} in ${job.location}`}/>
              </div>
              <div className="info">
                <h2>{job.name}</h2>
                <p>{job.location}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

