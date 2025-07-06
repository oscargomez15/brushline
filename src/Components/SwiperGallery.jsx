import React from 'react'
import '../Styling/Gallery.css'
import { SwiperSlide, Swiper } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export const SwiperGallery = () => {
    // Accessing the files in the jobs document that has the extension png, jpeg, jpg, svg.
    const images = require.context('../Assets/jobs', false, /\.(png|jpe?g|svg|JPG|jpg)$/);
    const imageFiles = images.keys().map(images);
  return (
    <div className="gallery-container">
        {/* traversing the images in the folder to render them automatically. Adding new images to the files automatically adds them. */}
        <Swiper navigation={true} modules={[Navigation]} className='drywall-swiper'>
        </Swiper>
    </div>
  )
}
