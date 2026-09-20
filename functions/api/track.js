/* Cloudflare Pages Function: /api/track
   Server-side forwarding for consented first-party events.
   Secrets must be configured in Cloudflare Pages environment variables. */
const META_STD={whatsapp_click:"Lead",phone_click:"Contact",email_click:"Contact"};
const ALLOWED=new Set(["whatsapp_click","phone_click","email_click","language_switch","faq_open","scroll_25","scroll_50","scroll_75","scroll_90","scroll_top"]);
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
function safeUrl(value){
  try{const u=new URL(String(value||""));return u.protocol==="https:"&&u.hostname==="phuketvisaservice.com"?u.href:"https://phuketvisaservice.com/"}catch{return "https://phuketvisaservice.com/"}
}
function gaClientId(cookie){
  if(!cookie)return String(Date.now())+"."+Math.floor(Math.random()*1e9);
  const p=String(cookie).split(".");return p.length>=4?p.slice(-2).join("."):String(cookie).slice(0,128);
}
export async function onRequestPost({request,env}){
  const len=Number(request.headers.get("Content-Length")||0);
  if(len>16384)return json({ok:false,error:"payload-too-large"},413);
  const origin=request.headers.get("Origin");
  if(origin&&origin!=="https://phuketvisaservice.com")return json({ok:false,error:"origin-not-allowed"},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:"bad-json"},400)}
  const eventName=String(body?.event_name||"");
  if(!ALLOWED.has(eventName))return json({ok:false,error:"event-not-allowed"},400);
  const consent=body?.consent||{};
  if(!consent.analytics&&!consent.marketing)return json({ok:true,skipped:"no-consent"});
  const eventId=String(body?.event_id||crypto.randomUUID()).slice(0,128);
  const sourceUrl=safeUrl(body?.event_source_url);
  const ip=request.headers.get("CF-Connecting-IP")||"";
  const ua=(request.headers.get("User-Agent")||"").slice(0,512);
  const cleanData={};
  if(body?.data&&typeof body.data==="object"){
    for(const [k,v] of Object.entries(body.data).slice(0,20)){
      if(/^[a-zA-Z0-9_]{1,40}$/.test(k)&&["string","number","boolean"].includes(typeof v))cleanData[k]=typeof v==="string"?v.slice(0,200):v;
    }
  }
  const results={};
  if(consent.marketing&&env.META_PIXEL_ID&&env.META_CAPI_TOKEN){
    const payload={data:[{event_name:META_STD[eventName]||eventName,event_time:Math.floor(Date.now()/1000),event_id:eventId,action_source:"website",event_source_url:sourceUrl,user_data:{client_ip_address:ip,client_user_agent:ua,...(body.fbp?{fbp:String(body.fbp).slice(0,200)}:{}),...(body.fbc?{fbc:String(body.fbc).slice(0,200)}:{})},custom_data:cleanData}]};
    if(env.META_TEST_CODE)payload.test_event_code=env.META_TEST_CODE;
    try{const r=await fetch("https://graph.facebook.com/v19.0/"+encodeURIComponent(env.META_PIXEL_ID)+"/events?access_token="+encodeURIComponent(env.META_CAPI_TOKEN),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});results.meta=r.status}catch{results.meta="error"}
  }
  if(consent.analytics&&env.GA4_MEASUREMENT_ID&&env.GA4_API_SECRET){
    const mp={client_id:gaClientId(body.ga_cookie),events:[{name:eventName,params:{...cleanData,engagement_time_msec:1,event_id:eventId,page_location:sourceUrl}}]};
    try{const r=await fetch("https://www.google-analytics.com/mp/collect?measurement_id="+encodeURIComponent(env.GA4_MEASUREMENT_ID)+"&api_secret="+encodeURIComponent(env.GA4_API_SECRET),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mp)});results.ga4=r.status}catch{results.ga4="error"}
  }
  return json({ok:true,event_id:eventId,results});
}
export async function onRequestGet(){return json({ok:true,service:"track",method:"POST only"});}
