import { SUMMARY_PROMPT } from './prompt.js';
const MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
export default {
  async fetch(request, env) {
    if (!env.EVALUATION_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.EVALUATION_TOKEN}`) return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const text=await request.text();if(text.length>5000)return new Response('Payload too large',{status:413});
    let input;try{input=JSON.parse(text)}catch{return new Response('Invalid JSON',{status:400})}
    if(input.synthetic!==true||!/^DEMO-(0[1-9]|1[0-9]|20)$/.test(input.profile||'')||!input.facts)return new Response('Only synthetic evaluation profiles are supported',{status:422});
    const startedAt=new Date().toISOString();
    const parameters={messages:[{role:'system',content:SUMMARY_PROMPT},{role:'user',content:JSON.stringify({facts:input.facts})+'\n/no_think'}],temperature:0.1,seed:2718,max_tokens:900,stream:false,response_format:{type:'json_object'}};
    try {
      const output=await env.AI.run(MODEL,parameters);
      return Response.json({model:MODEL,started_at:startedAt,completed_at:new Date().toISOString(),parameters:{temperature:parameters.temperature,seed:parameters.seed,max_tokens:parameters.max_tokens,response_format:parameters.response_format},output});
    } catch(error) {return Response.json({model:MODEL,error:String(error),started_at:startedAt}, {status:502})}
  },
};
