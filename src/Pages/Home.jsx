import { Hero } from './Hero'
import { Services } from './Services'
import { OurWork } from './OurWork'
import { WhyUs } from '../Components/WhyUs'
import { Reviews } from './Reviews'
import { Contact } from './Contact'

export const Home = () => {
  const CoolLineDivider = () => {
    return (
      <div className="cool-divider-container">
        <div className="cool-divider-line" />
      </div>
    );
  };
  return (
    <div className='home-page'>
        <Hero/>
      <div className="home-wrapper page">
        <CoolLineDivider/>
        <Services/>
        <CoolLineDivider/>
        <OurWork/>
        <WhyUs/>
        <Reviews/>
        <CoolLineDivider/>
        <Contact/>
      </div>
    </div>
  )
}
