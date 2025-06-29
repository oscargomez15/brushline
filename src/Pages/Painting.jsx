import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import ReactCompareImage from 'react-compare-image';

import colorConsultation from '../Assets/color-consultation.jpg'
import colorVisualization from '../Assets/color-visualization.png'

import beforeCommercial from '../Assets/before-commercial.jpg'
import afterCommercial from '../Assets/after-commercial.jpg'

import afterJonathan from '../Assets/after-jonathan.jpg'
import beforeJonathan from '../Assets/before-jonathan.jpg'

import afterCape from '../Assets/cape-after.jpeg'
import beforeCape from '../Assets/cape-before.jpeg'

import beforeBonita from '../Assets/before-paty.jpg'
import afterBonita from '../Assets/after-paty.jpg'

import { PaintingCard } from '../Components/PaintingCard';
import { IoLocation } from 'react-icons/io5';
import {CgArrowLeftR, CgArrowRightR} from 'react-icons/cg';
export const Painting = () => {
    const services = [
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/door.mp4",
          title: 'Door and Trim',
          description: 'Interior and Exterior'
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/wall.mp4",
          title: 'Walls and Ceiling',
          description: 'Interior and Exterior'
        },
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/crown.mp4",
          title: 'Crown Molding and Baseboard',
          description: 'Interior'
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/exterior.mp4",
          title: 'Walls and Soffit',
          description: 'Exterior'
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
    left: beforeCommercial,
    right: afterCommercial,
    text: 'Residential Exterior Paint',
    location: 'Fort Myers',
  },
  {
    left: beforeJonathan,
    right: afterJonathan,
    text: 'Residential Exterior Paint',
    location: 'Fort Myers',
  },
  {
    left: beforeCape,
    right: afterCape,
    text: 'Residential Exterior Paint',
    location: 'Cape Coral',
  },
  {
    left: beforeBonita,
    right: afterBonita,
    text: 'Residential Interior Paint',
    location: 'Bonita Springs',
  },
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


    const toggleAccordion = (e) => {
        e.currentTarget.classList.toggle("active");

        const panel = e.currentTarget.nextElementSibling;
        if(panel.style.display === "block"){
            panel.style.display = "none";
        }else{
            panel.style.display = "block";
        }
    }



  return (
    <div className='page'>
        <section className='landing-hero'>
            <div className="column">
                <div className="contact-mini-container cartoon-box">
                    <h1 className='section-title'> <span>Pro Painters</span> servicing Naples to Fort Myers</h1>
                        <p>Bringing Reliable, High-Quality Painting to Cape Coral, Fort Myers, Bonita Springs, Estero, & Naples</p>
                        <div className="contact-mini">
                            <div className="field-group-container">
                                <div className="field-group">
                                    <label htmlFor="">Name*</label>
                                    <input type="text" />
                                </div>

                                <div className="field-group">
                                    <label htmlFor="">Email*</label>
                                    <input type="email" />
                                </div>
                            </div>

                            <div className="field-group-container">
                                <div className="field-group">
                                    <label htmlFor="">Phone*</label>
                                    <input type="text" />
                                </div>

                                <div className="field-group">
                                    <label htmlFor="">Address*</label>
                                    <input type="text" />
                                </div>
                            </div>
                            <div className="field-group">
                                <label htmlFor="">Message (Optional)</label>
                                <textarea name="" id="" cols="30" rows="2" placeholder='Add more details about your project'></textarea>
                            </div>
                        </div>

                        <p class="privacy-notice">
                            By submitting this form, you agree to our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                        </p>
                        
                        <div className="button-group">
                            <a href="/painting/#contact"><button className="button"> Get Free Quote </button></a>
                            <p>No-cost estimates, no obligation.</p>
                        </div>
                </div>
            </div>

            <div className="column video-column">
                <video muted autoPlay loop playsInline className=' column video-desktop cartoon-box'>
                    <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/painting-hero2.mp4" />  
                </video>
            </div>
        </section>

        <motion.section className="list-container card cartoon-box"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>

            <div className="card-title">
                <h1 className='section-subtitle'> What We Do</h1>
                <p>Whether you're refreshing your home or updating a commercial property, we’ve got every surface covered.</p>
            </div>
            <div className="painting-list">
                {services.map((service, index) => (
                    <PaintingCard key={index} {...service}/>
                ))}
            </div>
        </motion.section>

        <motion.section className="card paint-jobs cartoon-box"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>
            <div className="card-title paint-jobs-title">
                <h1 className='section-subtitle'> Our Painting Jobs</h1>
                <p>See the Quality of Our Work Across Cape Coral, Fort Myers, and Naples.
                    From exterior repaints to interior transformations, our local painting projects speak for themselves. Browse real before-and-after photos of homes and businesses we've refreshed throughout Lee and Collier County</p>
                <div className="arrow-slider-container">
                    <CgArrowLeftR onClick={handleNext}/>
                    <CgArrowRightR onClick={handlePrev}/>
                </div>
            </div>
            <div className="slider-image-container single">
                <div className="slider-nav">
                    <div className="slider-item" style={{ position: 'relative'}}>
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                        <ReactCompareImage
                            leftImage={sliderData[currentIndex].left}
                            rightImage={sliderData[currentIndex].right}
                            sliderLineColor="#ffffff"
                            handleSize={40}
                        />
                        <div className="slider-text">
                            <p>{sliderData[currentIndex].text}</p>
                            <p className="slider-location">
                            <IoLocation /> {sliderData[currentIndex].location}
                            </p>
                        </div>
                        </motion.div>
                    </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.section>

        <motion.section className="card cartoon-box cta-card"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.5 }}>
            <h1 className='section-subtitle'>Ready to start your next painting project?</h1>
                    <div className="cta-button-group">
                        <a href="tel:2397773713"><button className="button"> CALL NOW </button></a>
                        <p>OR</p>
                        <a href="#contact"><button className="button"> CONTACT US </button></a>
                    </div>

        </motion.section>

        <motion.section className="card cartoon-box"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>
            <div className="color-consultation">
                <div className="color-consultation-text">
                    <h1 className='section-subtitle'> In need of <span>color consultation?</span> </h1>
                    <p> If picking the right colors is holding you back from getting this project done, it's time to call the professionals.
                        We can help you choose the right colors for your home or business. </p>
                        <div className="contact-mini">
                            <div className="field-group-container">
                                <div className="field-group">
                                    <label htmlFor="">Name*</label>
                                    <input type="text" />
                                </div>

                                <div className="field-group">
                                    <label htmlFor="">Email*</label>
                                    <input type="email" />
                                </div>
                            </div>

                            <div className="field-group-container">
                                <div className="field-group">
                                    <label htmlFor="">Phone*</label>
                                    <input type="text" />
                                </div>

                                <div className="field-group">
                                    <label htmlFor="">Address*</label>
                                    <input type="text" />
                                </div>
                            </div>
                            <div className="field-group">
                                <label htmlFor="">Message (Optional)</label>
                                <textarea name="" id="" cols="30" rows="2" placeholder='Add more details about your project'></textarea>
                            </div>
                            <p class="privacy-notice">
                            By submitting this form, you agree to our <a href="/privacy" target="_blank">Privacy Policy</a>.
                        </p>
                        </div>

                        <div className="button-group">
                            <a href="/painting/#contact"><button className="button"> Get Free Color Consultation </button></a>
                            <p>No-cost consultation, no obligation.</p>
                        </div>
                </div>
                <img src={colorConsultation} alt="color-consultation" />

            </div>
        </motion.section>

        <motion.section className="card cartoon-box"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>
            <div className="card-title">
                <h1 className='section-subtitle'>Color Visualization available</h1>
                <p>See how your space will look with different colors before you commit. Our color visualization service helps you make informed decisions.</p>
            </div>
            <img src={colorVisualization} alt="color-visualization" className='color-visualization-img' />
        </motion.section>

        <motion.section className="card cartoon-box cta-card"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.5 }}>
            <h1 className='section-subtitle'>Let’s Get Rolling, We’re just a click away.</h1>
                    <div className="cta-button-group">
                        <a href="tel:2397773713"><button className="button"> CALL NOW </button></a>
                        <p>OR</p>
                        <a href="#contact"><button className="button"> CONTACT US </button></a>
                    </div>

        </motion.section>



        <motion.section className="card faq cartoon-box"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.5 }}>
            <div className="card-title">
                <h1 className='section-subtitle'>Frequently Asked Question</h1>
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
        <Contact/>
    </div>
  )
}
