import React from 'react'
import '../Styling/Gallery.css'
import {FaArrowRight} from 'react-icons/fa'
export const OurWork = () => {
  const images = require.context('../Assets/jobs', false, /\.(png|jpe?g|svg|JPG|jpg)$/);
  const imageFiles = images.keys().map(images).slice(0, 5);
  return (
    <section className='gallery-page' id='gallery'>
      <div className="gallery-content">
          <div className="sub-heading">
              <h1> <span>Our Work</span> in action</h1>
              <p>Explore our gallery to see the quality and craftsmanship we bring to every project</p>
          </div>

          <div className="images-gallery">
          {imageFiles.map((image, id) => {
            return(
              <div className="gallery-image" key={`image-${id}`}>
                      <img
                      src={image}
                      alt={`image-${id}`}
                      key={`image-${id}`}
                      loading='lazy'
                      className='cartoon-box'/>
                      <div className="image-label">
                          <p>Paint</p>
                      </div>
                  </div>
              )
            })}
            </div>

            <button className='button view-more-btn'>view more <FaArrowRight/></button>
          </div>
    </section>
  )
}
