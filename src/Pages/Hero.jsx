import heroImage from '../Assets/exterior-painting-fort-myers-brushlie.webp'
import { motion } from 'framer-motion';
import { FaCheck, FaPhone, FaStar } from 'react-icons/fa';
import GoogleLogo from '../Assets/google-logo.webp'
import '../Styling/Hero.css'

export const Hero = () => {

  return (
    <section className='hero-page' id='home'>
    <div className="hero-overlay">    
      <div className="hero-benefits">
          <div className="benefit-item">
              <FaCheck/>
              <p> No-cost estimates.</p>
          </div>
          <div className="benefit-item">
              <FaCheck/>
              <p>10+ years experience</p>
          </div>
          <div className="benefit-item">
              <FaCheck/>
              <p>5-star rated</p>
          </div>
          <div className="testimonial-review">
            <div className="testimonial-google">
              <img src={GoogleLogo} alt="google logo" />
            </div>
            <div className="testimonial-text">
              <FaStar/><FaStar/><FaStar/><FaStar/><FaStar/>
              <p>Over 20+ Homes Transformed</p>
            </div>
          </div>
      </div> 

    </div>
    <img src={heroImage} alt="exterior-paint-fort-myers" fetchPriority='high' className='background-image' />
 
      <div className="hero-container">
          <div className='text-container'>
            <div className="title-container">
              <motion.h1
              className='heading'
              initial={{scale:0.5}}
              whileInView={{scale:1}}
              transition={{duration:1}}> Trusted Painting Experts </motion.h1>
              <motion.p
              initial={{opacity:0}}
              whileInView={{opacity:1}}
              transition={{duration:1}}> We are more than painters — we’re proud to serve Cape Coral, Fort Myers, Naples, Estero, and Bonita Springs with honesty and excellence.  Let us show you the difference, request a free quote today!  </motion.p>
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
