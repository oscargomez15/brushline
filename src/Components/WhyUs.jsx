import React from 'react'
import '../Styling/WhyUs.css'

export const WhyUs = () => {
  return (
    <section className='chooseus-wrapper'>
      <div className="chooseus">
        <h1>What makes us <span>different?</span></h1>
        <div className="whyus-reasons">
          <div className="reason">
            <div className="number-container cartoon-box">
              <h2>1</h2>
            </div>
            <div className="reason-text ">
              <h2>Clean Job Sites, Always</h2>
              <p>We respect your space. Expect spotless job sites and full cleanup.</p>
            </div>
          </div>

          <div className="reason">
            <div className="number-container cartoon-box">
              <h2>2</h2>
            </div>
            <div className="reason-text">
              <h2>Customer-First Mentality</h2>
              <p>We listen, we communicate, and we care. Every decision is made with your satisfaction in mind.</p>
            </div>
          </div>

          <div className="reason">
            <div className="number-container cartoon-box">
              <h2>3</h2>
            </div>
            <div className="reason-text">
              <h2>Color Visualization</h2>
              <p>See how your space will look with different colors before we even lift a brush.</p>
            </div>
          </div>

          <div className="reason">
            <div className="number-container cartoon-box">
              <h2>4</h2>
            </div>
            <div className="reason-text">
              <h2>Attention to Detail</h2>
              <p>We treat your home like our own, ensuring every edge, corner, and coat meets the highest standards.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
