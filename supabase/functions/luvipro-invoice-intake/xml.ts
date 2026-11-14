import { SaxesParser } from "npm:saxes@6.0.0";

const ublInvoice = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
const ublCredit = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";
const basic = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
const cii = "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100";
const ram = "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100";
const udt = "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100";

// Extract only unambiguous header fields. Business validation must run separately.
export function inspectInvoiceXml(xml: string) {
  const parser = new SaxesParser({ xmlns: true });
  const stack: { uri: string; local: string }[] = [];
  let format: "ubl" | "cii" | undefined;
  let capture: "number" | "date" | undefined;
  let value = "";
  const fields: { number?: string; date?: string } = {};
  parser.on("doctype", () => { throw new Error("DTD forbidden"); });
  parser.on("error", error => { throw error; });
  parser.on("opentag", tag => {
    if (stack.length >= 64 || capture) throw new Error("Unexpected XML structure");
    stack.push(tag);
    if (stack.length === 1) {
      if ((tag.uri === ublInvoice && tag.local === "Invoice") ||
          (tag.uri === ublCredit && tag.local === "CreditNote")) format = "ubl";
      else if (tag.uri === cii && tag.local === "CrossIndustryInvoice") format = "cii";
    }
    const parent = stack[stack.length - 2];
    const grandparent = stack[stack.length - 3];
    if (format === "ubl" && stack.length === 2 && tag.uri === basic) {
      if (tag.local === "ID") capture = "number";
      if (tag.local === "IssueDate") capture = "date";
    }
    if (format === "cii" && stack.length === 3 && parent?.uri === cii &&
        parent.local === "ExchangedDocument" && tag.uri === ram && tag.local === "ID")
      capture = "number";
    if (format === "cii" && stack.length === 4 && grandparent?.uri === cii &&
        grandparent.local === "ExchangedDocument" && parent?.uri === ram &&
        parent.local === "IssueDateTime" && tag.uri === udt && tag.local === "DateTimeString")
      capture = "date";
  });
  const append = (text: string) => {
    if (!capture) return;
    value += text;
    if (value.length > 256) throw new Error("Invoice header field too long");
  };
  parser.on("text", append);
  parser.on("cdata", append);
  parser.on("closetag", () => {
    if (capture) {
      if (fields[capture] !== undefined) throw new Error("Duplicate invoice header field");
      fields[capture] = value.trim();
    }
    capture = undefined;
    value = "";
    stack.pop();
  });
  parser.write(xml).close();
  if (!format || !fields.number || !fields.date) throw new Error("Missing invoice header");
  const date = format === "cii" && /^\d{8}$/.test(fields.date)
    ? fields.date.replace(/^(....)(..)(..)$/, "$1-$2-$3") : fields.date;
  const parsed = new Date(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date) throw new Error("Invalid invoice date");
  return { format, invoiceNumber: fields.number, issueDate: date };
}

