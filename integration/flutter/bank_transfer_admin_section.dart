// For the existing exported LUVIPRO Flutter app (NOT a second app).
// Mount BankTransferAdminSection inside adminCenterPage after inspecting
// the real source. No service-role or email secrets belong in this client.
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class BankTransferAdminSection extends StatefulWidget {
  const BankTransferAdminSection({super.key});
  @override
  State<BankTransferAdminSection> createState() => _BankTransferAdminSectionState();
}

class _BankTransferAdminSectionState extends State<BankTransferAdminSection> {
  List<Map<String, dynamic>> _orders = [];
  String? _error;
  bool _busy = false;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<Map<String, dynamic>> _call(Map<String, dynamic> payload) async {
    final jwt = Supabase.instance.client.auth.currentSession?.accessToken;
    if (jwt == null) throw Exception('Admin-Anmeldung erforderlich');
    final result = await Supabase.instance.client.functions.invoke(
      'bank-transfer-admin',
      headers: {'Authorization': 'Bearer $jwt'},
      body: payload,
    );
    if (result.data is! Map) throw Exception('Ungültige Antwort');
    final data = Map<String, dynamic>.from(result.data as Map);
    if (data['error'] != null) throw Exception(data['error'].toString());
    return data;
  }

  Future<void> _refresh() async {
    try {
      final value = await _call({'action': 'list'});
      if (!mounted) return;
      setState(() {
        _orders = (value['orders'] as List<dynamic>)
            .map((entry) => Map<String,dynamic>.from(entry as Map)).toList();
        _error = null;
      });
    } catch (e) { if (mounted) setState(() => _error = e.toString()); }
  }

  String _euro(dynamic cents) =>
      ((cents is num ? cents.toDouble() : 0.0) / 100).toStringAsFixed(2) + ' EUR';

  Future<void> _confirm(Map<String,dynamic> order) async {
    final ref = TextEditingController();
    DateTime? creditedAt;
    bool checked = false;
    try {
      final ok = await showDialog<bool>(context: context,
        builder: (ctx) => StatefulBuilder(builder: (ctx,setLocal) => AlertDialog(
          title: const Text('Bankzahlung bestätigen'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(order['invoice_number'].toString() + ' · ' + _euro(order['gross_cents'])),
            TextField(controller: ref,
              decoration: const InputDecoration(labelText: 'Bank-Buchungsreferenz'),
              onChanged: (_) => setLocal((){})),
            TextButton(onPressed: () async {
              final date = await showDatePicker(context: ctx,
                initialDate: DateTime.now(), firstDate: DateTime(2020),
                lastDate: DateTime.now());
              if (date != null) setLocal(() => creditedAt = date);
            }, child: Text(creditedAt == null ? 'Datum der Gutschrift wählen'
                : creditedAt!.toIso8601String().substring(0,10))),
            CheckboxListTile(value: checked,
              onChanged: (v) => setLocal(() => checked=v==true),
              title: const Text('Kontoauszug und Betrag abgeglichen')),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx,false),
              child: const Text('Abbrechen')),
            FilledButton(onPressed: !checked || creditedAt == null
                || ref.text.trim().length < 5 ? null
                : () => Navigator.pop(ctx,true),
              child: const Text('Bestätigen')),
          ],
        )),
      );
      if (ok != true || creditedAt == null) return;
      setState(() => _busy = true);
      await _call({'action':'confirm','orderId':order['id'],
        'bankReference':ref.text.trim(),
        'paidAt':creditedAt!.toUtc().toIso8601String(),
        'acknowledgedBankMatch':true});
      await _refresh();
    } catch(e) { if(mounted) setState(() => _error=e.toString()); }
    finally {ref.dispose(); if(mounted)setState(()=>_busy=false);}
  }

  Future<void> _remind(Map<String,dynamic> order) async {
    if (_busy) return;
    setState(()=>_busy=true);
    try {
      final preview = await _call({'action':'preview_reminder','orderId':order['id']});
      if (!mounted) return;
      final send = await showDialog<bool>(context:context,builder:(ctx)=>AlertDialog(
        title: Text(preview['subject'].toString()),
        content: SingleChildScrollView(child: SelectableText(
          'An: ' + preview['to'].toString() + '\n\n' + preview['text'].toString())),
        actions: [
          TextButton(onPressed:()=>Navigator.pop(ctx,false),child:const Text('Abbrechen')),
          FilledButton(onPressed:()=>Navigator.pop(ctx,true),child:const Text('E-Mail senden')),
        ],
      ));
      if (send != true) return;
      await _call({'action':'remind','orderId':order['id']});
      await _refresh();
    }catch(e){if(mounted)setState(()=>_error=e.toString());}
    finally{if(mounted)setState(()=>_busy=false);}
  }

  @override
  Widget build(BuildContext context) {
    final open = _orders.where((r)=>r['payment_status']=='pending').toList();
    final paid = _orders.where((r)=>r['payment_status']=='paid').toList();
    return Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Row(children:[
        const Expanded(child:Text('Banküberweisungen',style:TextStyle(fontSize:20,fontWeight:FontWeight.bold))),
        IconButton(onPressed:_busy?null:_refresh,icon:const Icon(Icons.refresh)),
      ]),
      if (_error!=null) Text(_error!,style:const TextStyle(color:Colors.red)),
      Text(open.length.toString()+' offen · '+paid.length.toString()+' bezahlt'),
      for(final order in open) Card(child:Padding(padding:const EdgeInsets.all(12),child:Column(
        crossAxisAlignment:CrossAxisAlignment.start,children:[
          Text(order['invoice_number'].toString(),style:const TextStyle(fontWeight:FontWeight.bold)),
          Text(order['customer_company'].toString()+' · '+order['customer_email'].toString()),
          Text(_euro(order['gross_cents'])),
          Wrap(spacing:8,children:[
            FilledButton(onPressed:_busy?null:()=>_confirm(order),child:const Text('Zahlung bestätigen')),
            OutlinedButton(onPressed:_busy?null:()=>_remind(order),child:const Text('Erinnerung')),
          ]),
        ]))),
      for(final order in paid) ListTile(
        title:Text(order['invoice_number'].toString()),subtitle:Text(order['customer_company'].toString()),
        trailing:Text(_euro(order['gross_cents'])),
      ),
    ]);
  }
}
