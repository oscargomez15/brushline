import React, { useState, useEffect } from 'react'
import emailjs from 'emailjs-com'
import '../Styling/Contact.css'
import fullBodyMascot from '../Assets/Transparent-03.png'
import {AnimatePresence, motion } from 'framer-motion'
import {TbSquareRoundedCheckFilled} from 'react-icons/tb'
export const Contact = () => {
    const defaultFormValues = {
        name:'',
        address:'',
        email:'',
        phone:'',
        service:'',
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
            service:form.service,
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
    
    useEffect(() => {
    if (showModal) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }

    // Clean up just in case
    return () => {
        document.body.classList.remove('no-scroll');
    };
    }, [showModal]);

  return (
    <section className='contact-page' id='contact'>
        <motion.div className="contact-form-container cartoon-box"
        initial={{ x: -100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.5 }}>
            <div className="contact-form">
                <div className="sub-heading">
                    <h1>Contact us and get your <span>free quote</span></h1>
                    <p>Get your free quote by filling the information below and we'll get back to you within 24 hours.</p>
                </div>
                <form action="Submit">
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="name">Name*</label>
                            <input type="text" name='name' id='name' value={form.name} onChange={handleChange} placeholder='Type Name' required/>
                        </div>

                        <div className="form-field">
                            <label htmlFor="phone">Phone*</label>
                            <input type="text" name='phone' id='phone' value={form.phone} onChange={handleChange} placeholder='Type your phone number' required/>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="email">Email*</label>
                            <input type="email" name='email' id='email' value={form.email} onChange={handleChange} placeholder='Type your Email' required/>
                        </div>

                        <div className="form-field">
                            <label htmlFor="address">Address*</label>
                            <input type="text" name='address' id='address' value={form.address} onChange={handleChange} placeholder='Type Address' required/>
                        </div>
                    </div>

                    <div className="form-field full-width">
                        <label htmlFor="service">Type of Service*</label>
                        <input type="text" name='service' id='service' value={form.service} onChange={handleChange} placeholder='Interior Painting' required/>
                    </div>

                    <div className="form-field full-width">
                        <label htmlFor="message">Message (Optional)</label>
                        <textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder='Briefly describe your project' ></textarea>
                        <p className="privacy-notice"> By submitting this form, you agree to our <a href="/privacy" target="_blank">Privacy Policy</a>.</p>
                    </div>

                    <button className='button' type="submit" onClick={handleSubmit} disabled={!isFormValid}> Send Message </button>

                </form>
            </div>
            <img src={fullBodyMascot} alt="full-body-mascot" className='mascot-contact'/>
        </motion.div>

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
    </section>
  )
}
