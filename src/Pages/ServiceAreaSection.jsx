import React from 'react';
import cape from '../Assets/cities/painter-cape-coral.jpg';
import fortMyers from '../Assets/cities/painter-in-fort-myers.jpg';
import bonita from '../Assets/cities/painter-bonita-springs.jpg';
import estero from '../Assets/cities/painter-in-estero.jpg';
import naples from '../Assets/cities/painter-in-naples.jpg';
import '../Styling/ServiceAreaSection.css';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

export const ServiceAreaSection = () => {
  const cities = [
    { image: cape, title: 'Cape Coral', link: '/service-area/cape-coral-painter' },
    { image: fortMyers, title: 'Fort Myers', link: '/service-area/fort-myers-painter' },
    { image: estero, title: 'Estero', link: '/service-area/estero-painter' },
    { image: bonita, title: 'Bonita Springs', link: '/service-area/bonita-springs-painter' },
    { image: naples, title: 'Naples', link: '/service-area/naples-painter' },
  ];

  return (
    <section className="service-area-modern" id="service-area">
      <div className="service-area-container">
        <div className="service-area-header">
          <span>Service Areas</span>
          <h2>Serving Southwest Florida With Reliable Local Service</h2>
          <p>
            Brushline Services proudly serves homeowners and businesses across
            Cape Coral, Fort Myers, Estero, Bonita Springs, Naples, and nearby areas.
          </p>
        </div>

        <div className="city-grid">
          {cities.map((city, index) => (
            <Link to={city.link} key={index} className="city-card">
              <img src={city.image} alt={`${city.title} painting service area`} />

              <div className="city-overlay"></div>

              <div className="city-content">

                <h3>{city.title}</h3>

                <div className="city-link">
                  View Area <FaArrowRight />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};