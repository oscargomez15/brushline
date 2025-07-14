import React from 'react'
import '../Styling/Gallery.css'
import {FaArrowRight} from 'react-icons/fa'
import { SwiperGallery } from '../Components/SwiperGallery';
export const OurWork = () => {
  const images = require.context('../Assets/jobs', false, /\.(png|jpe?g|svg|JPG|jpg)$/);
  const imageFiles = images.keys().map(images).slice(0, 5);

  const getAltText = (imagePath) => {
  const fileName = imagePath.split('/').pop().split('.')[0]; // "naples-painting"
  return fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // "Naples Painting"
};
  return (
    <section className='gallery-page' id='gallery'>
      <div className="gallery-content">
        <SwiperGallery/>
        <button className='button view-more-btn'>view more <FaArrowRight/></button>
      </div>
    </section>
  )
}
