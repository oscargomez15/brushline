import React from 'react';
import '../Styling/Gallery.css';
import { SwiperGallery } from '../Components/SwiperGallery';

export const OurWork = () => {
  return (
    <section className="gallery-section" id="gallery">
      <div className="gallery-container">
        <SwiperGallery />
      </div>
    </section>
  );
};