import './App.css';
import { Painting } from './Pages/Painting';
import { Drywall } from './Pages/Drywall';
import { Home } from './Pages/Home';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { Navigation } from './Components/Navigation';
import { Footer } from './Components/Footer';
import { Cleaning } from './Pages/Cleaning';
import { NotFound } from './Pages/NotFound';
import { Privacy } from './Pages/Privacy';
import ScrollToTop from './Components/ScrollToTop';
import ServiceArea from './Pages/ServiceArea';
import { PaintCalculator } from './Pages/PaintCalculator';
import { Login } from './Pages/Login';
import netlifyIdentity from "netlify-identity-widget";

function App() {
netlifyIdentity.init();

  return (
    <div className='background-wrapper'>
      <Router>
      <ScrollToTop/>
        <Navigation/>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/painting" element={<Painting />}/>
          <Route path='/drywall' element={<Drywall/>}/>
          <Route path='/cleaning' element={<Cleaning />} />
          <Route path='/privacy' element={<Privacy/>}/>
          <Route path='/service-area/:citySlug' element={<ServiceArea/>} />
          <Route path='/estimator' element={<PaintCalculator/>} />
          <Route path='/login' element={<Login />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
        <Footer/>
        </Router>
    </div>
  );
}

export default App;
