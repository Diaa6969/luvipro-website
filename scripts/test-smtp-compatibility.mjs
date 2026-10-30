import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import nodemailer from 'nodemailer';
const sent=[]; let transportOptions;
const stub={createTransport(options){transportOptions=options;return {async sendMail(message){sent.push(message);return {accepted:[message.to]};}};}};
const module={exports:{}};
const code=ts.transpileModule(fs.readFileSync('src/lib/hostinger-smtp.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
new Function('require','module','exports',code)(name=>{assert.equal(name,'nodemailer');return stub;},module,module.exports);
const previousUser=process.env.SMTP_USER, previousPass=process.env.SMTP_PASSWORD;
try {
 delete process.env.SMTP_USER;delete process.env.SMTP_PASSWORD;
 await assert.rejects(()=>module.exports.sendHostingerMail({to:'synthetic@example.invalid',replyTo:'reply@example.invalid',subject:'TEST',text:'TEST'}),/not configured/);
 process.env.SMTP_USER='synthetic-sender@example.invalid';process.env.SMTP_PASSWORD='SYNTHETIC-NOT-A-CREDENTIAL';
 await module.exports.sendHostingerMail({to:'synthetic@example.invalid',replyTo:'reply@example.invalid',subject:'LUVIPRO synthetic compatibility',text:'Synthetic only',attachments:[{filename:'synthetic.pdf',content:Buffer.from('%PDF-SYNTHETIC'),contentType:'application/pdf'}]});
 assert.equal(sent.length,1);assert.equal(transportOptions.host,'smtp.hostinger.com');assert.equal(transportOptions.secure,true);assert.equal(transportOptions.tls.rejectUnauthorized,true);assert.equal(transportOptions.disableFileAccess,true);assert.equal(transportOptions.disableUrlAccess,true);
 // The real upgraded composer uses memory-only transport: no DNS, SMTP or messages sent.
 const memory=nodemailer.createTransport({streamTransport:true,buffer:true,newline:'unix',disableFileAccess:true,disableUrlAccess:true});
 const result=await memory.sendMail(sent[0]);const mime=result.message.toString('utf8');
 assert.match(mime,/Content-Type: multipart\/mixed/);assert.match(mime,/synthetic\.pdf/);assert.match(mime,/Reply-To: reply@example\.invalid/);assert.match(mime,/Synthetic only/);
 console.log('SMTP compatibility: PASS — actual application transport settings and upgraded in-memory MIME composer; no network or real credentials.');
} finally {
 if(previousUser===undefined)delete process.env.SMTP_USER;else process.env.SMTP_USER=previousUser;
 if(previousPass===undefined)delete process.env.SMTP_PASSWORD;else process.env.SMTP_PASSWORD=previousPass;
}
