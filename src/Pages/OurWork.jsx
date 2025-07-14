import React from 'react'
import '../Styling/Gallery.css'
import {FaArrowRight} from 'react-icons/fa'
import { SwiperGallery } from '../Components/SwiperGallery';
export const OurWork = () => {
  return (
    <section className='gallery-page' id='gallery'>
      <div className="gallery-content">
        <SwiperGallery/>
        <button className='button view-more-btn'>view more <FaArrowRight/></button>
      </div>
    </section>
  )
}
