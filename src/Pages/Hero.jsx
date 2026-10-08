import { useState } from 'react';
import { trackPixelLead } from '../utils/openaiPixel';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaPhone,
  FaStar,
} from 'react-icons/fa';

import '../Styling/Hero.css';
import '../Styling/PaintingFunnel.css';
import '../Styling/ServiceHero.css';

export const Hero = () => {
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    setSubmitting(true);
    setContactStatus({ type: '', message: '' });

    try {
      const response = await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to send request.');
      trackPixelLead();

      formElement.reset();
      setContactStatus({
        type: 'success',
        message: 'Thanks! Your request was sent. Our team will contact you within 24 hours to discuss your project and next steps.',
      });
    } catch (error) {
      setContactStatus({
        type: 'error',
        message: error.message || 'We could not send your request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className='modern-hero' id='home'>
      {/* Background */}
      <div className='hero-bg-overlay'></div>

      <picture>
        <source
          srcSet='/images/brushline-owner-portrait.jpg'
          type='image/jpeg'
        />

        <img
          src='/images/brushline-owner-portrait.jpg'
          alt='Brushline Services owner standing in front of the business truck'
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
            <FaStar aria-hidden="true" /> Highly rated by homeowners across SWFL
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
            <a href='#hero-estimate' className='primary-btn'>
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
              <h3>5★</h3>
              <p>Rated Service</p>
            </div>

            <div className='stat-card'>
              <h3>70+</h3>
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

        <div className="service-card hero-contact-card" id="hero-estimate">
          <h3>Request Your Free Estimate</h3>
          <p>Tell us about your project and we’ll contact you within 24 hours to discuss the next steps.</p>

          <form className="hero-contact-form" onSubmit={handleContactSubmit}>
            <input type="text" name="company" tabIndex="-1" autoComplete="off" aria-hidden="true" style={{position:'absolute', left:'-10000px'}} />
            <input type="text" name="name" placeholder="Name" required />

            <input type="email" name="email" placeholder="Email" required />

            <input type="tel" name="phone" placeholder="Phone number" required />

            <select name="service" required defaultValue="">
              <option value="" disabled>
                Service needed
              </option>
              <option value="painting">Painting</option>
              <option value="drywall">Drywall</option>
              <option value="handyman">Multiple Services</option>
              <option value="cleaning">Cleaning</option>
            </select>

            <textarea
              name="message"
              placeholder="Message (optional)"
              rows="4"
            ></textarea>

            {contactStatus.message && (
              <div
                role={contactStatus.type === 'error' ? 'alert' : 'status'}
                style={{
                  color: contactStatus.type === 'error' ? '#fecaca' : '#bbf7d0',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {contactStatus.message}
              </div>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Request'} {!submitting && <FaArrowRight />}
            </button>
          </form>
        </div>
        <div className="painting-or-divider"><span>OR</span></div>
        <div className="painting-assistant-option">
          <h2>Plan your free estimate with our AI assistant</h2>
          <a href="/assistant">Talk to Our AI Assistant <span aria-hidden="true">→</span></a>
          <small>Choose an available time and confirm your details.</small>
        </div>

          
        </motion.div>
      </div>
    </section>
  );
};
