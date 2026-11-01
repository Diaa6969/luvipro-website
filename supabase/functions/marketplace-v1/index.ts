import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {handleMarketplace} from './handler.ts';
const timedFetch: typeof fetch = (input, init) => fetch(input, {...init, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(20000)])});
Deno.serve(req => handleMarketplace(req, {
 url: Deno.env.get('SUPABASE_URL'), secret: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anon: Deno.env.get('SUPABASE_ANON_KEY'),
 createClient: (url,key,options) => createClient(url,key,{...options,global:{...options.global,fetch:timedFetch}}),
}));
