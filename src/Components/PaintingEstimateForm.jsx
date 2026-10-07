import React, { useRef, useState } from 'react';
const empty = { name: '', phone: '', zip: '', projectType: '', email: '', message: '', company: '' };
export default function PaintingEstimateForm() {
 const [values, setValues] = useState(empty), [busy,setBusy] = useState(false), [status,setStatus] = useState(null);
 const pending = useRef(false);
 const change = e => setValues(v => ({...v,[e.target.name]:e.target.value}));
 async function submit(e) {
  e.preventDefault(); if(pending.current) return;
  pending.current=true;setBusy(true);setStatus(null);
  try {
   const response=await fetch('/.netlify/functions/send-contact-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,source:'painting_landing',service:'painting'})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok || !data.ok)throw Error(data.error || 'We could not send your request. Please try again or call (239) 777-3713.');
   setValues(empty);setStatus({type:'success',text:'Your estimate request was sent. We’ll contact you within 24 hours to discuss your project and arrange the next step.'});
   try { window.gtag?.('event','generate_lead',{form_name:'painting_estimate',service:'painting'}); } catch { /* Tracking must not affect a successful request. */ }
  } catch(error){setStatus({type:'error',text:error.message});}
  finally { pending.current=false;setBusy(false); }
 }
 return <form className="painting-estimate-form" onSubmit={submit} aria-labelledby="painting-form-title">
  <span className="painting-eyebrow">Free · No obligation</span><h2 id="painting-form-title">Let’s talk about your project</h2>
  <p>Leave a few details. We’ll contact you within 24 hours to discuss your project and arrange an estimate.</p>
  <fieldset disabled={busy}>
   <div className="painting-form-grid">
    <label htmlFor="painting-name">Name<input id="painting-name" name="name" autoComplete="name" required maxLength={120} value={values.name} onChange={change}/></label>
    <label htmlFor="painting-phone">Phone<input id="painting-phone" name="phone" type="tel" autoComplete="tel" required pattern="[+()0-9 .-]{7,25}" title="Enter a phone number" value={values.phone} onChange={change}/></label>
    <label htmlFor="painting-zip">Project ZIP code<input id="painting-zip" name="zip" autoComplete="postal-code" inputMode="numeric" required pattern="[0-9]{5}" maxLength={5} value={values.zip} onChange={change}/></label>
    <label htmlFor="painting-type">What needs painting?<select id="painting-type" name="projectType" required value={values.projectType} onChange={change}><option value="">Choose one</option><option value="interior">Interior</option><option value="exterior">Exterior</option><option value="both">Interior and exterior</option><option value="other">Other / not sure</option></select></label>
   </div>
   <details className="painting-extra"><summary>Add email or project details (optional)</summary><label htmlFor="painting-email">Email (optional)<input id="painting-email" type="email" name="email" autoComplete="email" maxLength={254} value={values.email} onChange={change}/></label><label htmlFor="painting-message">Project details (optional)<textarea id="painting-message" name="message" rows={3} maxLength={3000} value={values.message} onChange={change}/></label></details>
   <div hidden aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={change}/></label></div>
   <button type="submit">{busy?'Sending…':'Get My Free Painting Estimate'}</button>
  </fieldset>
  {status && <p className={'painting-form-status '+status.type} role={status.type==='error'?'alert':'status'}>{status.text}</p>}
  <p className="painting-form-privacy">By submitting, you agree to our <a href="/privacy">Privacy Policy</a>. Prefer to talk? <a href="tel:+12397773713">(239) 777-3713</a></p>
 </form>;
}
