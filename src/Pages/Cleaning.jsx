import React from 'react'
import '../Styling/Painting.css'
import { IoHomeOutline } from "react-icons/io5";
import { MdCleaningServices } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaPeopleCarryBox } from "react-icons/fa6";

import hero from '../Assets/cleaning.MP4'

export const Cleaning = () => {
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
        <div className='landing-hero'>
            <div className="column">
            <video muted autoPlay loop playsInline className='overlay-video'>
                    <source src={hero} />  
                </video>
                <div className="contact-mini-container cartoon-box">
                    <h1 className='section-title'>Trusted <span> Cleaning Service</span> for Homes and Businesses in SWFL</h1>
                        <h3>Let us handle the mess — you focus on what matters.
                            Reach out using the contact form below.</h3>
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
                    <source src={hero} />  
                </video>
            </div>
        </div>

        <div className="list-container card">
            <h1 className='section-subtitle'> An overview of our Cleaning Services:</h1>
            <div className="painting-list">
                <div className="item-card cartoon-box">
                    <IoHomeOutline size="100" />
                    <h2> Residential Cleaning </h2>
                    <p> Enjoy a tidy and comfortable home with our tailored residential cleaning services. We focus on every detail to maintain a clean and inviting living space.
                    </p>
                </div>

                <div className="item-card cartoon-box">
                    <MdCleaningServices size="100"/>
                    <h2> Deep Cleaning </h2>
                    <p> Refresh your space with our thorough deep cleaning services. We tackle every corner to eliminate dirt, dust, and grime for a spotless home or workplace.
                    </p>
                </div>
                <div className="item-card cartoon-box">
                    <FaPeopleCarryBox size="100" />
                    <h2>Move-in/Move Out</h2>
                    <p>Ensure a spotless transition with our detailed move-in and move-out cleaning. We’ll leave your space pristine and ready for its next chapter.
                    </p>
                </div>
                <div className="item-card cartoon-box">
                    <HiOutlineOfficeBuilding  size="100"/>
                    <h2> Commercial Cleaning </h2>
                    <p>Keep your business shining with our reliable commercial cleaning services. From offices to retail spaces, we ensure a clean and professional environment.
                    </p>
                </div>

            </div>

            <div className="color-consultation">
                <h2> Ready to Experience a Cleaner Space? </h2>
                <p> Let us transform your home or business with our professional cleaning services tailored to your needs. Contact us today for a free quote and take the first step toward a spotless environment! </p>
                <a href="tel:+12397773713"><button> Call Now </button></a>
            </div>
        </div>

        <div className="card faq">
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
        <Contact/>
    </section>
  )
}
