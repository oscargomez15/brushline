import { useParams } from 'react-router-dom';
import { serviceAreaData } from '../data/serviceAreas';import { motion } from 'framer-motion';
import { FaPhone } from 'react-icons/fa';
import { Contact } from './Contact';
import { Reviews } from './Reviews';
import { PaintingCard } from '../Components/PaintingCard';
import { WhyUs } from '../Components/WhyUs';
import { Helmet } from 'react-helmet';

const ServiceArea = () => {
        const services = [
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/paint-interior.mp4",
          title: 'Interior Painting',
          description:' Our expert team delivers flawless walls, ceilings, trim and accent walls using premium low-VOC paints for a durable, beautiful finish.',
          items: [
            "Walls & Ceilings (rooms, hallways, stairwells)",
            "Trim, Baseboards & Crown Molding",
            "Doors & Door Frames",
            "Window Frames & Sills",
            "Cabinet & Built-in Refinishing",
            "Closets & Pantry Interiors",
            "Accent Walls & Color-Blocking",
            "Popcorn/Texture Removal & Repaint"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/exterior.mp4",
          title: 'Exterior Painting',
          description: 'Boost curb appeal with expert exterior painting. We use top of the line weather-resistant coatings for lasting protection and vibrant color.',
          items: [    "Siding (Vinyl, Wood, Fiber Cement, Stucco)",
            "Fascia, Soffits & Eaves",
            "Trim, Shutters & Window Casings",
            "Decks, Patios & Fences (Staining & Sealing)",
            "Garage Doors & Carports",
            "Porches & Railings",
            "Stucco & Brick Painting",
            "Pressure-Washing & Surface Prep"]
        },
      ];
  const { citySlug } = useParams();
  const cityData = serviceAreaData[citySlug];

  if (!cityData) return <div>City not found</div>;

  return (
    <div className="service-area-page">
    <Helmet>
        <title>Painter in {cityData.city} | Brushline Services | 5 Stars Rated</title>
    </Helmet>
    <section className='hero-page' id='home'>
    <img src={cityData.gallery} alt="man-standing-with-construction-belt" className='background-image' />
      <div className="hero-container">
          <div className='text-container'>
            <div className="title-container">
              <motion.h1
              className='heading'
              initial={{scale:0.5}}
              whileInView={{scale:1}}
              transition={{duration:1}}>{cityData.headline}</motion.h1>
              <motion.p
              initial={{opacity:0}}
              whileInView={{opacity:1}}
              transition={{duration:1}}> {cityData.description}</motion.p>
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
      {/* <div className="gallery">
        {cityData.gallery.map((img, i) => (
          <img src={img} alt={`${cityData.city} project ${i + 1}`} key={i} />
        ))}
      </div> */}
    
        <div className="list-container-wrapper">
            <motion.section className="list-container card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.2 }}>

                <div className="sub-heading">
                    <h1><span>Painting Services</span> we offer</h1>
                    <p>Whether you're refreshing your home or updating a commercial property, we’ve got every surface covered.</p>
                </div>
                <div className="painting-list">
                    {services.map((service, index) => (
                        <PaintingCard key={index} {...service}/>
                    ))}
                </div>
            </motion.section>
        </div>
        <div className="cta-wrapper">
            <motion.section className="card cta-card"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.5 }}>
                <h1 className='section-subtitle'>See What It’ll Cost – Get Free Estimate</h1>
                        <div className="cta-button-group">
                            <a href="tel:2397773713"><button className="button"> CALL NOW </button></a>
                            <p>OR</p>
                            <a href="#contact"><button className="button"> CONTACT US </button></a>
                        </div>

            </motion.section>
        </div>
    {/* <Services/> */}
    <Reviews/>
    <WhyUs/>
    <Contact/>
    </div>
  );
};

export default ServiceArea;