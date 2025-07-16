import { Hero } from './Hero'
import { Services } from './Services'
import { OurWork } from './OurWork'
import { WhyUs } from '../Components/WhyUs'
import { Reviews } from './Reviews'
import { Contact } from './Contact'
import { SignatureDivider } from '../Components/SignatureDivider'

export const Home = () => {
  return (
    <div className='home-page'>
        <Hero/>
      <div className="home-wrapper page">
        <Services/>
        <SignatureDivider/>
        <OurWork/>
        <SignatureDivider/>
        <WhyUs/>
        <SignatureDivider/>
        <div className="reviews-paint">
          <Reviews/>
        </div>
        <SignatureDivider/>
        <Contact/>
      </div>
    </div>
  )
}
