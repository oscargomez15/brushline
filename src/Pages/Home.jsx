import { Hero } from './Hero'
import { Services } from './Services'
import { OurWork } from './OurWork'
import { WhyUs } from '../Components/WhyUs'
import { Reviews } from './Reviews'
import { Contact } from './Contact'
import { SignatureDivider } from '../Components/SignatureDivider'
import { ServiceAreaSection } from './ServiceAreaSection'
import { Helmet } from 'react-helmet'

export const Home = () => {
  return (
    <div className='home-page'>
      <Helmet>
    <script>
    {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-5QGWXQPK');`}
    </script>

      <script>{`gtag('config', 'AW-11511949240/WVoxCLH_9fYaELjPqfEq', {
        'phone_conversion_number': '(239)777-3713'
      });`}
      </script>     
    </Helmet>
        <Hero/>
      <div className="home-wrapper page">
        <Services/>
        <SignatureDivider/>
        <ServiceAreaSection/>
        <SignatureDivider/>
        <div className="reviews-paint">
          <Reviews/>
        </div>
        <SignatureDivider/>
        <WhyUs/>
        <SignatureDivider/>
        <OurWork/>
        <SignatureDivider/>
        <Contact/>
      </div>
    </div>
  )
}
