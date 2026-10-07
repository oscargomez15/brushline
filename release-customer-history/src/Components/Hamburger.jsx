import React, { useEffect, useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Link } from 'react-router-dom';
import { AiOutlineFacebook} from 'react-icons/ai';
import { FaTiktok, FaInstagram } from 'react-icons/fa';
import { IoLogoGoogle } from 'react-icons/io';
import logo from '../Assets/logo/brushline-logo-white-letters.webp';
import { motion } from 'framer-motion';
import '../Styling/Navigation.css'

export const Hamburger = () => {
    const [isOpen, setOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);

    const handleClick = () => {
        setOpen(!isOpen);
        console.log('Open')
    }

    useEffect( () => {
        if(isOpen){
            document.body.classList.add('no-scroll')
        }else{
            document.body.classList.remove('no-scroll')
            setOpenDropdown(null);
        }

        return () => {
            document.body.classList.remove('no-scroll')
        }
    },[isOpen])

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, []);

  return (
    <div className='hamburger-menu'>
        <img src={logo} alt="brushline-logo" fetchPriority='high' className='logo-hero-mb' />
        <motion.button
        type="button"
        className='menu-icon'
        whileTap={{scale:0.9}}
        transition={{duration:0.5}}
        onClick={handleClick}
        aria-label='Open navigation menu'
        aria-expanded={isOpen}
        aria-controls="mobile-navigation">
            <FaBars/>
        </motion.button>

        <div
        aria-hidden="true"
        className={`exit-overlay ${isOpen ? 'hamburger-slide-in' : 'hamburger-slide-out'}`}
        onClick={() => setOpen(false)}></div>

        <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={`hamburger-content ${isOpen ? 'hamburger-slide-in' : 'hamburger-slide-out'}`}>
            <button type="button" tabIndex={isOpen ? 0 : -1} aria-label="Close navigation menu"
                className='exit-icon' onClick={handleClick}><FaTimes /></button>
            <header className="mobile-nav-header">

                <img
                src={logo}
                alt="Brushline Services"
                loading="lazy"
                className="mobile-nav-logo"
                />

            </header>
            <ul className='hamburger-links'>
                <li><a href="/" tabIndex={isOpen ? '0' : '-1'} onClick={() => {setOpen(false)}}> Home</a></li>
                <li className="dropdown-mb">
                    <button type="button" className="dropdown-label dropdown-toggle"
                        tabIndex={isOpen ? '0' : '-1'}
                        aria-expanded={openDropdown === 'services'}
                        onClick={() =>
                        setOpenDropdown(openDropdown === 'services' ? null : 'services')}>
                        <p>Services</p>
                        <IoIosArrowDown className={openDropdown === 'services' ? 'rotated' : ''}/>
                    </button>
                    <ul className={`dropdown-menu ${openDropdown === 'services' ? 'open' : ''}`}>
                    <li><Link to="/painting" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Painting</Link></li>
                    <li><Link to="/drywall" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Drywall</Link></li>
                    <li><Link to="/cleaning" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Cleaning</Link></li>
                    {/* <li><a href="" onClick={() => setOpen(false)}>Pressure Wash</a></li> */}
                    </ul>
                </li>
                <li className="dropdown-mb">
                    <button type="button" className="dropdown-label dropdown-toggle"
                        tabIndex={isOpen ? '0' : '-1'}
                        aria-expanded={openDropdown === 'serviceArea'}
                        onClick={() => 
                        setOpenDropdown(openDropdown === 'serviceArea' ? null : 'serviceArea')}>
                        <p>Service Area</p>
                        <IoIosArrowDown className={openDropdown === 'serviceArea' ? 'rotated' : ''}/>
                    </button>
                    <ul className={`dropdown-menu ${openDropdown === 'serviceArea' ? 'open' : ''}`}>
                    <li><Link to="/service-area/cape-coral-painter" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Cape Coral</Link></li>
                    <li><Link to="/service-area/fort-myers-painter" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Fort Myers</Link></li>
                    <li><Link to="/service-area/estero-painter" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Estero</Link></li>
                    <li><Link to="/service-area/bonita-springs-painter" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Bonita Springs</Link></li>
                    <li><Link to="/service-area/naples-painter" onClick={() => {setOpen(false); setOpenDropdown(null)}}>Naples</Link></li>

                    {/* <li><a href="" onClick={() => setOpen(false)}>Pressure Wash</a></li> */}
                    </ul>
                </li>
                <li><a href="/gallery" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Gallery</a></li>
                <li><a href="/#reviews" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Reviews</a></li>
                <li><a href="#contact" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Contact</a></li>
            </ul>
            <motion.div
            className="cta"
            whileInView={{scale:[1,1.1,1]}}
            transition={{
                repeat:Infinity,
                repeatType:'loop',
                duration:2}}
            >
                <p
                tabIndex={isOpen ? '0':'-1'}
                className='cta-label'
                >Your <span>Free Estimate</span> is <br/>a Call Away</p>
                <a href="tel:2397773713" className='button nav-cta cta-text' onClick={() =>{
                            if (window.gtag) {
                            window.gtag('event', 'conversion', {
                                send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq'
                            });
                            }}}> Call Now</a>

            </motion.div>
            <div className='socials-hamburger'>
                <a href="https://www.facebook.com/BrushlineServices/" aria-label='visit our facebook page' target='_blank' rel='noreferrer'> <AiOutlineFacebook size="md"/> </a>
                <a href="https://maps.app.goo.gl/nScSNDEyUSUgrR8q9" aria-label='visit our google page' target='_blank' rel='noreferrer'> <IoLogoGoogle size="md"/></a>
                <a href="https://www.tiktok.com/@brushlinepainting" aria-label='vist our tik tok page' target='_blank' rel='noreferrer'><FaTiktok size="md"/></a>
                <a href="https://www.instagram.com/brushlinefl/" aria-label='vist our instagram page' target='_blank' rel='noreferrer'><FaInstagram size="md"/></a>
            </div>
        </nav>
    </div>
  )
}
