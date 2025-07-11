import React from 'react'
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import { motion, AnimatePresence} from 'framer-motion'
import { PaintingCard } from '../Components/PaintingCard'
import { FaCheck } from 'react-icons/fa';
import emailjs from 'emailjs-com'
import { TbSquareRoundedCheckFilled } from 'react-icons/tb';
import { Helmet } from 'react-helmet';
import { useState } from 'react';

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
    <section className='page'>
        <Helmet>
            <title>Cleaning Services from Naples to Fort Myers | Professional, Affordable and 5 Star Rated </title>
            <meta name="description" content="Brushline Services is a professional cleaning services who provides residential and commercial services in Cape Coral, Fort Myers, Bonita Springs, Estero, and Naples. Get a free quote today!" />
        </Helmet>
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
            <div className="landing-hero">
                <div className="contact-mini-container">
                    <h1 className='section-title'><span> Cleaning Service</span> for Homes and Businesses in SWFL</h1>
                    <p>Let us handle the mess — you focus on what matters. Reach out using the contact form.</p>
                </div>

                <div className="contact-mini">
                    <div className="field-group-container">
                        <div className="field-group">
                            <label htmlFor="name">Name*</label>
                            <input type="text" name='name' id='name' value={form.name} onChange={handleChange} placeholder='Type Name' required/>
                        </div>

                        <div className="field-group">
                            <label htmlFor="">Email*</label>
                            <input type="email" name='email' id='email' value={form.email} onChange={handleChange} placeholder='Type your Email' required/>
                        </div>
                    </div>

                    <div className="field-group-container">
                        <div className="field-group">
                            <label htmlFor="">Phone*</label>
                            <input type="text" name='phone' id='phone' value={form.phone} onChange={handleChange} placeholder='Type your phone number' required/>
                        </div>

                        <div className="field-group">
                            <label htmlFor="">Address*</label>
                            <input type="text" name='address' id='address' value={form.address} onChange={handleChange} placeholder='Type Address' required/>
                        </div>
                    </div>
                    <div className="field-group">
                        <label htmlFor="">Message (Optional)</label>
                        <textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder='Briefly describe your project' ></textarea>
                    </div>

                    <p class="privacy-notice">
                        By submitting this form, you agree to our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                    </p>

                    <div className="button-group">
                        <button className='button' type="submit" onClick={handleSubmit} disabled={!isFormValid}> GET FREE QUOTE </button>
                        <div className="benefits-hero">
                            <div className="benefit-item">
                                <FaCheck/>
                                <p> No-cost estimates.</p>
                            </div>
                            <div className="benefit-item">
                                <FaCheck/>
                                <p>10+ years of experience</p>
                            </div>
                            <div className="benefit-item">
                                <FaCheck/>
                                <p>5-star rated</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <video muted autoPlay loop playsInline className=' video-desktop'>
                <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning.MP4"/>  
            </video>
        </section>

                <section className='landing-hero-mb'>
                    <div className="column">
                        <div className="contact-mini-container">
                            <h1 className='section-title'><span> Cleaning Service</span> for Homes and Businesses in SWFL</h1>
                                <p>Let us handle the mess — you focus on what matters.
                            Reach out using the contact form below.</p>
                                
                                <div className="button-group">
                                    <button className='button' type="submit"> <a href="#contact" style={{color:'white', textDecoration:'none'}}>GET FREE QUOTE</a></button>
                                    <div className="benefits-hero">
                                        <div className="benefit-item">
                                            <FaCheck/>
                                            <p> No-cost estimates.</p>
                                        </div>
                                        <div className="benefit-item">
                                            <FaCheck/>
                                            <p>10+ years of experience</p>
                                        </div>
                                        <div className="benefit-item">
                                            <FaCheck/>
                                            <p>5-star rated</p>
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
        
                    <div className="column video-column">
                        <video muted autoPlay loop playsInline className=' column video-desktop'>
                            <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning.MP4" />  
                        </video>
                    </div>
                </section>
        
        <div className="list-container-wrapper">
            <div className="list-container card">
                <div className="sub-heading">
                <h1><span>Cleaning Services</span> we offer</h1>
                <p>No matter if you need a one-time deep clean or ongoing upkeep, our professional team delivers spotless results for homes and businesses throughout Naples, Fort Myers, Estero, Bonita Springs, and Cape Coral. </p>
                </div>
                <div className="painting-list">
                    {services.map((service, index) => (
                        <PaintingCard key={index} {...service}/>
                    ))}
                </div>
            </div>
        </div>

        <div className="cta-wrapper">
            <motion.section className="card cta-card"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.5 }}>
                <h1 className='section-subtitle'>Ready to Experience a Cleaner Space? </h1>
                        <div className="cta-button-group">
                            <a href="tel:2397773713"><button className="button"> CALL NOW </button></a>
                            <p>OR</p>
                            <a href="#contact"><button className="button"> CONTACT US </button></a>
                        </div>
            </motion.section>
        </div>

        <div className="faq-wrapper">
            <div className="card faq ">
                <div className="sub-heading">
                    <h1>Frequently Asked Question</h1>
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
        <Contact/>
    </section>
  )
}
