import React from 'react'
import { IoIosHammer, IoLogoGoogle, IoMdMail } from 'react-icons/io'
import { AiOutlineFacebook } from 'react-icons/ai'
import '../Styling/Footer.css'
import mascotLogo from '../Assets/logo/brushline-logo-white-letters.png'
import { FaInstagram, FaPhone, FaTiktok } from 'react-icons/fa'
import {PiStarFourFill} from 'react-icons/pi'

export const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-logo footer-section">
          <img src={mascotLogo} alt="logo" loading='lazy' height="250px"/>
        </div>
        {/* Footer to be displayed only on screens less than 1380px*/}

        <div className='footer-info-mb'>
          <div className="site-map footer-section">
            <ul className='footer-list'>
              <h2>Sitemap</h2>
              <li> <a href="/#home">Home</a></li>
              <li><a href="/#gallery">Gallery</a></li>
              <li><a href="/#services">Services</a></li>
              <li><a href="/#reviews">Reviews</a></li>
              <li><a href="#contact">Contact us</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <ul className='footer-list'>
              <h2 className='phone-contact'> Contact </h2>
              <li className='footer-item-mb'><FaPhone/> <a href='tel:+12397773713'>(239)777-3713</a></li>
              <li className='footer-item-mb'> <IoMdMail/> <a href="contact@brushlineservices.com">contact@brushlineservices.com</a>  </li>
            </ul>
          </div>

          <div className="footer-section">
            <ul className='footer-list'>
              <p><span>Business Hours</span></p>
              <li className='no-underline no-pointer'>8:00 am - 6:00 pm</li>
            </ul>
          </div>

          <div className="footer-section">
            <ul className='service-area-section'>
            <p><span>Service Areas</span></p>
              <li>
                <PiStarFourFill className='signature-divider'/><p>Fort Myers</p>
              </li>
              <li>
                  <PiStarFourFill className='signature-divider'/><p>Cape Coral</p>
              </li>
              <li>
                  <PiStarFourFill className='signature-divider'/><p>Estero</p>
              </li>
              <li>
                  <PiStarFourFill className='signature-divider'/><p>Naples</p> 
              </li>
              <li>
                  <PiStarFourFill className='signature-divider'/><p>Bonita Springs</p>
              </li>
            </ul>
          </div>
        </div>
        {/* Footer to be displayed only on screens greater than 1380px*/}
          <div className="site-map footer-section footer-sitemap-desktop">
            <ul className='footer-list'>
              <p><span>Sitemap</span></p>
              <li><a href="/">Home</a></li>
              <li><a href="/#gallery">Gallery</a></li>
              <li><a href="/#services">Services</a></li>
              <li><a href="/#reviews">Reviews</a></li>
              <li><a href="#contact">Contact us</a></li>
            </ul>
          </div>

          <div className="footer-section footer-sitemap-desktop">
            <ul className='footer-list'>
              <p><span>Business Hours</span></p>
              <li className='no-underline no-pointer'>8:00 am - 6:00 pm</li>
              <p><span>Service Areas</span></p>
              <li className='no-underline no-pointer service-area'>
                <p>Fort Myers<PiStarFourFill className='signature-divider'/>
                  Cape Coral <PiStarFourFill className='signature-divider'/>
                  Estero <PiStarFourFill className='signature-divider'/>
                  Naples <PiStarFourFill className='signature-divider'/>
                  Bonita Springs
                </p>
              </li>
            </ul>
          </div>


          <div className="socials footer-section footer-socials-desktop">
            <div className='footer-list'>
              <p><span>Contact</span></p>
              <div className="contact-container">
                <FaPhone/>
                <a href='tel:+12397773713'>(239)777-3713</a> <br/>
              </div>
              <div className="contact-container">
                <IoMdMail/>
                <a href="email:contact@brushlineservices.com">contact@brushlineservices.com</a>
              </div>

              <div className="socials-list">
                <a href="https://www.facebook.com/GIALServices/" aria-label='visit our facebook page' target='_blank' rel='noreferrer'> <AiOutlineFacebook size="md"/> </a>
                <a href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9" aria-label='visit our google page' target='_blank' rel='noreferrer'> <IoLogoGoogle size="md"/></a>
                <a href="https://www.tiktok.com/@brushlinepainting" aria-label='vist our tik tok page' target='_blank' rel='noreferrer'><FaTiktok size="md"/></a>
              </div>
            </div>
          </div>

        <div className="footer-icon">
          <IoIosHammer size="lg"/>
        </div>
      </div>

      <div className='socials-wrapper'>
        <a href="https://www.facebook.com/GIALServices/" aria-label='visit our facebook page' target='_blank' rel='noreferrer'> <AiOutlineFacebook size="md"/> </a>
        <a href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9" aria-label='visit our google page' target='_blank' rel='noreferrer'> <IoLogoGoogle size="md"/></a>
        <a href="https://www.tiktok.com/@brushlinepainting" aria-label='vist our tik tok page' target='_blank' rel='noreferrer'><FaTiktok size="md"/></a>
        <a href="https://www.instagram.com/brushlinefl/" aria-label='vist our instagram page' target='_blank' rel='noreferrer'><FaInstagram size="md"/></a>
      </div>

      <p className='copyright'> © Copyright 2025. Brushline LLC. All Rights Reserved.</p>
    </footer>
  )
}
