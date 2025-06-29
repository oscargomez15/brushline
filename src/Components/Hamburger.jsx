import React, { useEffect, useState } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";

import logo from '../Assets/logo/brushline-logo-white-letters.png';
import { motion } from 'framer-motion';
import '../Styling/Navigation.css'

export const Hamburger = () => {
    const [isOpen, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
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

    useEffect(()=> {
        const handleScroll = () => {
            const changePoint = 800;
            const scrollPosition = window.scrollY;
            setScrolled(scrollPosition > changePoint);
        };


        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll',handleScroll);
        }
    },[]);

  return (
    <div className='hamburger-menu'>
        <motion.div
        className={`menu-icon ${scrolled ? 'scrolled' : 'not-scrolled'}`}
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
            <hr />
            <ul>
                <li><a href="/" tabIndex={isOpen ? '0' : '-1'} onClick={() => {setOpen(false)}}>Home</a></li>
                <li className="dropdown-mb">
                    <p
                    className="dropdown-toggle"
                    tabIndex={isOpen ? '0' : '-1'}
                    onClick={() => setServiceOpen(!serviceOpen)}
                    >
                    Services <IoIosArrowDown className={serviceOpen ? 'rotated' : ''}/>
                    </p>
                    <ul className={`dropdown-menu ${serviceOpen ? 'open' : ''}`}>
                    <li><a href="/painting" onClick={() => setOpen(false)}>Painting</a></li>
                    <li><a href="/cleaning" onClick={() => setOpen(false)}>Cleaning</a></li>
                    <li><a href="" onClick={() => setOpen(false)}>Drywall</a></li>
                    <li><a href="" onClick={() => setOpen(false)}>Pressure Wash</a></li>
                    </ul>
                </li>
                <li><a href="/gallery" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Gallery</a></li>
                <li><a href="/#reviews" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Reviews</a></li>
                <li><a href="#contact" tabIndex={isOpen ? '0' : '-1'} onClick={()=> {setOpen(false)}}>Contact</a></li>
            </ul>

            <hr />

            <div
            className="cta"
            whileInView={{scale:[1,1.1,1]}}
            transition={{
                repeat:Infinity,
                repeatType:'loop',
                duration:2}}
            >
                <a
                tabIndex={isOpen ? '0':'-1'}
                href='tel:2397773713'
                className='cta-text'>Call now <br/>(239)777-3713</a>
            </div>
        </nav>
    </div>
  )
}
