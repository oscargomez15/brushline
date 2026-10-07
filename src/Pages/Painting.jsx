import animateFaq from '../utils/animateFaq';
import PaintingEstimateForm from '../Components/PaintingEstimateForm';
import PaintingReviewCard from '../Components/PaintingReviewCard';
import { Phone } from 'lucide-react';
import '../Styling/PaintingFunnel.css';
import '../Styling/ServiceHero.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";

import ReactCompareImage from 'react-compare-image';



import beforeAccent from '../Assets/before-accent-wall-painting-fort-myers.jpg'
import afterAccent from '../Assets/after-accent-wall-painting-fort-myers.jpg'

import beforeCommercial from '../Assets/commercial-exterior-painting-fort-myers-before.webp'
import afterCommercial from '../Assets/commercial-exterior-painting-fort-myers-after.webp'

import afterJonathan from '../Assets/exterior-painting-fort-myers-after.webp'
import beforeJonathan from '../Assets/exterior-painting-fort-myers_before.webp'

import afterCape from '../Assets/exterior-painting-cape-coral_after.webp'
import beforeCape from '../Assets/exterior-painting-cape-coral_before.webp'

import beforeBonita from '../Assets/interior-painting-bonita-springs-before.webp'
import afterBonita from '../Assets/interior-painting-bonita-springs-after.webp'

import beforeStain from '../Assets/wood-stain-before-estero.jpg'
import afterStain from '../Assets/wood-stain-after-estero.jpg'

import beforeCheryl from '../Assets/before-wallpaper-removal-fort-myers.webp'
import afterCheryl from '../Assets/after-wallpaper-removal-fort-myers.webp'

import poolDeckBefore from '../Assets/pool-deck-paint-estero-before.jpg'
import poolDeckAfter from '../Assets/pool-deck-paint-estero-after.jpg'

import garagefloorbefore from '../Assets/garge-floor-painting-estero_before.jpg'
import garagefloorafter from '../Assets/garge-floor-painting-estero_after.jpg'

import annInteriorBefore from '../Assets/naples-interior-painting-before.jpeg'
import annInteriorAfter from '../Assets/naples-interior-painting-after.jpeg'

import { PaintingCard } from '../Components/PaintingCard';
import { IoLocation } from 'react-icons/io5';
import { MdNavigateNext, MdNavigateBefore } from 'react-icons/md';

import { Reviews } from './Reviews.jsx';
import { SignatureDivider } from '../Components/SignatureDivider.jsx';
import { ServiceAreaSection } from './ServiceAreaSection.jsx';



export const Painting = () => {

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

    const generalQuestions = [
        {
            question: "What types of painting services do you offer?",
            answer: "We provide interior and exterior painting, including walls, ceilings, doors, trim, crown molding, and baseboards."
        },
        {
            question: "Do you offer free estimates?",
            answer: "Yes, we offer free, no-obligation estimates for all painting projects."
        },
        {
            question: "What areas do you service?",
            answer: "We serve Cape Coral, Fort Myers, Estero, Naples, Bonita Springs and the surrounding regions. Contact us to confirm if we cover your location."
        },
        {
            question: "What kind of paint do you use?",
            answer: "We use high-quality, durable paints from trusted brands to ensure a long-lasting finish."
        },
        {
            question: "Do you offer color consultation?",
            answer: "Yes, our experts can help you choose the perfect colors for your space based on your style and preferences."
        }
    ];

    const preparationAndProcessQuestions = [
        {
            question: "How do you prepare the surfaces before painting?",
            answer: "We clean, sand, and prime surfaces to ensure a smooth and long-lasting finish."
        },
        {
            question: "Do I need to move my furniture before painting?",
            answer: "We recommend clearing the area, but our team can help move furniture and cover items to protect them."
        },
        {
            question: "Will you fix cracks or holes before painting?",
            answer: "Yes, we repair minor cracks, holes, and imperfections to create a flawless surface."
        },
        {
            question: "How long does the painting process take?",
            answer: "The timeline varies based on the size and scope of the project. We’ll provide an estimated timeline during the consultation."
        },
        {
            question: "What do I need to do to prepare my home for painting?",
            answer: "We’ll guide you through preparation steps, including clearing the area and removing wall decor."
        }
    ];

    const pricingAndPaymentQuestions = [
        {
            question: "How much does it cost to paint a room?",
            answer: "Pricing depends on the size of the room, the type of paint, and the condition of the surfaces. Contact us for a detailed quote."
        },
        {
            question: "Do you require a deposit?",
            answer: "We typically require a deposit to secure your booking. The amount will be outlined in your contract."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept cash, check, and debit card. Let us know your preference!"
        }
    ];

    const postPaintingAndMaintenanceQuestions = [
        {
            question: "How do I maintain my painted surfaces?",
            answer: "Regular cleaning with a damp cloth and avoiding harsh chemicals will help maintain the finish."
        },
        {
            question: "Do you offer a warranty on your work?",
            answer: "Yes, we stand by our work and offer a warranty for your peace of mind."
        },
        {
            question: "Will you clean up after the project is finished?",
            answer: "Absolutely! We leave your space clean and tidy, removing all painting materials and waste."
        }
    ];

    const customRequestsAndSpecialProjectsQuestions = [
        {
            question: "Can you match a specific paint color?",
            answer: "Color matching in most cases will not achieve the desired results due to fading of the existing color. We recommend repainting the complete area instead of matching."
        },
        {
            question: "Do you paint commercial properties?",
            answer: "Yes, we offer painting services for both residential and commercial properties."
        },
        {
            question: "Can you work on textured walls or unique surfaces?",
            answer: "Yes, we have experience with textured walls, wood, metal, and other unique surfaces."
        },
        {
            question: "Do you offer eco-friendly paint options?",
            answer: "Yes, we provide low-VOC and eco-friendly paint options for environmentally conscious customers."
        }
    ];

    const sliderData = [
{
    left:beforeAccent,
    right:afterAccent,
    text: 'Accent Wall Painting',
    location: 'Fort Myers'
},
{
    left: beforeCheryl,
    right: afterCheryl,
    text: 'Wallpaper Removal & Painting',
    location: 'Estero'
  },{
    left: beforeCape,
    right: afterCape,
    text: 'Exterior Painting',
    location: 'Cape Coral',
  },{
    left: annInteriorBefore,
    right: annInteriorAfter,
    text: 'Interior Painting',
    location: 'Naples',
  },
  {
    left: beforeStain,
    right: afterStain,
    text: 'Exterior Staining',
    location: 'San Carlos',
  },{
    left: poolDeckBefore,
    right: poolDeckAfter,
    text: 'Exterior Painting',
    location: 'San Carlos',
  },{
    left: garagefloorbefore,
    right: garagefloorafter,
    text: 'Garage Floor Painting',
    location: 'Estero',
  },
  {
    left: beforeCommercial,
    right: afterCommercial,
    text: 'Exterior Painting (Commercial)',
    location: 'Fort Myers',
  },
  {
    left: beforeJonathan,
    right: afterJonathan,
    text: 'Exterior Painting',
    location: 'Fort Myers',
  },
  {
    left: beforeBonita,
    right: afterBonita,
    text: 'Interior Painting',
    location: 'Bonita Springs',
  }
];

const [currentIndex, setCurrentIndex] = useState(0);
const [direction, setDirection] = useState(0); // -1 for left, 1 for right

const handlePrev = () => {
setDirection(-1);
  setCurrentIndex((prev) => (prev === 0 ? sliderData.length - 1 : prev - 1));
};

const handleNext = () => {
    setDirection(1);
  setCurrentIndex((prev) => (prev === sliderData.length - 1 ? 0 : prev + 1));
};

const variants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction < 0 ? 100 : -100,
  }),
};


    const toggleAccordion = animateFaq;



  return (
    <div className='page painting-funnel-page'>


        <section className="painting-conversion-hero" id="contact">
          <div className="painting-hero-copy"><span className="painting-eyebrow">Fort Myers · Estero · Bonita Springs · Naples</span>
            <h1>Interior &amp; exterior painting.<br/><span>A fresh finish for your home.</span></h1>
            <p>Careful preparation, clean work, and dependable communication—from your first estimate to the final walkthrough.</p>
            <div className="painting-hero-actions"><a className="painting-call-button" href="tel:+12397773713"><Phone size={22} aria-hidden="true"/><span><strong>Call for a Free Estimate</strong><small>(239) 777-3713</small></span></a><span className="painting-call-note">Let’s talk about your project. No obligation.</span></div>
            <figure><img src={afterCape} alt="Completed Brushline exterior painting project in Cape Coral" fetchPriority="high"/><figcaption>A real Brushline exterior painting project · Cape Coral</figcaption></figure>
            <PaintingReviewCard />
          </div>
          <div className="painting-estimate-options">
            <PaintingEstimateForm />
            <div className="painting-or-divider"><span>OR</span></div>
<div className="painting-assistant-option">
              <h2>Plan your free estimate with our AI assistant</h2>
              <a href="/assistant">Talk to Our AI Assistant <span aria-hidden="true">→</span></a>
              <small>Our team will confirm your appointment.</small>
            </div>
          </div>
        </section>
        <Reviews />
        <div className="painting-services-section">
        <motion.section
            className="painting-services-container"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="painting-services-header">
            <span>Painting Services</span>
            <h2>Interior & Exterior Painting Built To Last</h2>
            <p>
                Whether you're refreshing your home or updating a commercial property,
                we’ve got every surface covered with clean prep, premium products, and
                lasting craftsmanship.
            </p>
            </div>

            <div className="painting-services-grid">
            {services.map((service, index) => (
                <PaintingCard key={index} {...service} />
            ))}
            </div>
        </motion.section>
        </div>
        <section className="painting-color-help"><h2>Not sure which colors to choose?</h2><p>Ask about colors and finishes when we discuss your project.</p><a href="#contact">Get My Free Painting Estimate</a></section>

        <ServiceAreaSection />

        <SignatureDivider/>


        <div className="cta-wrapper">
        <motion.section
            className="cta-card-modern"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.4 }}
        >
            <div className="cta-glow"></div>

            <div className="cta-content">
            <span>Free Estimates • Fast Scheduling</span>

            <h2>
                Ready To Start Your
                <br />
                Painting Project?
            </h2>

            <p>
                From interior repainting to exterior transformations,
                Brushline Services delivers clean finishes, reliable
                communication, and professional results across Southwest Florida.
            </p>

            <div className="cta-button-group">
                <a
                href="tel:2397773713"
                className="cta-primary-btn"
                onClick={() => {
                    if (window.gtag) {
                    window.gtag('event', 'conversion', {
                        send_to: 'AW-11511949240/WVoxCLH_9fYaELjPqfEq',
                    });
                    }
                }}
                >
                Call Now
                </a>

                <a href="#contact" className="cta-secondary-btn">
                Contact Us
                </a>
            </div>
            </div>
        </motion.section>
        </div>

        <SignatureDivider/>

        <section className="paint-showcase-section">
        <motion.div
            className="paint-showcase-container"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.4 }}
        >
            <div className="paint-showcase-copy">
            <span>Before & After</span>
            <h2>See The Difference A Professional Finish Makes</h2>
            <p>
                Explore real before-and-after photos from homes and commercial
                properties we’ve transformed across Lee County and Collier County.
            </p>

            <a href="#contact" className="paint-showcase-btn">
                Get Free Quote
            </a>
            </div>

            <div className="paint-showcase-slider">
            <AnimatePresence custom={direction} mode="wait">
                <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="compare-image-container"
                >
                <ReactCompareImage
                    leftImage={sliderData[currentIndex].left}
                    rightImage={sliderData[currentIndex].right}
                    wrapperStyle={{ height: '100%' }}
                    sliderLineColor="#ffffff"
                    handleSize={44}
                    className="compare-image"
                />

                <div className="slider-text">
                    <p>{sliderData[currentIndex].text}</p>
                    <p className="slider-location">
                    <IoLocation /> {sliderData[currentIndex].location}
                    </p>
                </div>

                <button className="arrow-slider-container nav-before" onClick={handlePrev}>
                    <MdNavigateBefore />
                </button>

                <button className="arrow-slider-container nav-next" onClick={handleNext}>
                    <MdNavigateNext />
                </button>
                </motion.div>
            </AnimatePresence>
            </div>
        </motion.div>
        </section>

        <SignatureDivider/>
        <div className="painting-final-action"><h2>Ready for a fresh start?</h2><a href="#contact">Get My Free Painting Estimate</a><p>No obligation. Let’s discuss your project.</p></div>

        <div className="faq-wrapper light-orange">
        <motion.section className="card faq"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>
            <div className="sub-heading">
                <h2 className='section-subtitle'>Frequently asked questions</h2>
            </div>
            <div className="questions-wrapper">
                <div className="questions-container">
                    <div className="questions-title accordion cartoon-box" onClick={toggleAccordion} >
                        <h2>General</h2>
                        <MdKeyboardArrowDown size="30"/>
                    </div>
                    <ol className='questions-list panel'>
                        {generalQuestions.map((item, id) => {
                            return (
                                <li className='question-item'>
                                <p className='question'>{item.question}</p>
                                <p className='answer'>{item.answer}</p>
                            </li>
                            )
                        })}
                    </ol>
                </div>

                <div className="questions-container">
                    <div className="questions-title accordion cartoon-box" onClick={toggleAccordion}>
                        <h2>Preparation and Process </h2>
                        <MdKeyboardArrowDown size="30"/>
                    </div>
                    <ol className='questions-list panel'>
                        {preparationAndProcessQuestions.map((item, id) => {
                            return (
                                <li className='question-item'>
                                <p className='question'>{item.question}</p>
                                <p className='answer'>{item.answer}</p>
                            </li>
                            )
                        })}
                    </ol>
                </div>

                <div className="questions-container">
                    <div className="questions-title accordion cartoon-box" onClick={toggleAccordion}>
                        <h2>Pricing and Payment </h2>
                        <MdKeyboardArrowDown size="30"/>
                    </div>
                    <ol className='questions-list panel'>
                        {pricingAndPaymentQuestions.map((item, id) => {
                            return (
                                <li className='question-item'>
                                <p className='question'>{item.question}</p>
                                <p className='answer'>{item.answer}</p>
                            </li>
                            )
                        })}
                    </ol>
                </div>

                <div className="questions-container">
                    <div className="questions-title accordion cartoon-box" onClick={toggleAccordion}>
                        <h2>Post-Paint and Maintenance</h2>
                        <MdKeyboardArrowDown size="30"/>
                    </div>
                    <ol className='questions-list panel'>
                        {postPaintingAndMaintenanceQuestions.map((item, id) => {
                            return (
                                <li className='question-item'>
                                <p className='question'>{item.question}</p>
                                <p className='answer'>{item.answer}</p>
                            </li>
                            )
                        })}
                    </ol>
                </div>



                <div className="questions-container">
                    <div className="questions-title accordion cartoon-box" onClick={toggleAccordion}>
                        <h2>Custom Request</h2>
                        <MdKeyboardArrowDown size="30"/>
                    </div>
                    <ol className='questions-list panel'>
                        {customRequestsAndSpecialProjectsQuestions.map((item, id) => {
                            return (
                                <li className='question-item'>
                                <p className='question'>{item.question}</p>
                                <p className='answer'>{item.answer}</p>
                            </li>
                            )
                        })}
                    </ol>
                </div>
            </div>
        </motion.section>
        </div>
    </div>
  )
}
