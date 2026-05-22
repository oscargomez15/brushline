import React from 'react';
import '../Styling/Footer.css';
import mascotLogo from '../Assets/logo/brushline-logo-white-letters.webp';
import { Link } from 'react-router-dom';
import { FaInstagram, FaPhone, FaTiktok, FaArrowRight } from 'react-icons/fa';
import { AiOutlineFacebook } from 'react-icons/ai';
import { IoLogoGoogle, IoMdMail } from 'react-icons/io';

export const Footer = () => {
  return (
    <footer className="footer-modern">
      <div className="footer-container">
        <div className="footer-brand">
          <img src={mascotLogo} alt="Brushline Services logo" loading="lazy" />

          <p>
            Premium painting, drywall, handyman, and cleaning services for
            homeowners and businesses across Southwest Florida.
          </p>

          <a href="/#contact" className="footer-cta">
            Get Free Estimate <FaArrowRight />
          </a>
        </div>

        <div className="footer-column">
          <h3>Sitemap</h3>
          <a href="/#home">Home</a>
          <a href="/#services">Services</a>
          <a href="/#gallery">Gallery</a>
          <a href="/#reviews">Reviews</a>
          <a href="/#contact">Contact</a>
        </div>

        <div className="footer-column">
          <h3>Service Areas</h3>
          <Link to="/service-area/fort-myers-painter">Fort Myers</Link>
          <Link to="/service-area/cape-coral-painter">Cape Coral</Link>
          <Link to="/service-area/estero-painter">Estero</Link>
          <Link to="/service-area/naples-painter">Naples</Link>
          <Link to="/service-area/bonita-springs-painter">Bonita Springs</Link>
        </div>

        <div className="footer-column footer-contact">
          <h3>Contact</h3>

          <a
            href="tel:+12397773713"
            onClick={() => {
              if (window.gtag) {
                window.gtag('event', 'conversion', {
                  send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq',
                });
              }
            }}
          >
            <FaPhone /> (239) 777-3713
          </a>

          <a href="mailto:contact@brushlineservices.com">
            <IoMdMail /> contact@brushlineservices.com
          </a>

          <div className="footer-hours">
            <h3>Business Hours</h3>
            <p>8:00 AM - 6:00 PM</p>
          </div>

          <div className="footer-socials">
            <a href="https://www.facebook.com/BrushlineServices/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <AiOutlineFacebook />
            </a>
            <a href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9" target="_blank" rel="noreferrer" aria-label="Google">
              <IoLogoGoogle />
            </a>
            <a href="https://www.tiktok.com/@brushlinepainting" target="_blank" rel="noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
            <a href="https://www.instagram.com/brushlinefl/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© Copyright 2025. Brushline LLC. All Rights Reserved.</p>
      </div>
    </footer>
  );
};