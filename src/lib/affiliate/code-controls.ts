/** Validated input for modifying existing discount codes.
 * Monetary and referral attribution decisions never trust client prices.
 */
export type DiscountCodeRow={
 id:string;code:string;affiliate_id:string;discount_bps:number;commission_bps:number;
 valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;
 active:boolean;version:number
};
export const codePattern=/^[A-Z0-9][A-Z0-9_-]{3,31}$/;
export function validPercent(value:string):number{
 if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(value))throw new Error("Invalid percentage");
 const basis=Math.round(Number(value)*100);
 if(basis<0||basis>10000)throw new Error("Percentage outside 0-100");
 return basis;
}
export function validISODate(value:string):string{
 if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value))throw new Error("Invalid date");
 const dt=new Date(value+"T00:00:00Z");
 if(!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==value)throw new Error("Invalid calendar date");
 return value;
}
export function validUsageLimit(value:string,used:number):number|null{
 if(value==="")return null;
 if(!/^[1-9]\d{0,8}$/.test(value))throw new Error("Invalid usage limit");
 const limit=Number(value);
 if(!Number.isSafeInteger(limit)||limit<used)throw new Error("Limit cannot be below historical redemptions");
 return limit;
}
export function describeCodeChange(action:string,input:Record<string,string>,previous:DiscountCodeRow,hasOrders:boolean,allowRedeem:boolean,nowISO:string):Partial<DiscountCodeRow>{
 const fields:Partial<DiscountCodeRow>={};
 switch(action){
  case "pause_code":
   fields.active=false;
   break;
  case "resume_code":
   if(!allowRedeem)throw new Error("Checkout coupon validation not enabled");
   if(previous.valid_until<nowISO)throw new Error("Code expired; renew it first");
   if(previous.valid_from>nowISO)throw new Error("Code not started");
   if(previous.usage_limit!==null&&previous.redemption_count>=previous.usage_limit)throw new Error("Code fully redeemed");
   fields.active=true;
   break;
  case "renew_code":{
   const until=validISODate(input.valid_until||"");
   if(until<previous.valid_until || until<nowISO)throw new Error("Renewal cannot shorten an expiry");
   fields.valid_until=until;
   break;
  }
  case "edit_code":{
   const code=(input.code||"").trim().toUpperCase();
   if(!codePattern.test(code))throw new Error("Invalid code");
   if(code!==previous.code&&(previous.redemption_count>0||hasOrders))throw new Error("A used code cannot be renamed");
   const from=validISODate(input.valid_from||"");
   const until=validISODate(input.valid_until||"");
   if(until<from)throw new Error("Expiry before start");
   if(previous.redemption_count>0 && from!==previous.valid_from)throw new Error("Start cannot change after redemption");
   fields.code=code;
   fields.valid_from=from;
   fields.valid_until=until;
   fields.discount_bps=validPercent(input.discount||"");
   fields.commission_bps=validPercent(input.commission||"");
   fields.usage_limit=validUsageLimit(input.usage_limit??"",previous.redemption_count);
   // Reapproval required for any adjustment of active promotion terms.
   fields.active=false;
   break;
  }
  default:throw new Error("Unknown code action");
 }
 return fields;
}
