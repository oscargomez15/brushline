import emailjs from 'emailjs-com'
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import '../Styling/Painting.css'
import { MdKeyboardArrowDown } from "react-icons/md";
import { Contact } from './Contact'
import { TbSquareRoundedCheckFilled } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import beforeCommercial from '../Assets/before-commercial.jpg'
import afterCommercial from '../Assets/after-commercial.jpg'

import afterJonathan from '../Assets/after-jonathan.jpg'
import beforeJonathan from '../Assets/before-jonathan.jpg'

import afterCape from '../Assets/cape-after.jpeg'
import beforeCape from '../Assets/cape-before.jpeg'

import beforeBonita from '../Assets/before-paty.jpg'
import afterBonita from '../Assets/after-paty.jpg'

import beforeMike from '../Assets/mike-before.jpg'
import afterMike from '../Assets/mike-after.jpg'

import { PaintingCard } from '../Components/PaintingCard';
import { Helmet } from 'react-helmet';
import { FaCheck } from 'react-icons/fa';

export const Drywall = () => {
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
    const services = [
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/drywall-repair.mp4",
          title: 'Drywall Repair',
          description:' From small holes to major water or fire damage, we specialize in fast, clean, and durable drywall repairs. Our services restore your walls and ceilings to like-new condition with minimal disruption. We address everything from nail pops and cracks to sagging ceilings and patch jobs of all sizes',
          items: [  "Hole and crack repair (nail pops, dents, etc.)",
                    "Water damage repair",
                    "Mold damage repair",
                    "Smoke/fire damage drywall replacement",
                    "Ceiling crack or sagging repair",
                    "Drywall patching"]
        },
        {
          src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/drywall-install.mp4",
          title: 'New Drywall Installation',
          description: "Our expert team provides professional drywall installation for both residential and commercial properties. Whether you're building new, or adding a room, we deliver smooth, precise drywall installation tailored to your space. We also offer soundproof and moisture-resistant drywall solutions to meet specialized needs.",
          items: ["New drywall installation (residential/commercial)",
                "Drywall for remodels and home additions",
                "Ceiling drywall installation",
                "Garage and basement drywall installation",
                "Soundproof drywall installation",
                "Moisture-resistant (green board) drywall installation"]
        },{
        src: "https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/drywall-finish.mp4",
          title: 'Drywall Finishing & Texturing',
          description: 'We deliver flawless drywall finishing, taping and mudding to sanding and custom textures. Choose from orange peel, knockdown, or a smooth finish to match your style. We also remove outdated popcorn ceilings and replace them with a fresh, modern look.',
          items: [  "Tape and mud (taping, joint compound)",
                    "Sanding and smoothing",
                    "Level 1–4 drywall finishes",
                    "Orange peel texture",
                    "Knockdown texture",
                    "Popcorn ceiling removal and retexturing"]
          }
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

        <Helmet>
            <title>Drywall Services from Naples to Fort Myers | Professional, Affordable and 5 Star Rated </title>
            <meta name="description" content="Brushline Services is a professional drywall services who provides residential and commercial services in Cape Coral, Fort Myers, Bonita Springs, Estero, and Naples. Get a free quote today!" />
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
                    <h1 className='section-title'> <span>Drywall Services</span> from Naples to Fort Myers</h1>
                        <p>We specialize in seamless drywall finishes, patchwork, texturing, and full-service drywall solutions for residential and commercial properties. Serving Naples, Bonita Springs, Fort Myers and Cape Coral. Our experienced team delivers high-quality results—on time and on budget. Contact us today for a free estimate!</p>
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
                        By submitting this form, you agree to our <Link to="/privacy" target="_blank">Privacy Policy</Link>.
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


            <video muted autoPlay loop playsInline className='video-desktop'>
                <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/drywall-hero.mp4" />  
            </video>
            </div>
        </section>

        <section className='landing-hero-mb'>
            <div className="column">
                <div className="contact-mini-container">
                    <h1 className='section-title'><span>Drywall Repair and Installation Services</span> from Naples to Fort Myers</h1>
<p>We specialize in seamless drywall finishes, patchwork, texturing, and full-service drywall solutions for residential and commercial properties. Our experienced team delivers high-quality results—on time and on budget. Contact us today!</p>                        
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
                    <source src="https://oscargomez-webportfolio.s3.us-east-1.amazonaws.com/drywall-hero.mp4" />  
                </video>
            </div>
        </section>
        
        <div className="list-container-wrapper">
            <motion.section className="list-container card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.2 }}>

                <div className="sub-heading">
                    <h1><span>Drywall Services</span> we offer</h1>
                    <p>Whether you're refreshing your home or updating a commercial property, we’ve got every surface covered.</p>
                </div>
                <div className="painting-list">
                    {services.map((service, index) => (
                        <PaintingCard key={index} {...service}/>
                    ))}
                </div>
            </motion.section>
        </div>

        {/* <div className="paint-jobs-wrapper">
            <motion.section className="card paint-jobs"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true, amount: 0.5 }}>
                <div className="sub-heading paint-jobs-title">
                    <h1 className='section-subtitle'> Our <span>Drywall Jobs</span></h1>
                    <p>Browse real before-and-after photos of homes and businesses we've transformed throughout Lee and Collier County</p>
                    <SwiperGallery/>
                </div>
            </motion.section>
        </div> */}

        <div className="cta-wrapper">
            <motion.section className="card cta-card"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.5 }}>
                <h1 className='section-subtitle'>Restore Your Walls – Contact Us Now</h1>
                        <div className="cta-button-group">
                            <a href="tel:2397773713"><button className="button"> CALL NOW </button></a>
                            <p>OR</p>
                            <a href="#contact"><button className="button"> CONTACT US </button></a>
                        </div>

            </motion.section>
        </div>

        <div className="faq-wrapper">
        <motion.section className="card faq"
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
        </div>
        <Contact/>
    </div>
  )
}
