import React, { useEffect, useState } from 'react'
import logo from '../Assets/logo/brushline-logo-white-letters.png'
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
    window.addEventListener('scroll', handleScroll)
  })
  return (
    <nav className={`${isSticky ? 'sticky-nav' : ''} ${isPaintingPage ? 'coloredBackground' : ''} nav-desktop`}>
        <div className="nav-wrapper-mb">
          <div className="navigation-mob">
            <Hamburger/>
          </div>
        </div>
        
        <div className="nav-wrapper">
          <header>
              <img src={logo} alt="gial-logo" />
          </header>

          <ul>
              <li><a href="/">HOME</a></li>
              <li>
                <a href="#services" className='services-container'>SERVICES <IoIosArrowDown size="20"/></a>
                <ul className='dropdown'>
                  <li> <Link to="/painting">Painting </Link> </li>
                  <li> <Link to="/drywall"> Drywall </Link> </li>
                  <li> <Link to="/cleaning"> Cleaning  </Link></li>
                  {/* <li> <a href="/"> <MdOutlineWaterDrop/> Pressure Wash</a>  </li> */}

                </ul>
              </li>

              <li>
                <a href="#services" className='services-container'>SERVICE AREA <IoIosArrowDown size="20"/></a>
                <ul className='dropdown'>
                  <li> <Link to="/service-area/cape-coral-painter">Cape Coral</Link></li>
                  <li> <Link to="/service-area/fort-myers-painter">Fort Myers</Link> </li>
                  <li> <Link to="/service-area/estero-painter">Estero</Link> </li>
                  <li> <Link to="/service-area/bonita-springs-painter">Bonita Springs</Link></li>
                  <li> <Link to="/service-area/naples-painter">Naples</Link></li>

                  {/* <li> <a href="/"> <MdOutlineWaterDrop/> Pressure Wash</a>  </li> */}

                </ul>
              </li>

              <li><a href="/#gallery">GALLERY</a></li>
              <li><a href="/#reviews">REVIEWS</a></li>
          </ul>

          <ul>
            <li className='no-underline nav-contact'>
              <a href="tel:7867507518"> <FaPhoneAlt/> (239) 777-3713</a>
              <a href="#contact"><button className='button'>CONTACT US</button></a>
            </li>
          </ul>
        </div>
    </nav>
  )
}
