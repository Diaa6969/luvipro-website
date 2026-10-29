// Drop-in Affiliate account page for the ORIGINAL FlutterFlow app.
// Do not replace the existing customer or workshop profile or modify users.role.
// Codex: wire navigation, adapt package imports and existing app theme, then test.
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class LuviproAffiliateAccountPage extends StatefulWidget {
 const LuviproAffiliateAccountPage({super.key, this.apiBase='https://luvipro.de'});
 final String apiBase;
 @override State<LuviproAffiliateAccountPage> createState()=>_AffiliateAccountState();
}
class _AffiliateAccountState extends State<LuviproAffiliateAccountPage> {
 final client=Supabase.instance.client;
 bool loading=true;String? error;
 Map<String,dynamic>? partner;
 List<Map<String,dynamic>> codes=[],commissions=[],payouts=[];
 int get pendingCents=>commissions.where((v)=>v['status']=='pending').fold<int>(0,(t,v)=>t+(v['commission_cents'] as num).toInt());
 int get eligibleCents=>commissions.where((v)=>v['status']=='eligible').fold<int>(0,(t,v)=>t+(v['commission_cents'] as num).toInt());
 int get paidCents=>payouts.where((v)=>v['status']=='paid').fold<int>(0,(t,v)=>t+(v['amount_cents'] as num).toInt());
 String euro(int cents)=>'${(cents/100).toStringAsFixed(2)} EUR';
 @override void initState(){super.initState();load();}
 Future<void> load()async{
  setState((){loading=true;error=null;});
  try{
   final session=client.auth.currentSession;
   if(session==null)throw StateError('Bitte melden Sie sich zuerst mit Ihrem bestehenden LUVIPRO-Konto an.');
   // Claim only when applicant email was verified and application approved.
   final link=await http.post(Uri.parse('${widget.apiBase}/api/affiliate/claim'),
      headers:{'Authorization':'Bearer ${session.accessToken}'});
   if(link.statusCode!=200)throw StateError('Kein freigegebenes Gewerbe-Partnerkonto gefunden (HTTP ${link.statusCode}).');
   final rows=await client.from('luvipro_affiliate_applications')
      .select('id,company_name,status,email').eq('owner_uid',session.user.id).eq('status','approved').limit(1);
   if((rows as List).isEmpty)throw StateError('Keine Freigabe vorhanden.');
   partner=Map<String,dynamic>.from(rows.first);
   final id=partner!['id'] as String;
   codes=List<Map<String,dynamic>>.from(await client.from('luvipro_discount_codes')
      .select('code,discount_bps,commission_bps,valid_from,valid_until,active').eq('affiliate_id',id).order('valid_from',ascending:false).limit(200));
   commissions=List<Map<String,dynamic>>.from(await client.from('luvipro_affiliate_commissions')
      .select('status,commission_cents,created_at,verified_paid_at,delivered_at').eq('affiliate_id',id).order('created_at',ascending:false).limit(200));
   payouts=List<Map<String,dynamic>>.from(await client.from('luvipro_affiliate_payouts')
      .select('status,payout_month,amount_cents,paid_at').eq('affiliate_id',id).order('payout_month',ascending:false).limit(200));
  }catch(e){error=e.toString();}
  finally{if(mounted)setState(()=>loading=false);}
 }
 @override Widget build(BuildContext context){
  return Scaffold(appBar:AppBar(title:const Text('LUVIPRO · Mein Affiliate-Konto'),actions:[IconButton(onPressed:loading?null:load,icon:const Icon(Icons.refresh))]),
    body:loading?const Center(child:CircularProgressIndicator()):
      error!=null?Padding(padding:const EdgeInsets.all(24),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(error!),const SizedBox(height:16),FilledButton(onPressed:load,child:const Text('Erneut prüfen'))])):
      ListView(padding:const EdgeInsets.all(16),children:[
       Text('${partner!['company_name']}',style:Theme.of(context).textTheme.headlineSmall),
       const SizedBox(height:8),const Text('Affiliate-Funktion im bestehenden LUVIPRO Kunden-/Werkstattkonto. Keine zusätzliche Anmeldung oder Änderung der ursprünglichen Rolle.'),
       const SizedBox(height:16),
       Wrap(spacing:10,runSpacing:10,children:[
         Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(children:[const Text('Offene Provisionen'),Text(euro(pendingCents),style:Theme.of(context).textTheme.titleLarge)]))),
         Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(children:[const Text('Freigegeben'),Text(euro(eligibleCents),style:Theme.of(context).textTheme.titleLarge)]))),
         Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(children:[const Text('Ausgezahlt'),Text(euro(paidCents),style:Theme.of(context).textTheme.titleLarge)]))),
       ]),
       const SizedBox(height:8),const Text('Rabattcodes und Provisionen werden ausschließlich von LUVIPRO verwaltet.'),
       const SizedBox(height:22),Text('Meine Rabattcodes',style:Theme.of(context).textTheme.titleLarge),
       if(codes.isEmpty)const ListTile(title:Text('Noch keine Rabattcodes zugewiesen.')),
       ...codes.map((c)=>ListTile(title:Text('${c['code']}'),subtitle:Text('Kundenrabatt ${(c['discount_bps'] as num)/100}% · Provision ${(c['commission_bps'] as num)/100}% · bis ${c['valid_until']}'),trailing:Text(c['active']==true?'Aktiv':'Inaktiv'))),
       const Divider(height:35),
       Text('Meine Provisionen',style:Theme.of(context).textTheme.titleLarge),
       if(commissions.isEmpty)const ListTile(title:Text('Keine verifizierten Käufe.')),
       ...commissions.map((c)=>ListTile(title:Text('${((c['commission_cents'] as num)/100).toStringAsFixed(2)} EUR'),subtitle:Text('Status: ${c['status']}'))),
       const Divider(height:35),
       Text('Monatliche Auszahlungen',style:Theme.of(context).textTheme.titleLarge),
       if(payouts.isEmpty)const ListTile(title:Text('Noch keine Abrechnungen.')),
       ...payouts.map((p)=>ListTile(title:Text('${p['payout_month']} – ${((p['amount_cents'] as num)/100).toStringAsFixed(2)} EUR'),subtitle:Text('Status: ${p['status']}'))),
       const SizedBox(height:20),
       const Text('Monatliche Zahlung nur bei nachgewiesenem Kauf, Lieferung und abgelaufener Rückgabefrist. Keine eigenständigen Auszahlungen durch den Nutzer.'),
      ]),
  );
 }
}
