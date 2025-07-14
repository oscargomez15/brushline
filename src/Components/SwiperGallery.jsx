import React from 'react'
import '../Styling/Gallery.css'
import { SwiperSlide, Swiper } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export const SwiperGallery = () => {

  const getAltText = (imagePath) => {
    const fileName = imagePath.split('/').pop().split('.')[0]; // "naples-painting"
    return fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // "Naples Painting"
  };

  const images = require.context('../Assets/jobs', false, /\.(png|jpe?g|svg|JPG|jpg)$/);
    const imageFiles = images.keys().map(images);

    const workInfo = [
  {
    name: 'Drywall Patch',
    location: 'Fort Myers, FL',
  },
  {
    name: 'Ceiling Paint',
    location: 'Cape Coral, FL',
  },
  {
    name: 'Ceiling Paint',
    location: 'Fort Myers, FL',
  },
  {
    name: 'Drywall Installation',
    location: 'Fort Myers, FL',
  },  {
    name: 'Drywall Installation',
    location: 'Fort Myers, FL',
  },
];
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
        {workInfo.map((w, i) => (
          <SwiperSlide key={i}>
            <div className="card-gallery">
              <div className="image-container">
                <img src={imageFiles[i]} alt={getAltText(imageFiles[i])}/>
              </div>
              <div className="info">
                <h3>{w.name}</h3>
                <p>{w.location}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

