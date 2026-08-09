import React from 'react';
import '../Styling/Services.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { Droplets, PaintRoller, PanelsTopLeft, Sparkles } from 'lucide-react';

export const Services = () => {
  const servicesInfo = [
    {
      title: 'Interior & Exterior Painting',
      description:
        'Premium interior and exterior painting designed to refresh your space and protect your property.',
      Icon: PaintRoller,
      accent: 'painting',
      route: '/painting',
    },
    {
      title: 'Drywall Install & Repair',
      description:
        'Clean drywall repairs, patching, texture matching, and panel installation for a seamless finish.',
      Icon: PanelsTopLeft,
      accent: 'drywall',
      route: '/drywall',
    },
    {
      title: 'House Cleaning',
      description:
        'Detailed cleaning services for homes, rentals, and businesses that need a fresh, polished look.',
      Icon: Sparkles,
      accent: 'cleaning',
      route: '/cleaning',
    },
    {
      title: 'Pressure Washing',
      description:
        'Restore driveways, walls, patios, and exterior surfaces by removing dirt, grime, and stains.',
      Icon: Droplets,
      accent: 'washing',
      route: '/pressure-washing',
    },
  ];

  return (
    <section className="services-section" id="services">
      <div className="services-container">
        <motion.div
          className="services-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span>Our Services</span>
          <h2>Professional Services Built Around Your Property</h2>
        </motion.div>

        <div className="services-grid">
          {servicesInfo.map((service, id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: id * 0.12 }}
            >
              <Link to={service.route} className={`service-card-modern service-${service.accent}`}>
                <div className="service-icon-wrap" aria-hidden="true">
                  <span className="service-icon-glow" />
                  <service.Icon strokeWidth={1.8} />
                </div>

                <div className="service-card-content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>

                <div className="service-card-footer">
                  <span>Explore Service</span>
                  <div className="service-arrow">
                    <FaArrowRight />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
