const { getStore } = require('@netlify/blobs');
const { createHash } = require('crypto');
const { dateKey, publicPath } = require('./_metrics');
const json = (statusCode,body) => ({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  if (/bot|crawler|spider|headless|preview/i.test(event.headers?.['user-agent'] || '')) return json(202,{ok:true,ignored:true});
  if ((event.body || '').length > 2048) return json(413,{error:'Event too large'});
  let body; try { body=JSON.parse(event.body || '{}'); } catch { return json(400,{error:'Invalid JSON'}); }
  const id = /^[a-zA-Z0-9-]{16,80}$/;
  if (!publicPath(body.path) || !['pageview','scroll','phone','email','assistant'].includes(body.type) || !id.test(body.visitor || '') || !id.test(body.session || '') || !id.test(body.eventId || '')) return json(400,{error:'Invalid event'});
  const origin=event.headers?.origin;
  const allowed=[process.env.URL,process.env.DEPLOY_PRIME_URL,'https://brushlineservices.com','https://www.brushlineservices.com'].filter(Boolean);
  if (!origin || !allowed.some(url=>{try{return new URL(url).origin===origin;}catch{return false;}})) return json(403,{error:'Invalid origin'});
  try {
    const siteID=process.env.NETLIFY_SITE_ID,token=process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(503,{error:'Tracking unavailable'});
    let source='Direct';
    if (typeof body.source==='string' && body.source!=='Direct' && body.source.length<=150) {
      try { const host=new URL('https://'+body.source).hostname; if (/^[a-z0-9.-]+$/.test(host)) source=host; } catch {}
    }
    const hash=value=>createHash('sha256').update(siteID+value).digest('hex');
    const at=new Date().toISOString(), day=dateKey(at);
    await getStore('site_metrics',{siteID,token}).setJSON(day+'/'+body.eventId,{day,at,type:body.type,path:body.path,visitor:hash(body.visitor),session:hash(body.session),device:['Mobile','Tablet','Desktop'].includes(body.device)?body.device:'Desktop',source});
    return json(202,{ok:true});
  } catch(error) { console.error('Tracking failed',error.message); return json(503,{error:'Tracking unavailable'}); }
};
