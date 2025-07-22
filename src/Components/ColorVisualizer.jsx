import '../Styling/ColorVisualizer.css'; // Ensure you have this CSS file for styling
import color1 from '../Assets/colors/repose-gray.png';
import base from '../Assets/colors/base.jpeg';
import ReactCompareImage from 'react-compare-image';

const ColorVisualizer = () => {
  return (
    <div className="color-visualizer card">
    <div className="sub-heading">
        <h1><span>Color Visualization</span> available</h1>
        <p>Take the guesswork out of choosing the perfect color. 
            Our color visualization service lets you see how different paint colors will
            look on your home—before you commit. Whether you're updating your interior,
            refreshing your exterior, or exploring bold new styles, we’ll help you make confident, informed decisions. <br/>
            Get that extra help you need to visualize your space with our color visualization service.
        </p>
        <a href="#contact"><button className="button"> CONTACT US </button></a>

    </div>
      <div className="compare-wrapper">
        <ReactCompareImage
            leftImage={base}
            rightImage={color1}
            sliderPositionPercentage={0.5}
            alt="Original vs Blue Paint"
        />
      </div>
    </div>
  );
};

export default ColorVisualizer;