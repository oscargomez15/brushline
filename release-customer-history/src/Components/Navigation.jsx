import React, { useEffect, useState } from 'react'
import logo from '../Assets/logo/brushline-logo-white-letters.webp'
import '../Styling/Navigation.css'
import { Link, useLocation } from 'react-router-dom';
import { IoIosArrowDown } from "react-icons/io";
import { Hamburger } from './Hamburger';
import { FaPhoneAlt } from 'react-icons/fa';

export const Navigation = () => {
  const [isSticky, setSticky] = useState(false);
  const location = useLocation();
  const isPaintingPage = location.pathname !== '/';

  // useEffect(() => {
  //   // Scroll to top whenever the route changes
  //   //but this also triggers when the user clicks on elements in the same page.
  //   window.scrollTo(0, 0);
  // }, [location]); 


  useEffect(()=> {
    const handleScroll = () => {
      if(window.scrollY > 250){
        setSticky(true)
      }else{
        setSticky(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return (
    <nav aria-label="Primary navigation" className={`modern-nav ${isSticky ? 'sticky-nav' : ''} ${isPaintingPage ? 'coloredBackground' : ''}`}>
  <div className="nav-wrapper-mb">
    <div className="navigation-mob">
      <Hamburger />
    </div>
  </div>

  <div className="modern-nav-wrapper">
    <header>
      <Link to="/" aria-label="Brushline Services home">
        <img src={logo} fetchPriority="high" alt="Brushline Services Logo" />
      </Link>
    </header>

    <ul className="modern-nav-links">
      <li><Link to="/">Home</Link></li>

      <li className="nav-dropdown-parent">
        <button type="button" className="nav-services-container" aria-haspopup="true">
          Services <IoIosArrowDown size="18" />
        </button>

        <ul className="dropdown">
          <li><Link to="/painting">Painting</Link></li>
          <li><Link to="/drywall">Drywall</Link></li>
          <li><Link to="/cleaning">Cleaning</Link></li>
        </ul>
      </li>

      <li className="nav-dropdown-parent">
        <button type="button" className="nav-services-container" aria-haspopup="true">
          Service Area <IoIosArrowDown size="18" />
        </button>

        <ul className="dropdown">
          <li><Link to="/service-area/cape-coral-painter">Cape Coral</Link></li>
          <li><Link to="/service-area/fort-myers-painter">Fort Myers</Link></li>
          <li><Link to="/service-area/estero-painter">Estero</Link></li>
          <li><Link to="/service-area/bonita-springs-painter">Bonita Springs</Link></li>
          <li><Link to="/service-area/naples-painter">Naples</Link></li>
        </ul>
      </li>

      <li><a href="/#gallery">Gallery</a></li>
      <li><a href="/#reviews">Reviews</a></li>
    </ul>

    <div className="modern-nav-actions">
      <a
        href="tel:2397773713"
        className="nav-phone"
        onClick={() => {
          if (window.gtag) {
            window.gtag('event', 'conversion', {
              send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq',
            });
          }
        }}
      >
        <FaPhoneAlt /> (239) 777-3713
      </a>

      <a href="/#contact" className="nav-quote-btn">
        Contact Us
      </a>
    </div>
  </div>
</nav>
  )
}
