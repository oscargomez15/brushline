import React from 'react'
import '../Styling/Gallery.css'
import { SwiperGallery } from '../Components/SwiperGallery';
export const OurWork = () => {
  return (
    <section className='gallery-page light-orange' id='gallery'>
      <div className="gallery-content">
        <SwiperGallery/>
        {/* <button className='button view-more-btn'>view more <FaArrowRight/></button> */}
      </div>
    </section>
  )
}
