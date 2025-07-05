import React from 'react'
import { ReviewsWidget } from '../Components/ReviewsWidget'
import '../Styling/Reviews.css'

export const Reviews = () => {
  return (
    <section className='review-page' id="reviews">
      <div className="review-content">

        <div className='sub-heading'>
            <h1>What our <span>customers</span> say</h1>
            <p>Don't just take our word for it — hear it from our customers.</p>
        </div>
        <div className="widget-container">
            <ReviewsWidget/>
        </div>
      </div>
    </section>
  )
}
