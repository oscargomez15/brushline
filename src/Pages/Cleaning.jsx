import React from 'react'
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import { motion } from 'framer-motion'
import hero from '../Assets/cleaning.MP4'
import { PaintingCard } from '../Components/PaintingCard'

export const Cleaning = () => {
        const services = [
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/residential-cleaning.mp4",
          title: 'Residential Cleaning',
          description:'Keep your home spotless and stress-free with our trusted residential cleaning services. Whether you live in Naples, Fort Myers, Bonita Springs, or Cape Coral, our professional cleaners are committed to providing thorough, reliable, and affordable home cleaning. From kitchens to bathrooms, bedrooms to living rooms, we clean every corner so you can enjoy a fresher, healthier living space.',
          items:[  "Dusting of furniture, shelves, baseboards, and décor",
                    "Sweeping, vacuuming, and mopping all floors",
                    "Cleaning and sanitizing bathrooms (toilets, tubs, sinks, mirrors)",
                    "Kitchen cleaning (countertops, sinks, appliance exteriors, cabinet doors)",
                    "Trash removal and can liner replacement",
                    "Wiping light switches, door handles, and other high-touch areas",
                    "Bedroom tidying (making beds, dusting, floor cleaning)"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning-window.mp4",
          title: 'Window Cleaning',
          description:'Bring more natural light into your home or business with streak-free window cleaning services! We proudly serve Naples, Fort Myers, Bonita Springs, and Cape Coral, delivering crystal-clear results every time. Our team uses eco-friendly products and proven techniques to clean both interior and exterior windows—perfect for residential and commercial properties.',
          items:[  "Interior and exterior window glass cleaning",
                    "Window sill and track cleaning",
                    "Wiping down window frames",
                    "Removal of smudges, dust, hard water stains, and fingerprints",
                    "Optional screen cleaning (if removable)"]
        },
        {
          src:"https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/cleaning-toilet.mp4",
          title: 'Rental Cleaning',
          description:"Turnover made easy! Whether you're a landlord or tenant, our rental cleaning services ensure your property in Naples, Fort Myers, Bonita Springs, or Cape Coral is spotless and ready for the next move-in. We handle kitchens, bathrooms, floors, and everything in between to meet move-out inspection standards and maximize rental appeal.",
          items:[  "Complete bathroom and kitchen sanitization",
                    "Inside and outside of all cabinets and drawers",
                    "Cleaning inside the refrigerator and oven",
                    "Deep cleaning of floors (vacuuming and mopping)",
                    "Dusting blinds, baseboards, fans, and vents",
                    "Removing cobwebs",
                    "Window spot-cleaning (interior)",
                    "Trash removal"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/fan-cleaning.mp4",
          title: 'Deep Cleaning',
          description:'Looking for a thorough, top-to-bottom clean? Our deep cleaning services are ideal for homes and businesses in Naples, Fort Myers, Bonita Springs, and Cape Coral. We tackle built-up dirt, grime, and hidden allergens in hard-to-reach areas. Perfect for seasonal cleanups, post-renovation, or when you just want a fresh start!',
          items:[  "Everything in Residential Cleaning, plus:",
                    "Baseboards scrubbed, not just dusted",
                    "Hand-washing of cabinet fronts and door frames",
                    "Deep cleaning of tile grout and behind appliances (as accessible)",
                    "Ceiling fans, vents, and light fixtures cleaned",
                    "Extra attention to buildup in kitchens and bathrooms",
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
        <section className='landing-hero-wrapper'>
            <div className="landing-hero">
                <div className="contact-mini-container">
                    <h1 className='section-title'><span> Cleaning Service</span> for Homes and Businesses in SWFL</h1>
                        <p>Let us handle the mess — you focus on what matters.
                            Reach out using the contact form below.</p>
                </div>

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
                        By submitting this form, you agree to our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
                    </p>

                    <div className="button-group">
                        <a href="/painting/#contact"><button className="button"> Get Free Quote </button></a>
                        <p>No-cost estimates, no obligation.</p>
                    </div>
                </div>
            </div>

            <video muted autoPlay loop playsInline className='video-desktop'>
                <source src={hero} />  
            </video>
        </section>
        
        <div className="list-container-wrapper">
            <div className="list-container card">
                <h1 className='section-subtitle'>What We Do</h1>
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
                <div className="faq-title">
                    <h1 className='section-subtitle'>Frequently Asked Question</h1>
                    <p> Quick answers to questions you may have</p>
                </div>
                <div className="questions-wrapper">
                    <div className="questions-container">
                        <div className="questions-title accordion" onClick={toggleAccordion} >
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
                        <div className="questions-title accordion" onClick={toggleAccordion}>
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
                        <div className="questions-title accordion" onClick={toggleAccordion}>
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
                        <div className="questions-title accordion" onClick={toggleAccordion}>
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
                        <div className="questions-title accordion" onClick={toggleAccordion}>
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
