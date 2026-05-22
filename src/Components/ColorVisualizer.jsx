import '../Styling/ColorVisualizer.css'; // Ensure you have this CSS file for styling
import color1 from '../Assets/colors/repose-gray.png';
import base from '../Assets/colors/base.jpeg';
import ReactCompareImage from 'react-compare-image';
import { FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ColorVisualizer = () => {
  return (
    <section className="color-visualizer-section">
      <motion.div
        className="color-visualizer-container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.4 }}
      >
        {/* LEFT CONTENT */}
        <div className="color-visualizer-copy">
          <span>Color Visualization</span>

          <h2>
            See Your Paint
            <br />
            Colors Before
            <br />
            We Paint
          </h2>

          <p>
            Take the guesswork out of choosing paint colors. Our color visualization
            service helps homeowners preview different paint colors on their home
            before the project begins.
          </p>

          <p>
            Whether you're repainting your interior, updating your exterior, or
            testing bold accent colors, we help you make confident decisions with
            realistic previews.
          </p>

          <div className="color-visualizer-actions">
            <a href="#contact" className="color-visualizer-btn">
              Get Color Help
            </a>

            <div className="visualizer-note">
              <FaCheck />
              <p>Professional guidance included with your estimate.</p>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="color-visualizer-card">
          <div className="visualizer-badge">
            Before & After Preview
          </div>

          <ReactCompareImage
            leftImage={base}
            rightImage={color1}
            sliderPositionPercentage={0.5}
            handleSize={46}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default ColorVisualizer;

