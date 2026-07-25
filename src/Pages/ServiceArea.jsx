import { useParams } from 'react-router-dom';
import { serviceAreaData } from '../data/serviceAreas';import { motion } from 'framer-motion';
import { FaCheck, FaPhone } from 'react-icons/fa';
import { Contact } from './Contact';
import { Reviews } from './Reviews';
import { PaintingCard } from '../Components/PaintingCard';
import { WhyUs } from '../Components/WhyUs';
import { Helmet } from 'react-helmet';
import { SignatureDivider } from '../Components/SignatureDivider';
import '../Styling/ServiceArea.css';

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
      <title>Interior & Exterior Painters in {cityData.city}, FL | Brushline</title>
      <meta
        name="description"
        content={`Professional interior and exterior painting in ${cityData.city}, FL. Brushline Services provides careful preparation, durable finishes, and free estimates.`}
      />
      <link rel="canonical" href={`https://www.brushlineservices.com/service-area/${citySlug}`} />
      <meta property="og:title" content={`Interior & Exterior Painters in ${cityData.city}, FL | Brushline`} />
      <meta property="og:description" content={`Professional residential and commercial painting services in ${cityData.city}, Florida.`} />
      <meta property="og:url" content={`https://www.brushlineservices.com/service-area/${citySlug}`} />
      <meta property="og:type" content="website" />
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
          "@id": "https://www.brushlineservices.com/#business",
          "name": "Brushline Services",
          "url": "https://www.brushlineservices.com",
          "telephone": "+1-239-777-3713"
        }
      })}} />
    </Helmet>
<section className="service-area-hero">
  <img
    src={cityData.gallery}
    alt={`${cityData.city} painting services`}
    className="service-area-hero-bg"
  />

  <div className="service-area-hero-overlay"></div>

  <div className="service-area-hero-container">
    <div className="service-area-hero-copy">
      <span className="hero-badge">Painting Services in {cityData.city}</span>

    <motion.h1
      className="service-area-title"
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <span>{cityData.headline}</span>
    </motion.h1>

      <p>{cityData.description}</p>

      <div className="hero-actions">
        <a href="#contact" className="primary-btn">Get Free Estimate</a>
      <a href="tel:2397773713" className="hero-phone-pill">
          <FaPhone />
          <div>
              <span>Call Now</span>
              <strong>(239) 777-3713</strong>
          </div>
      </a>
      </div>

      <div className="benefits-glass">
        <div className="benefit-pill"><FaCheck /><span>No-cost estimates</span></div>
        <div className="benefit-pill"><FaCheck /><span>10+ Years Experience</span></div>
        <div className="benefit-pill"><FaCheck /><span>5-Star Rated</span></div>
      </div>
    </div>

    <div className="service-area-hero-card">
      <span>Free Estimate</span>
      <h3>Get Pricing For Your {cityData.city} Project</h3>
      <p>Tell us about your painting project and we’ll reach out within 24 hours.</p>
      <a href="#contact">Request Quote</a>
    </div>
  </div>
</section>
      {/* <div className="gallery">
        {cityData.gallery.map((img, i) => (
          <img src={img} alt={`${cityData.city} project ${i + 1}`} key={i} />
        ))}
      </div> */}

    
    <section className="painting-services-section">
      <motion.div
        className="painting-services-container"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="painting-services-header">
          <span>Painting Services</span>
          <h2>Professional Painting Services In {cityData.city}</h2>
          <p>
            Whether you're refreshing your home or updating a commercial property,
            Brushline Services provides clean prep, premium finishes, and reliable
            service in {cityData.city}.
          </p>
        </div>

        <div className="painting-services-grid">
          {services.map((service, index) => (
            <PaintingCard key={index} {...service} />
          ))}
        </div>
      </motion.div>
    </section>
        
        <SignatureDivider/>

    <div className="cta-wrapper">
      <motion.section
        className="cta-card"
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <span className="cta-tag">Painting • Drywall • Home Services</span>

        <h2>See What It’ll Cost In {cityData.city}</h2>

        <p>
          Get a free estimate for your interior or exterior painting project.
          Brushline Services proudly serves homeowners and businesses in {cityData.city}.
        </p>

        <div className="cta-button-group">
          <a href="tel:2397773713"><button className="button">Call Now</button></a>
          <a href="#contact"><button className="button">Contact Us</button></a>
        </div>

        <div className="cta-benefits">
          <span>✓ Free estimates</span>
          <span>✓ Local service</span>
          <span>✓ Clean finishes</span>
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
