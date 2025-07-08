import React from 'react'
import '../Styling/Services.css'
import { motion } from 'framer-motion'
import roller from '../Assets/icons/roller.png'
import cleaning from '../Assets/icons/cleaning.png'
import drywall from '../Assets/icons/drywall.png'
import pwgun from '../Assets/icons/pressure-wash.jpg'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'

export const Services = () => {
  const servicesInfo = [{
    title: <h3>Interior & Exterior Painting</h3>,
    description:"Refreshing living spaces with vibrant colors indoors and enhancing curb appeal.",
    icon:<img src={roller} alt="roller-icon" className='service-icon'/>,
    route: "/painting"
  },{
    title: <h3>Drywall Install & Repair</h3>,
    description:"We specialize in repairing holes, dents, imperfections and installing drywall panels.",
    icon: <img src={drywall} alt="drywall-icon" className='service-icon'/>,
    route: "/drywall"
  },{
    title: <h3>House Cleaning</h3>,
    description: "From deep cleaning to regular maintenance, we make your space shine!",
    icon: <img src={cleaning} alt="cleaning-icon" className='service-icon'/>,
    route: "/cleaning"
  },{
    title:<h3>Pressure Wash</h3>,
    description: "Clean and restore your property's exterior, removing dirt, grime, and stains.",
    icon:<img src={pwgun} alt="pressure-wash-icon" className='service-icon'/>
}]

  return (
    <section className='service-page' id='services'>
        <div className="services-content">
            <div className="sub-heading">
                <h1><span>Services</span> we offer</h1>
                <p> Discover a range of expert services tailored to meet your needs, delivered with precision and care.</p>
            </div>

            <div className="services-list">
            {servicesInfo.map ((service,id) => {
              return (
                <motion.div
                className={`service-${id}`}
                key={id}
                initial={{scale:1,x:-20, opacity:0}}
                whileHover={{scale:1.1, cursor:"pointer"}}
                whileInView={{x:0,opacity:1}}
                transition={{
                  x:{duration:id*0.5}
                }}>
                  <Link to={service.route} className='service-item cartoon-box'>
                  {service.icon}
                  <div className="service-text">
                    {service.title}
                    <p>{service.description}</p>
                  </div>
                    <motion.div className="explore-container">
                      <div className="explore-button button">
                      Explore <FaArrowRight/>
                      </div>
                    </motion.div>
                   </Link>
                </motion.div>
              )
            })}
            </div>
        </div>
    </section>
  )
}
