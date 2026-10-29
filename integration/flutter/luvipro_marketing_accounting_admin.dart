// Integration source for the EXISTING LUVIPRO FlutterFlow project.
// This file is NOT automatically installed in FlutterFlow. Codex must integrate
// the widgets and adapt imports/navigation using the original project editor.
// Requires Flutter, supabase_flutter, http. No service-role key in the app.
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class LuviproBackofficeApi {
  LuviproBackofficeApi(this.client, {this.site = 'https://luvipro.de'});
  final SupabaseClient client;
  final String site;
  Future<void> assertAdmin() async {
    if (client.auth.currentUser == null) throw StateError('Nicht angemeldet');
    final permitted = await client.rpc('is_admin');
    if (permitted != true) throw StateError('Keine Admin-Berechtigung');
  }

  Future<List<Map<String, dynamic>>> applications() async {
    await assertAdmin();
    final result = await client.from('luvipro_affiliate_applications')
        .select('id,company_name,contact_name,email,country,business_address,website,marketing_plan,status,review_notes,created_at')
        .order('created_at', ascending: false).limit(200);
    return List<Map<String,dynamic>>.from(result);
  }

  Future<List<Map<String,dynamic>>> codes() async {
    await assertAdmin();
    final result = await client.from('luvipro_discount_codes')
        .select('id,code,affiliate_id,discount_bps,commission_bps,valid_from,valid_until,redemption_count,usage_limit,active')
        .order('created_at', ascending:false).limit(200);
    return List<Map<String,dynamic>>.from(result);
  }

  Future<List<Map<String,dynamic>>> commissions() async {
    await assertAdmin();
    final result = await client.from('luvipro_affiliate_commissions')
        .select('id,affiliate_id,status,commission_cents,verified_paid_at,delivered_at,return_deadline_at,refunded_at,payout_id')
        .order('created_at', ascending:false).limit(200);
    return List<Map<String,dynamic>>.from(result);
  }

  Future<List<Map<String,dynamic>>> payouts() async {
    await assertAdmin();
    final result = await client.from('luvipro_affiliate_payouts')
        .select('id,affiliate_id,payout_month,status,amount_cents,paid_at,payment_reference')
        .order('created_at',ascending:false).limit(200);
    return List<Map<String,dynamic>>.from(result);
  }

  Future<void> reviewApplication(String id, {required bool approved, String notes = ''}) async {
    await assertAdmin();
    // Status= pending guard prevents double approval; DB RLS authorizes admin.
    final changed = await client.from('luvipro_affiliate_applications').update({
      'status': approved ? 'approved' : 'rejected',
      'review_notes': notes,
      'reviewed_at': DateTime.now().toUtc().toIso8601String(),
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', id).eq('status','pending').select('id');
    if ((changed as List).length != 1) throw StateError('Antrag wurde bereits bearbeitet');
    await client.from('luvipro_affiliate_audit').insert({
      'action':approved ? 'application_approved' : 'application_rejected',
      'entity_id':id,'actor_uid':client.auth.currentUser!.id,'details':{'notes':notes},
    });
  }

  Future<void> createCode({
    required String affiliateId, required String code,
    required double customerDiscountPercent, required double commissionPercent,
    required DateTime from, required DateTime until, int? maxUses,
  }) async {
    await assertAdmin();
    final normalized = code.trim().toUpperCase();
    if (!RegExp(r'^[A-Z0-9][A-Z0-9_-]{3,31}$').hasMatch(normalized)) {
      throw ArgumentError('Ungültiger Rabattcode');
    }
    final customerBps = (customerDiscountPercent * 100).round();
    final commissionBps = (commissionPercent * 100).round();
    if (customerBps < 0 || customerBps > 10000 || commissionBps < 0 || commissionBps > 10000 || until.isBefore(from)) {
      throw ArgumentError('Ungültige Rabatt-/Provisionsbedingungen');
    }
    final approved = await client.from('luvipro_affiliate_applications')
      .select('id').eq('id',affiliateId).eq('status','approved').limit(1);
    if ((approved as List).isEmpty) throw StateError('Partner ist nicht freigegeben');
    final created = await client.from('luvipro_discount_codes').insert({
      'affiliate_id': affiliateId, 'code': normalized,
      'discount_bps': customerBps, 'commission_bps': commissionBps,
      'valid_from': from.toIso8601String().substring(0,10),
      'valid_until': until.toIso8601String().substring(0,10),
      'usage_limit': maxUses, 'active':false,
    }).select('id').single();
    await client.from('luvipro_affiliate_audit').insert({
      'action':'code_created','entity_id':created['id'],
      'actor_uid':client.auth.currentUser!.id,
      'details':{'code':normalized,'affiliate_id':affiliateId},
    });
  }

  /// Supply bytes to the EXISTING FlutterFlow file-save/download action.
  /// Do not open these URLs without Authorization or embed JWT in URL params.
  Future<Uint8List> downloadMonthlyPdf(DateTime period) async {
    await assertAdmin();
    final token = client.auth.currentSession?.accessToken;
    if (token == null) throw StateError('Login abgelaufen');
    final month = '${period.year}-${period.month.toString().padLeft(2,'0')}';
    final r = await http.get(Uri.parse('$site/api/accounting/monthly-pdf?month=$month'),
      headers: {'Authorization':'Bearer $token'});
    if (r.statusCode != 200 || r.bodyBytes.length < 5 || latin1.decode(r.bodyBytes.sublist(0,5)) != '%PDF-') {
      throw StateError('Monatsabrechnung nicht verfügbar: HTTP ${r.statusCode}');
    }
    return r.bodyBytes;
  }

  /// Signed/protected business proof download; PDF or original image bytes.
  Future<Uint8List> downloadGewerbeProof(String applicationId) async {
    await assertAdmin();
    final token = client.auth.currentSession?.accessToken;
    if (token == null) throw StateError('Login abgelaufen');
    final r = await http.get(Uri.parse('$site/api/accounting/affiliate/document?id=$applicationId&format=pdf'),
      headers: {'Authorization':'Bearer $token'});
    if (r.statusCode!=200) throw StateError('Nachweis nicht abrufbar');
    return r.bodyBytes;
  }
}

class LuviproMarketingAdminPage extends StatefulWidget {
  const LuviproMarketingAdminPage({super.key, required this.api, this.onDownloadPdf, this.onDownloadProof});
  final LuviproBackofficeApi api;
  /// Connect to original app's file save/open action (Android / iOS).
  final Future<void> Function(Uint8List bytes,String filename)? onDownloadPdf;
  final Future<void> Function(Uint8List bytes,String applicationId)? onDownloadProof;
  @override
  State<LuviproMarketingAdminPage> createState()=> _LuviproMarketingAdminPageState();
}

class _LuviproMarketingAdminPageState extends State<LuviproMarketingAdminPage> {
  List<Map<String,dynamic>> applications=[];
  List<Map<String,dynamic>> codes=[];
  List<Map<String,dynamic>> commissions=[];
  List<Map<String,dynamic>> payouts=[];
  String? error;bool busy=false;int tab=0;
  final codeController=TextEditingController();
  final discountController=TextEditingController(text:'10');
  final commissionController=TextEditingController(text:'10');
  final notesController=TextEditingController();
  String? chosenAffiliate;
  DateTime from=DateTime.now(),until=DateTime.now().add(const Duration(days:30));
  DateTime reportMonth=DateTime.now();

  @override
  void initState(){super.initState(); refresh();}
  @override
  void dispose(){codeController.dispose();discountController.dispose();commissionController.dispose();notesController.dispose();super.dispose();}
  Future<void> refresh()async{
    setState((){busy=true;error=null;});
    try {
      final a=await widget.api.applications();
      final b=await widget.api.codes();
      final c=await widget.api.commissions();
      final d=await widget.api.payouts();
      if(mounted) setState((){applications=a;codes=b;commissions=c;payouts=d;});
    }catch(e){if(mounted)setState(()=>error=e.toString());}
    finally{if(mounted)setState(()=>busy=false);}
  }
  void toast(String message){if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(message)));}
  Future<void> review(String id,bool approved)async{
    try{await widget.api.reviewApplication(id,approved:approved,notes:notesController.text);await refresh();toast('Änderung gespeichert');}
    catch(e){toast('Aktion fehlgeschlagen: $e');}
  }
  Future<void> newCode()async{
    if(chosenAffiliate==null){toast('Partner wählen');return;}
    try{
      await widget.api.createCode(affiliateId:chosenAffiliate!,code:codeController.text,
        customerDiscountPercent:double.parse(discountController.text.replaceAll(',','.')),
        commissionPercent:double.parse(commissionController.text.replaceAll(',','.')),
        from:from,until:until);
      codeController.clear();await refresh();toast('Rabattcode gespeichert (inaktiv)');
    }catch(e){toast('Fehler: $e');}
  }
  Widget applicationView(){
    return ListView(children:applications.map((a)=>Card(
      child:Padding(padding:const EdgeInsets.all(14),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        Text('${a['company_name']}',style:Theme.of(context).textTheme.titleMedium),
        Text('${a['contact_name']} · ${a['email']}'),
        Text('${a['country']} · ${a['business_address']}'),
        const SizedBox(height:8),Text('Status: ${a['status']}'),
        if(widget.onDownloadProof!=null)TextButton.icon(
          onPressed:()=>widget.api.downloadGewerbeProof('${a['id']}').then((b)=>widget.onDownloadProof!(b,'${a['id']}')).catchError((Object e){toast('$e');}),
          icon:const Icon(Icons.description_outlined),label:const Text('Gewerbenachweis anzeigen')),
        if(a['status']=='pending')...[
          TextField(controller:notesController,decoration:const InputDecoration(labelText:'Prüfnotiz / Ablehnungsgrund')),
          Row(children:[FilledButton(onPressed:()=>review('${a['id']}',true),child:const Text('Annehmen')),
            const SizedBox(width:10),OutlinedButton(onPressed:()=>review('${a['id']}',false),child:const Text('Ablehnen'))])
        ],
      ])),
    )).toList());
  }
  Widget codeView(){
    final approved=applications.where((a)=>a['status']=='approved').toList();
    return ListView(padding:const EdgeInsets.all(12),children:[
      Text('Rabattcodes manuell',style:Theme.of(context).textTheme.titleLarge),
      DropdownButtonFormField<String>(value:approved.any((x)=>x['id']==chosenAffiliate)?chosenAffiliate:null,
        decoration:const InputDecoration(labelText:'Freigegebener Partner'),
        items:approved.map((a)=>DropdownMenuItem<String>(value:'${a['id']}',child:Text('${a['company_name']}'))).toList(),
        onChanged:(v)=>setState(()=>chosenAffiliate=v)),
      TextField(controller:codeController,decoration:const InputDecoration(labelText:'Rabattcode (z. B. MAX10)')),
      TextField(controller:discountController,keyboardType:TextInputType.number,decoration:const InputDecoration(labelText:'Kundenrabatt %')),
      TextField(controller:commissionController,keyboardType:TextInputType.number,decoration:const InputDecoration(labelText:'Provision %')),
      Wrap(spacing:10,children:[
        OutlinedButton(onPressed:()async{final d=await showDatePicker(context:context,initialDate:from,firstDate:DateTime(2026),lastDate:DateTime(2100));if(d!=null)setState(()=>from=d);},child:Text('Ab: ${from.year}-${from.month}-${from.day}')),
        OutlinedButton(onPressed:()async{final d=await showDatePicker(context:context,initialDate:until,firstDate:DateTime(2026),lastDate:DateTime(2100));if(d!=null)setState(()=>until=d);},child:Text('Bis: ${until.year}-${until.month}-${until.day}')),
      ]),
      FilledButton(onPressed:newCode,child:const Text('Code speichern – inaktiv')),
      ...codes.map((c)=>ListTile(title:Text('${c['code']}'),subtitle:Text('Rabatt ${(c['discount_bps'] as num)/100}% · Provision ${(c['commission_bps'] as num)/100}% · bis ${c['valid_until']}'),trailing:Text(c['active']==true?'Aktiv':'Inaktiv'))),
    ]);
  }
  Widget financeView(){
    return ListView(padding:const EdgeInsets.all(12),children:[
      Text('Monatsabrechnung (PDF)',style:Theme.of(context).textTheme.titleLarge),
      const Text('Nur echte Rechnungs-/Ausgabendaten nach serverseitiger Freigabe. Keine Steuererklärung.'),
      OutlinedButton(onPressed:()async{
        final date=await showDatePicker(context:context,initialDate:reportMonth,firstDate:DateTime(2020),lastDate:DateTime(2100));
        if(date!=null)setState(()=>reportMonth=date);
      },child:Text('Monat: ${reportMonth.year}-${reportMonth.month.toString().padLeft(2,'0')}')),
      FilledButton.icon(icon:const Icon(Icons.picture_as_pdf),
        onPressed:widget.onDownloadPdf==null?null:()async{
          try{
            final data=await widget.api.downloadMonthlyPdf(reportMonth);
            await widget.onDownloadPdf!(data,'LUVIPRO-Monatsabrechnung-${reportMonth.year}-${reportMonth.month.toString().padLeft(2,'0')}.pdf');
          }catch(e){toast('Download nicht möglich: $e');}
        },label:const Text('PDF herunterladen')),
      const SizedBox(height:24),const Text('Aufwendungen, Eingangsbelege und Bankbewegungen im bestehenden Buchhaltungsmodul; zusätzliche App-Eingabe ist erst nach demselben Berechtigungstest und Belegspeicher integriert.'),
    ]);
  }
  Widget payoutsView()=>ListView(children:[
    const Padding(padding:EdgeInsets.all(12),child:Text('Provisionen · nur verifizierte Zahlungen, Lieferung und Rückgabefrist')),
    ...commissions.map((c)=>ListTile(title:Text('Provision ${((c['commission_cents'] as num)/100).toStringAsFixed(2)} EUR'),
      subtitle:Text('Status: ${c['status']} · geliefert: ${c['delivered_at']??"–"}'))),
    const Divider(),
    ...payouts.map((p)=>ListTile(title:Text('Auszahlung ${((p['amount_cents'] as num)/100).toStringAsFixed(2)} EUR'),subtitle:Text('Monat: ${p['payout_month']} · ${p['status']}'))),
    const Padding(padding:EdgeInsets.all(12),child:Text('Banküberweisungen erfolgen erst nach buchhalterischer Verifikation und separater administrativer Freigabe.')),
  ]);
  @override
  Widget build(BuildContext context){
    final titles=['Gewerbe','Rabattcodes','Buchhaltung','Provisionen'];
    return Scaffold(appBar:AppBar(title:const Text('LUVIPRO · Admin Marketing'),actions:[IconButton(onPressed:busy?null:refresh,icon:const Icon(Icons.refresh))]),
      body:busy?const Center(child:CircularProgressIndicator()):
        error!=null?Center(child:Text('Zugriff/Backend prüfen: $error')):
        IndexedStack(index:tab,children:[applicationView(),codeView(),financeView(),payoutsView()]),
      bottomNavigationBar:NavigationBar(selectedIndex:tab,onDestinationSelected:(i)=>setState(()=>tab=i),destinations:const [
        NavigationDestination(icon:Icon(Icons.verified_user),label:'Anträge'),
        NavigationDestination(icon:Icon(Icons.discount),label:'Codes'),
        NavigationDestination(icon:Icon(Icons.receipt_long),label:'Finanzen'),
        NavigationDestination(icon:Icon(Icons.payments),label:'Provisionen'),
      ]),
    );
  }
}
