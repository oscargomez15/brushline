import { Hero } from './Hero'
import { Services } from './Services'
import { OurWork } from './OurWork'
import { WhyUs } from '../Components/WhyUs'
import { Reviews } from './Reviews'
import { Contact } from './Contact'
import { SignatureDivider } from '../Components/SignatureDivider'
import { ServiceAreaSection } from './ServiceAreaSection'
import { Helmet } from 'react-helmet'
import { SocialVideos } from '../Components/SocialVideos'

export const Home = () => {
  return (
    <div className='home-page'>
      <Helmet>
      <title>Interior & Exterior Painters in Southwest Florida | Brushline</title>
      <meta
        name="description"
        content="Professional interior and exterior painting in Cape Coral, Fort Myers, Estero, Bonita Springs, and Naples. Request a free estimate from Brushline Services."
      />
      <link rel="canonical" href="https://www.brushlineservices.com/" />
      <meta property="og:title" content="Interior & Exterior Painters in Southwest Florida | Brushline" />
      <meta property="og:description" content="Professional residential and commercial painting across Southwest Florida. Get a free estimate from Brushline Services." />
      <meta property="og:url" content="https://www.brushlineservices.com/" />
      <meta property="og:type" content="website" />
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
      <Services />
      <ServiceAreaSection />

      <SignatureDivider />

      <Reviews />
      <WhyUs />

      <SignatureDivider />

      <OurWork />
      <SocialVideos />
      <Contact />
    </div>
    </div>
  )
}
