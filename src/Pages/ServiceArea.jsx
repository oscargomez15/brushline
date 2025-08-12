import { useParams } from 'react-router-dom';
import { serviceAreaData } from '../data/serviceAreas';import { motion } from 'framer-motion';
import { FaCheck, FaPhone, FaStar } from 'react-icons/fa';
import { Contact } from './Contact';
import { Reviews } from './Reviews';
import { PaintingCard } from '../Components/PaintingCard';
import { WhyUs } from '../Components/WhyUs';
import { Helmet } from 'react-helmet';
import { SignatureDivider } from '../Components/SignatureDivider';
import GoogleLogo from '../Assets/google-logo.webp';

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
      <title>Interior and Exterior Painter in {cityData.city} | Brushline Services | 5 Stars Rated</title>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "PaintingService",
        "name": "Brushline Services",
        "url": `https://www.brushlineservices.com/service-area/${citySlug}`,
        "image": `https://www.brushlineservices.com/images/${cityData.gallery[0]}-painting.webp`,
        "description": `Professional painting services in ${cityData.city}, FL including interior painting, exterior painting, and drywall repair.`,
        "areaServed": {
          "@type": "Place",
          "name": `${cityData.city}, FL`
        },
        "serviceType": [
          "Interior Painting",
          "Exterior Painting",
          "Drywall Repair",
          "House Painting",
          "Commercial Painting"
        ],
        "provider": {
          "@type": "LocalBusiness",
          "name": "Brushline Services",
          "url": "https://www.brushlineservices.com",
          "telephone": "239-777-3713"
        }
      })}} />
    </Helmet>
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
                  <a href="tel:2397773713" onClick={() =>{
                            if (window.gtag) {
                            window.gtag('event', 'conversion', {
                                send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq'
                            });
                            }}}> <FaPhone/> (239)777-3713</a>
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

    
        <div className="list-container-wrapper light-orange light-orange">
            <motion.section className="list-container card "
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
        
        <SignatureDivider/>

        <div className="cta-wrapper light-orange">
            <motion.section className="card cta-card cartoon-box"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.5 }}>
                <h1 className='section-subtitle'>See What It’ll Cost – Get Free Estimate</h1>
                        <div className="cta-button-group">
                            <a href="tel:2397773713" onClick={() =>{
                            if (window.gtag) {
                            window.gtag('event', 'conversion', {
                                send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq'
                            });
                            }}}><button className="button"> CALL NOW </button></a>
                            <p>OR</p>
                            <a href="#contact"><button className="button"> CONTACT US </button></a>
                        </div>
            </motion.section>
        </div>
              <SignatureDivider/>

    {/* <Services/> */}

    <div className="reviews-paint">
      <Reviews/>
    </div>
          <SignatureDivider/>

    <WhyUs/>
          <SignatureDivider/>

    <Contact/>
    </div>
  );
};

export default ServiceArea;