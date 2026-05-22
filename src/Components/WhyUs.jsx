import React from 'react';
import '../Styling/WhyUs.css';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaComments,
  FaLayerGroup,
  FaPaintRoller,
} from 'react-icons/fa';

export const WhyUs = () => {
  const reasons = [
    {
      icon: <FaCheckCircle />,
      title: 'Clean Job Sites, Always',
      description:
        'We respect your home and workspace. Expect spotless job sites, organized tools, and full cleanup after every project.',
    },
    {
      icon: <FaComments />,
      title: 'Customer-First Communication',
      description:
        'Clear communication, responsiveness, and professionalism are at the center of every project we take on.',
    },
    {
      icon: <FaLayerGroup />,
      title: 'All-in-One Convenience',
      description:
        'From painting and drywall to handyman services and cleaning, we help simplify your project with one trusted team.',
    },
    {
      icon: <FaPaintRoller />,
      title: 'Attention to Detail',
      description:
        'We focus on the details that matter — sharp lines, smooth finishes, and craftsmanship built to last.',
    },
  ];

  return (
    <section className="whyus-section">
      <div className="whyus-container">
        <motion.div
          className="whyus-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span>Why Choose Us</span>

          <h2>Built Around Quality, Communication & Reliability</h2>

          <p>
            Brushline Services is committed to delivering high-quality work,
            dependable communication, and a smooth experience from start to finish.
          </p>
        </motion.div>

        <div className="whyus-grid">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              className="whyus-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.45,
                delay: index * 0.12,
              }}
            >
              <div className="whyus-icon">
                {reason.icon}
              </div>

              <div className="whyus-card-content">
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};