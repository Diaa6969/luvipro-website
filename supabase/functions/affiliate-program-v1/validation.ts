export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const TERMS_VERSION = "2026-10-29";
export function verifiedProof(bytes: Uint8Array) {
 if(bytes.length < 32 || bytes.length > MAX_PROOF_BYTES) throw new Error("proof_size");
 const starts=(values:number[])=>values.every((value,index)=>bytes[index]===value);
 if(starts([0x25,0x50,0x44,0x46,0x2d]))return {extension:"pdf",mime:"application/pdf"};
 if(starts([137,80,78,71,13,10,26,10]))return {extension:"png",mime:"image/png"};
 if(starts([255,216,255]))return {extension:"jpg",mime:"image/jpeg"};
 throw new Error("proof_type");
}
export function applicationPayload(form: FormData) {
 const field=(key:string,max:number,min=0)=>{
  const value=form.get(key);
  if(typeof value!=="string"||value.trim().length<min||value.trim().length>max||/[\r\n\u0000]/.test(value))throw new Error("invalid_field");
  return value.trim();
 };
 if(form.get("terms_version")!==TERMS_VERSION||form.get("terms_accepted")!=="true"||form.get("privacy_accepted")!=="true")throw new Error("consent_required");
 const country=field("country",2,2);
 if(!["DE","AT","CH","NL","FR","PL"].includes(country))throw new Error("country");
 return {company_name:field("company_name",160,1),contact_name:field("contact_name",160,1),
  business_address:field("business_address",300,5),phone:field("phone",60),
  website:field("website",300),marketing_plan:field("marketing_plan",1600),country,
  terms_version:TERMS_VERSION,terms_accepted:true,privacy_accepted:true};
}
export async function boundedBody(body:ReadableStream<Uint8Array>|null,max:number) {
 if(!body)throw new Error("body_required");
 const reader=body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;
  if(size>max){await reader.cancel();throw new Error("request_too_large");}chunks.push(value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
