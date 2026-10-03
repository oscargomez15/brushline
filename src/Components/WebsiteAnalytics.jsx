import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import netlifyIdentity from 'netlify-identity-widget';
const allowed=path=>/^\/(?:painting|drywall|cleaning|privacy|accessibility|assistant)?$/.test(path)||/^\/service-area\/[a-z0-9-]{1,80}$/.test(path);
const uuid=()=>window.crypto.randomUUID();
export default function WebsiteAnalytics(){
  const {pathname}=useLocation();
  useEffect(()=>{
    if(!allowed(pathname)||netlifyIdentity.currentUser()||navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl||!['brushlineservices.com','www.brushlineservices.com'].includes(window.location.hostname))return;
    let visitor,session,source='Direct';
    try{
      visitor=localStorage.getItem('brushline-visitor');if(!visitor){visitor=uuid();localStorage.setItem('brushline-visitor',visitor);}
      const saved=JSON.parse(sessionStorage.getItem('brushline-visit')||'null');
      session=saved && Date.now()-saved.at<30*60*1000?saved.id:uuid();
      if(saved?.id===session)source=saved.source || 'Direct';
      else if(document.referrer){const url=new URL(document.referrer);if(url.hostname!==window.location.hostname)source=url.hostname;}
      sessionStorage.setItem('brushline-visit',JSON.stringify({id:session,at:Date.now(),source}));
    }catch{return;}
    const device=/ipad|tablet/i.test(navigator.userAgent)?'Tablet':/mobile|android|iphone/i.test(navigator.userAgent)?'Mobile':'Desktop';
    const send=type=>{if(netlifyIdentity.currentUser())return;fetch('/.netlify/functions/track-site-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:uuid(),visitor,session,source,device,path:pathname,type}),keepalive:true}).catch(()=>{});};
    // Defer so React's development effect replay doesn't count twice.
    const timer=setTimeout(()=>send('pageview'),0);
    const recorded=new Set();
    const once=type=>{if(!recorded.has(type)){recorded.add(type);send(type);}};
    const scroll=()=>{const height=document.documentElement.scrollHeight-window.innerHeight;if(height>0&&window.scrollY/height>=.75)once('scroll');};
    const click=event=>{const link=event.target.closest?.('a');if(!link)return;const href=link.getAttribute('href')||'';if(href.startsWith('tel:'))once('phone');else if(href.startsWith('mailto:'))once('email');else if(href==='/assistant'&&pathname!=='/assistant')once('assistant');};
    window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('click',click);
    return()=>{clearTimeout(timer);window.removeEventListener('scroll',scroll);document.removeEventListener('click',click);};
  },[pathname]);
  return null;
}
