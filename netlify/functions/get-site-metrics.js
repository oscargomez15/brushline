const { getStore } = require('@netlify/blobs');
const { TIMEZONE,dateKey,shiftDay,summarize } = require('./_metrics');
const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler=async(event,context)=>{
  if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
  if(!context?.clientContext?.user)return json(401,{error:'Unauthorized'});
  const days=Number(event.queryStringParameters?.days || 7);
  if(![1,7,30,90].includes(days))return json(400,{error:'Invalid period'});
  try{
    const siteID=process.env.NETLIFY_SITE_ID,token=process.env.NETLIFY_AUTH_TOKEN;
    if(!siteID||!token)return json(503,{error:'Metrics are not configured'});
    const store=getStore('site_metrics',{siteID,token});
    const end=dateKey(),start=shiftDay(end,1-days),previousEnd=shiftDay(start,-1),previousStart=shiftDay(start,-days);
    const keys=[];let truncated=false;
    // Paginated listing avoids silently losing events on busy days. Cap requests for large sites.
    for(let offset=0;offset<days*2&&!truncated;offset+=10){
      await Promise.all(Array.from({length:Math.min(10,days*2-offset)},async(_,i)=>{
        const prefix=shiftDay(end,-offset-i)+'/';
        for await(const page of store.list({prefix,paginate:true})){
          for(const blob of page.blobs || []){if(keys.length>=5000){truncated=true;break;}keys.push(blob.key);}
          if(truncated)break;
        }
      }));
    }
    const events=[];
    for(let i=0;i<keys.length;i+=100){const rows=await Promise.all(keys.slice(i,i+100).map(key=>store.get(key,{type:'json'})));events.push(...rows.filter(Boolean));}
    return json(200,{days,timezone:TIMEZONE,start,end,previousStart,previousEnd,current:summarize(events,start,end),previous:summarize(events,previousStart,previousEnd),truncated,observedSince:events.map(e=>e.day).sort()[0] || null,updatedAt:new Date().toISOString()});
  }catch(error){console.error('Metrics read failed',error.message);return json(500,{error:'Could not load website metrics'});}
};
