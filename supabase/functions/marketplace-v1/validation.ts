export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function imageType(b:Uint8Array):string|null{
 if(b.length<16)return null;
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n))return 'image/png';
 if(new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
export async function bounded(req:Request,max:number):Promise<Uint8Array>{
 const reader=req.body?.getReader();if(!reader)throw Error('empty');let size=0;const parts:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('too_large');}parts.push(value);}
 const result=new Uint8Array(size);let n=0;for(const p of parts){result.set(p,n);n+=p.length;}return result;
}
export function rpcAction(input:Record<string,unknown>):{name:string;params:Record<string,unknown>;public:boolean}|null{
 const id=input.id;const offset=Number(input.offset??0);
 if(!Number.isInteger(offset)||offset<0||offset>100000)return null;
 if(input.action==='autopilot')return {name:'luvipro_marketplace_autopilot_v1',params:{p_offset:offset},public:false};
 if(input.action==='dealer')return UUID.test(String(id))?{name:'luvipro_marketplace_dealer_v1',params:{p_dealer:id},public:true}:null;
 if(input.action==='report_offer')return UUID.test(String(id))?{name:'luvipro_marketplace_report_offer_v1',params:{p_listing:id},public:true}:null;
 if(input.action==='assist'){
  if(!['search','description'].includes(String(input.kind))||typeof(input.text??'')!=='string'||String(input.text??'').length>1000)return null;
  if(input.kind==='description'&&!UUID.test(String(id)))return null;
  return {name:'luvipro_marketplace_assist_v1',params:{p_action:input.kind,p_input:input.text??'',p_listing:id??null},public:false};
 }
 if(input.action==='read'&&['search','detail','mine','eligible','review','vehicles'].includes(String(input.mode)))
 return {name:'luvipro_marketplace_read_v1',params:{p_mode:input.mode,p_id:id??null,p_filters:input.filters??{},p_offset:offset},public:['search','detail'].includes(String(input.mode))};
 if(input.action==='save')return {name:'luvipro_marketplace_save_v1',params:{p_id:id??null,p_revision:input.revision??null,p_vehicle:input.vehicle_id??null,p_report:input.inspection_id??null,p_data:input.data},public:false};
 if(input.action==='state')return {name:'luvipro_marketplace_state_v1',params:{p_id:id,p_revision:input.revision,p_action:input.transition,p_reason:input.reason??''},public:false};
 if(input.action==='favorite')return {name:'luvipro_marketplace_favorite_v1',params:{p_id:id,p_enabled:input.enabled===true},public:false};
 if(input.action==='favorites')return {name:'luvipro_marketplace_favorites_v1',params:{p_offset:offset},public:false};
 if(input.action==='message')return {name:'luvipro_marketplace_message_v1',params:{p_listing:id,p_body:input.body},public:false};
 if(input.action==='inbox')return {name:'luvipro_marketplace_inbox_v1',params:{p_thread:input.thread??null,p_reply:input.reply??null},public:false};
 if(input.action==='photos')return {name:'luvipro_marketplace_photos_v1',params:{p_listing:id,p_order:input.order??null,p_remove:input.remove??null},public:false};
 if(input.action==='authority')return {name:'luvipro_marketplace_authority_v1',params:{p_seller:input.seller_uid??null,p_vehicle:input.vehicle_id??null,p_report:input.inspection_id??null,p_evidence:input.evidence,p_expires:input.expires??null,p_revoke:input.revoke??null},public:false};
 if(input.action==='admin')return {name:'luvipro_marketplace_admin_v1',params:{p_section:input.section??'listings',p_id:id??null,p_search:input.search??'',p_status:input.status??'',p_offset:offset},public:false};
 if(input.action==='case')return {name:'luvipro_marketplace_case_v1',params:{p_listing:id,p_reason:input.reason},public:false};
 if(input.action==='case_review')return {name:'luvipro_marketplace_case_review_v1',params:{p_case:id,p_status:input.status,p_decision:input.decision,p_thread:input.thread??null},public:false};
 return null;
}
