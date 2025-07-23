import React from 'react'
import cape from '../Assets/cities/painter-cape-coral.jpg'
import fortMyers from '../Assets/cities/painter-in-fort-myers.jpg'
import bonita from '../Assets/cities/painter-bonita-springs.jpg'
import estero from '../Assets/cities/painter-in-estero.jpg'
import naples from '../Assets/cities/painter-in-naples.jpg'
import '../Styling/ServiceAreaSection.css'
import { Link } from 'react-router-dom'

export const ServiceAreaSection = () => {
    const cities = [
    {
        image: cape,
        title: 'Cape Coral',
        link: '/service-area/cape-coral-painter'
    },{
        image: fortMyers,
        title: 'Fort Myers',
        link: '/service-area/fort-myers-painter'
    },{
        image: estero,
        title: 'Estero',
        link: '/service-area/estero-painter'
    },{
        image: bonita,
        title: 'Bonita Springs',
        link: '/service-area/bonita-springs-painter'
    },{
        image: naples,
        title: 'Naples',
        link: '/service-area/naples-painter'
    }
];
  return (
    <div className='service-area-section-wrapper light-orange'>
        <section className='service-area-section card'>
            <div className="sub-heading">
                <h1><span>Cities</span> we serve</h1>
                <p>We proudly serve the following areas with our top-notch services.</p>
            </div>

            <div className="gallery-service-area">
            {cities.map((city, index) => (
            <Link to={city.link} key={index} className="card-gallery-link">
            <div className="card-gallery-item">
              <div className="image-container">
                <img src={city.image} alt=''/>
              </div>
              <div className="info">
                <h2>{city.title}</h2>
              </div>
            </div>
            </Link>
                ))}
            </div>

        </section>
    </div>
  )
}
