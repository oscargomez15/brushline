import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCheck,
  FaPhone,
  FaStar,
  FaPaintRoller,
  FaHome,
} from 'react-icons/fa';

import GoogleLogo from '../Assets/google-logo.webp';
import '../Styling/Hero.css';

export const Hero = () => {
  return (
    <section className='modern-hero' id='home'>
      {/* Background */}
      <div className='hero-bg-overlay'></div>

      <picture>
        <source
          srcSet='/images/exterior-painting-fort-myers-brushlie.webp'
          type='image/webp'
        />

        <img
          src='/images/exterior-painting-fort-myers-brushlie-resized.webp'
          alt='Exterior painting in Southwest Florida'
          className='hero-bg-image'
          fetchPriority='high'
          loading='eager'
        />
      </picture>

      {/* Main Content */}
      <div className='hero-content-wrapper'>
        <div className='hero-left'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className='hero-badge'
          >
            <FaStar />
            Trusted Painting Company in Southwest Florida
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Premium Painting Solutions For Homes & Businesses
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Brushline Services helps homeowners and businesses across Cape Coral,
            Fort Myers, Naples, Estero, and Bonita Springs transform their
            properties with clean finishes, expert craftsmanship, and dependable
            service.
          </motion.p>

          {/* CTA Buttons */}
<motion.div
            className='hero-actions'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
          >
            <a href='#contact' className='primary-btn'>
              Get Free Estimate
              <FaArrowRight />
            </a>

            <a
              href='tel:2397773713'
              className='secondary-btn'
              onClick={() => {
                if (window.gtag) {
                  window.gtag('event', 'conversion', {
                    send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq',
                  });
                }
              }}
            >
              <FaPhone />
              (239) 777-3713
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className='hero-stats'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className='stat-card'>
              <h3>10+</h3>
              <p>Years Experience</p>
            </div>

            <div className='stat-card'>
              <h3>5★</h3>
              <p>Rated Service</p>
            </div>

            <div className='stat-card'>
              <h3>50+</h3>
              <p>Homes Transformed</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side Cards */}
        <motion.div
          className='hero-right'
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >

        <div className="service-card hero-contact-card">
          <h3>Request Your Free Estimate</h3>
          <p>Tell us a little about your project and we’ll reach out shortly.</p>

          <form className="hero-contact-form">
            <input type="text" name="name" placeholder="Name" required />

            <input type="email" name="email" placeholder="Email" required />

            <input type="tel" name="phone" placeholder="Phone number" required />

            <select name="service" required defaultValue="">
              <option value="" disabled>
                Service needed
              </option>
              <option value="painting">Painting</option>
              <option value="drywall">Drywall</option>
              <option value="handyman">Handyman</option>
              <option value="cleaning">Cleaning</option>
            </select>

            <textarea
              name="message"
              placeholder="Message (optional)"
              rows="4"
            ></textarea>

            <button type="submit">
              Send Request <FaArrowRight />
            </button>
          </form>
        </div>

          <div className='service-card review-card'>
            <img src={GoogleLogo} alt='Google logo' />

            <div>
              <div className='stars'>
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
              </div>

              <p>Highly rated by homeowners across SWFL</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};