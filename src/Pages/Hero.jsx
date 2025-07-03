import React from 'react'
import heroImage from '../Assets/image-hero-fortmyers.jpg'
import logo from '../Assets/logo/brushline-logo-white-letters.png'
import { motion } from 'framer-motion';
import { FaPhone } from 'react-icons/fa';

import '../Styling/Hero.css'

export const Hero = () => {

  return (
    <section className='hero-page' id='home'>
    <img src={heroImage} alt="man-standing-with-construction-belt" className='background-image' />
      <div className="hero-container">
          <div className='text-container'>
            <div className="title-container">
              <motion.h1
              className='heading'
              initial={{scale:0.5}}
              whileInView={{scale:1}}
              transition={{duration:1}}> Trusted <span>Painting Experts</span> </motion.h1>
              <motion.p
              initial={{opacity:0}}
              whileInView={{opacity:1}}
              transition={{duration:1}}> Providing residential & commercial painting service in Cape Coral, Fort Myers, Naples, Estero and Bonita Springs.</motion.p>
            </div>
              <div className="btn-group">
                <a href="#contact"><button tabIndex='-1' className='button'>GET FREE QUOTE</button></a>
                <div className='phoneButton'>
                  <a href="tel:2397773713" > <FaPhone/> (239)777-3713</a>
                </div>
              </div>
          </div>
      </div>
    </section>
  )
}
