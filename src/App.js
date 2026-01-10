import './App.css';
import { useEffect } from "react";
import { Painting } from './Pages/Painting';
import { Drywall } from './Pages/Drywall';
import { Home } from './Pages/Home';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
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
import { useNavigate } from "react-router-dom";
import RequireAuth from './Components/RequireAuth';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    netlifyIdentity.init();

    const hash = window.location.hash || "";

    if (hash.includes("invite_token")) {
      netlifyIdentity.open("signup");
    }

    // (optional) also handle password recovery links
    if (hash.includes("recovery_token")) {
      netlifyIdentity.open("login");
    }

    const onLogout = () => {
      navigate("/", { replace: true });
    };

    netlifyIdentity.on("logout", onLogout);
    return () => {
      netlifyIdentity.off("logout", onLogout);
    };

  }, [navigate]);

  return (
    <div className='background-wrapper'>
      <ScrollToTop/>
        <Navigation/>
        <Routes>
          <Route path='/login' element={<Login />} />

          <Route path="/" element={<Home />}/>
          <Route path="/painting" element={<Painting />}/>
          <Route path='/drywall' element={<Drywall/>}/>
          <Route path='/cleaning' element={<Cleaning />} />
          <Route path='/privacy' element={<Privacy/>}/>
          <Route path='/service-area/:citySlug' element={<ServiceArea/>} />
          <Route element={<RequireAuth />}>
            <Route path='/estimator' element={<PaintCalculator/>} />
          </Route>
          <Route path='*' element={<NotFound />} />
        </Routes>
        <Footer/>
    </div>
  );
}

export default App;
