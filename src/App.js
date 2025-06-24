import './App.css';
import { Painting } from './Pages/Painting';
import { Home } from './Pages/Home';
import { BrowserRouter as Router, Routes, Route} from 'react-router';
import { Navigation } from './Components/Navigation';
import { Footer } from './Components/Footer';
import { Cleaning } from './Pages/Cleaning';
import { NotFound } from './Pages/NotFound';
import { Hamburger } from './Components/Hamburger';
import { Privacy } from './Pages/Privacy';

import logo from './Assets/logo/brushline-logo-white-letters.png';

function App() {
  return (
    <div className='background-wrapper'>
      <Router>
        <Navigation/>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/painting" element={<Painting />}/>
          <Route path='/cleaning' element={<Cleaning />} />
          <Route path='/privacy' element={<Privacy/>}/>
          <Route path='*' element={<NotFound />} />
        </Routes>
        <Footer/>
      </Router>
    </div>
  );
}

export default App;
