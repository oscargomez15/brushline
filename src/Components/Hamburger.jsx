import React, { useEffect, useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import { Link } from 'react-router-dom';

import logo from '../Assets/logo/brushline-logo-white-letters.png';
import { motion } from 'framer-motion';
import '../Styling/Navigation.css'

export const Hamburger = () => {
    const [isOpen, setOpen] = useState(false);
    const [serviceOpen, setServiceOpen] = useState(false);

    const handleClick = () => {
        setOpen(!isOpen);
        console.log('Open')
    }

    useEffect( () => {
        if(isOpen){
            document.body.classList.add('no-scroll')
        }else{
            document.body.classList.remove('no-scroll')
        }

        return () => {
            document.body.classList.remove('no-scroll')
        }
    },[isOpen])

  return (
    <div className='hamburger-menu'>
        <img src={logo} alt="brushline-logo" className='logo-hero-mb' />
        <motion.div
        className='menu-icon'
        whileTap={{scale:0.9}}
        transition={{duration:0.5}}
        onClick={handleClick}
        role='button'
        aria-label='menu'
        tabIndex="0"
        onKeyDown={(e) => {
            if(e.key === 'Enter' || e.key === ''){
                handleClick();
            }
        }}>
            <FaBars/>
        </motion.div>

        <div
        className={`exit-overlay ${isOpen ? 'hamburger-slide-in' : 'hamburger-slide-out'}`}
        onClick={() => setOpen(!isOpen)}></div>

        <nav
        className={`hamburger-content ${isOpen ? 'hamburger-slide-in' : 'hamburger-slide-out'}`}>
            <FaTimes
            tabIndex={isOpen ? '0' : '-1'}
            role='button'
            aria-label='close-menu'
            onKeyDown={(e) => {
                if(e.key === 'Enter' || e.key ===''){
                    handleClick();
                }
            }}
            className='exit-icon'
            onClick={handleClick}/>
            <header>
                <img src={logo} alt="brushline-logo" loading='lazy' />
            </header>
            <ul className='hamburger-links'>
                <li><a href="/" tabIndex={isOpen ? '0' : '-1'} onClick={() => {setOpen(false)}}> Home</a></li>
                <li className="dropdown-mb">
                    <div className="dropdown-label dropdown-toggle"
                        tabIndex={isOpen ? '0' : '-1'}
                        onClick={() => setServiceOpen(!serviceOpen)}>
                        <p>Services</p>
                        <IoIosArrowDown className={serviceOpen ? 'rotated' : ''}/>
                    </div>
                    <ul className={`dropdown-menu ${serviceOpen ? 'open' : ''}`}>
                    <li><Link to="/painting" onClick={() => setOpen(false)}>Painting</Link></li>
                    <li><Link to="/cleaning" onClick={() => setOpen(false)}>Cleaning</Link></li>
                    {/* <li><a href="" onClick={() => setOpen(false)}>Drywall</a></li>
                    <li><a href="" onClick={() => setOpen(false)}>Pressure Wash</a></li> */}
                    </ul>
                </li>
                <li><a href="/gallery" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Gallery</a></li>
                <li><a href="/#reviews" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Reviews</a></li>
                <li><a href="#contact" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Contact</a></li>
            </ul>
            <div
            className="cta"
            whileInView={{scale:[1,1.1,1]}}
            transition={{
                repeat:Infinity,
                repeatType:'loop',
                duration:2}}
            >
                <p
                tabIndex={isOpen ? '0':'-1'}
                href='tel:2397773713'
                className='cta-label'>Your <span>Free Estimate</span> is <br/>a Call Away</p>
                <button className='button'><a href="tel:2397773713" className='cta-text'> Call Now</a></button>

            </div>


        </nav>
    </div>
  )
}
