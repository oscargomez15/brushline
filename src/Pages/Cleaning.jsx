import PaintingEstimateForm from '../Components/PaintingEstimateForm';
import { Reviews } from './Reviews';
import animateFaq from '../utils/animateFaq';
import PaintingReviewCard from '../Components/PaintingReviewCard';
import '../Styling/PaintingFunnel.css';
import '../Styling/ServiceHero.css';


import React from 'react'
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import { motion, AnimatePresence} from 'framer-motion'
import { PaintingCard } from '../Components/PaintingCard'
import { FaCheck } from 'react-icons/fa';
import emailjs from 'emailjs-com'
import { TbSquareRoundedCheckFilled } from 'react-icons/tb';
import { useState } from 'react';
import { SignatureDivider } from '../Components/SignatureDivider';

export const Cleaning = () => {
        const services = [
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/residential-cleaning.mp4",
          title: 'Residential Cleaning',
          description:'Keep your home spotless and stress-free with our trusted residential cleaning services.',
          items:[  "Dusting of furniture, shelves, and décor",
                    "Sweeping, vacuuming, and mopping floors",
                    "Kitchen and Bathroom cleaning/sanitizing",
                    "Trash removal and can liner replacement",
                    "Bedroom tidying (making beds, dusting, floor cleaning)"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning-window.mp4",
          title: 'Window Cleaning',
          description:'Bring more natural light into your home or business with streak-free window cleaning services! ',
          items:[  "Interior and exterior window glass cleaning",
                    "Window sill and track cleaning",
                    "Wiping down window frames",
                    "Removal of smudges, dust, hard water stains, and fingerprints",
                    "Optional screen cleaning (if removable)"]
        },
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning-toilet.mp4",
          title: 'Rental Cleaning',
          description:"Turnover made easy! Whether you're a landlord or tenant, our rental cleaning services ensure your property is spotless and ready for the next move-in. ",
          items:[  "Complete bathroom and kitchen sanitization",
                    "Deep cleaning of floors (vacuuming and mopping)",
                    "Dusting blinds, baseboards, fans, and vents",
                    "Removing cobwebs",
                    "Window spot-cleaning (interior)",
                    "Trash removal"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/fan-cleaning.mp4",
          title: 'Deep Cleaning',
          description:'We tackle built-up dirt, grime, and hidden allergens in hard-to-reach areas. Perfect for seasonal cleanups, post-renovation, or when you just want a fresh start!',
          items:[
                    "Baseboards scrubbed, not just dusted",
                    "Hand-washing of cabinet fronts and door frames",
                    "Deep cleaning of tile grout and behind appliances (as accessible)",
                    "Ceiling fans, vents, and light fixtures cleaned",
                    "Dusting of blinds and window ledges",
                    "Cleaning under furniture (if movable)"]
        },
      ];

    const generalQuestions = [
        {
            question: "What areas do you serve?",
            answer: "We proudly serve Cape Coral, Fort Myers, Port Charlotte, and surrounding areas."
        },
        {
            question: "Do I need to provide cleaning supplies and equipment?",
            answer: "No, we bring all the necessary cleaning supplies and equipment. If you have specific preferences, let us know!"
        }
    ];

    const serviceSpecificQuestions = [
        {
            question: "What is included in a deep cleaning service?",
            answer: "Deep cleaning focuses on those hard-to-reach or often-overlooked areas, such as baseboards, blinds, behind appliances, and grout cleaning."
        },
        {
            question: "What’s included in move-in/move-out cleaning?",
            answer: "This service includes a thorough cleaning of the entire property, including cabinets, appliances, walls, and floors, ensuring it's ready for new occupants."
        },
        {
            question: "Do you clean after construction or renovations?",
            answer: "Yes, we offer post-construction and post-renovation cleaning to remove dust, debris, and residues."
        }
    ];

    const bookingQuestions = [
        {
            question: "How do I book a cleaning service?",
            answer: "You can book online through our website or call us directly at (239)777-3713."
        },
        {
            question: "How far in advance should I schedule?",
            answer: "We recommend scheduling at least 1-2 weeks in advance to secure your preferred time."
        },
        {
            question: "Can I cancel or reschedule my appointment?",
            answer: "Yes, you can cancel or reschedule up to 24-48 hours before your appointment without any fees."
        }
    ];

    const paymentQuestions = [
        {
            question: "How much does your cleaning service cost?",
            answer: "Our pricing depends on the size of your property and the type of service. Contact us for a free quote!"
        },
        {
            question: "What forms of payment do you accept?",
            answer: "We accept cash, credit/debit cards, and online payments."
        },
        {
            question: "Do you offer discounts for recurring services?",
            answer: "Yes, we provide discounts for weekly, bi-weekly, and monthly cleaning schedules."
        }
    ];

    const miscellaneousQuestions = [
        {
            question: "What happens if I’m not satisfied with the cleaning?",
            answer: "Your satisfaction is our priority. If you're not happy with our work, let us know within 24 hours, and we'll make it right!"
        },
        {
            question: "Do I need to be home during the cleaning?",
            answer: "No, you don’t need to be home. Many of our clients provide access to their property, and we ensure your home is secure at all times."
        },
        {
            question: "Do you offer gift cards for your services?",
            answer: "Yes, we offer gift cards that make a perfect gift for friends and family in need of a cleaning service!"
        }
    ];

            const defaultFormValues = {
            name:'',
            address:'',
            email:'',
            phone:'',
            message:''
        }

        const [form, setForm] = useState(defaultFormValues)
        const [showModal, setShowModal] = useState(false);

        const handleChange = (event) => {
            setForm( (prev) => ({
                ...prev,
                [event.target.name]: event.target.value
            }))
        }

        const resetForm = () => {
            setForm( () => (defaultFormValues))
        }

        const handleSubmit = (event) => {
            event.preventDefault();
            resetForm();

            const templateParams = {
                name:form.name,
                address:form.address,
                phone:form.phone,
                message:form.message
            }

            emailjs.send('service_yu3xbte','template_0gbxxst',templateParams,'kq-ZfpeLDvV8TYH26')
                .then(() => {
            setShowModal(true); // ✅ Show modal
            resetForm();
            })
            .catch((error) => {
            console.error('Failed to send message:', error);
            });
        }

        const isFormValid = Object.values(form).every((value) => value.trim() !== '');

    const toggleAccordion = animateFaq;

  return (
    <section className='page painting-funnel-page other-service-page'>

        <AnimatePresence>
                {showModal && (
                    <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal cartoon-box"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="modal-text">
                                <h2><TbSquareRoundedCheckFilled/> Message Sent</h2>
                                <p>Thanks for reaching out! We'll get back to you within 24 hours.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className='button'>Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        <section className='landing-hero-wrapper'>
            <div className="landing-hero"><video muted autoPlay loop playsInline className=' video-desktop'>
                <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning.MP4"/>
            </video>
                <div className="contact-mini-container"><span className="painting-eyebrow">Fort Myers · Estero · Bonita Springs · Naples</span>
                    <h1 className='section-title'><span> Cleaning Service</span> for Homes and Businesses in SWFL</h1>
                    <p>Let us handle the mess — you focus on what matters. Reach out using the contact form.</p>
                <div className="painting-hero-actions"><a className="painting-call-button" href="tel:+12397773713"><span><strong>Call for a Free Estimate</strong><small>(239) 777-3713</small></span></a><span className="painting-call-note">Let’s talk about your project. No obligation.</span></div>
<PaintingReviewCard /></div>

                <div className="service-estimate-options"><PaintingEstimateForm service="cleaning" />
<div className="painting-or-divider"><span>OR</span></div>
<div className="painting-assistant-option">
 <h2>Plan your free estimate with our AI assistant</h2>
 <a href="/assistant">Talk to Our AI Assistant <span aria-hidden="true">→</span></a>
 <small>Our team will confirm your appointment.</small>
 </div></div>
</div>

            
        </section>

                <Reviews />
        <section className="painting-services-section">
        <motion.div
            className="painting-services-container"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="painting-services-header">
            <span>Cleaning Services</span>
            <h2>Spotless Cleaning For Homes & Businesses</h2>
            <p>
                From one-time deep cleans to move-out and rental cleaning, our team
                helps keep your home or business fresh, organized, and ready to enjoy.
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
            <span className="cta-tag">Residential • Rental • Deep Cleaning</span>

            <h2>Ready To Experience A Cleaner Space?</h2>

            <p>
            Schedule a cleaning service with Brushline and enjoy a fresh, polished
            space without the stress.
            </p>

            <div className="cta-button-group">
            <a href="tel:2397773713">
                <button className="button">Call Now</button>
            </a>

            <a href="#contact">
                <button className="button">Contact Us</button>
            </a>
            </div>

            <div className="cta-benefits">
            <span>✓ Free estimates</span>
            <span>✓ Flexible scheduling</span>
            <span>✓ Detail-focused service</span>
            </div>
        </motion.section>
        </div>

        <SignatureDivider/>

        <div className="faq-wrapper light-orange">
            <div className="card faq ">
                <div className="sub-heading">
                    <h2 className="section-subtitle">Frequently asked questions</h2>
                    <p> Quick answers to questions you may have</p>
                </div>
                <div className="questions-wrapper">
                    <div className="questions-container">
                        <div className="questions-title accordion cartoon-box " onClick={toggleAccordion} >
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
                            <h2>Service-Specific</h2>
                            <MdKeyboardArrowDown size="30"/>
                        </div>
                        <ol className='questions-list panel'>
                            {serviceSpecificQuestions.map((item, id) => {
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
                            <h2>Booking and Scheduling</h2>
                            <MdKeyboardArrowDown size="30"/>
                        </div>
                        <ol className='questions-list panel'>
                            {bookingQuestions.map((item, id) => {
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
                            <h2>Payment and Pricing</h2>
                            <MdKeyboardArrowDown size="30"/>
                        </div>
                        <ol className='questions-list panel'>
                            {paymentQuestions.map((item, id) => {
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
                            <h2>Miscellaneous</h2>
                            <MdKeyboardArrowDown size="30"/>
                        </div>
                        <ol className='questions-list panel'>
                            {miscellaneousQuestions.map((item, id) => {
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
            </div>
        </div>
        <SignatureDivider/>
        <Contact/>
    </section>
  )
}
