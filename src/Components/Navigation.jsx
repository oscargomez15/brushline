import React, { useEffect, useState } from 'react'
import logo from '../Assets/logo/brushline-logo-white-letters.png'
import '../Styling/Navigation.css'
import { FaPhone } from 'react-icons/fa';
import { useLocation } from 'react-router';
import { IoIosArrowDown } from "react-icons/io";
import { MdOutlineCleaningServices, MdOutlineFormatPaint } from 'react-icons/md';
import { Hamburger } from './Hamburger';

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
                  <li> <a href="/painting"> <MdOutlineFormatPaint/> Int/Ext Painting </a> </li>
                  {/* <li> <a href="/"> <MdOutlineHomeRepairService/> Drywall Install/Repair </a> </li>                 */}
                  <li> <a href="/cleaning"> <MdOutlineCleaningServices/> Residential Cleaning  </a></li>
                  {/* <li> <a href="/"> <MdOutlineWaterDrop/> Pressure Wash</a>  </li> */}

                </ul>
              </li>

              <li><a href="/#gallery">GALLERY</a></li>
              <li><a href="/#reviews">REVIEWS</a></li>
          </ul>

          <ul>
            <li className='no-underline'>
              <a href="#contact"><button className='button'>CONTACT</button></a>
            </li>
            <li className='no-underline'><a href="tel:7867507518"> FREE QUOTE <br/><FaPhone/> 239-777-3713</a></li>
          </ul>
        </div>
    </nav>
  )
}
