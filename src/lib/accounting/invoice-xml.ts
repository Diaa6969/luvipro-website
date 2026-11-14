import { SaxesParser } from "saxes";

const ubl = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
const cii = "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100";
const basic = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
const aggregate = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
const ram = "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100";
const udt = "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100";

export function inspectInvoiceXml(source: string) {
  if (source.length > 500_000) throw new Error("XML zu groß.");
  const stack: string[] = [];
  const values = new Map<string, string>();
  let format: "UBL" | "CII" | undefined;
  const parser = new SaxesParser({ xmlns: true });
  parser.on("doctype", () => { throw new Error("DOCTYPE ist unzulässig."); });
  parser.on("opentag", tag => {
    if (!stack.length) {
      if (tag.uri === ubl && tag.local === "Invoice") format = "UBL";
      else if (tag.uri === cii && tag.local === "CrossIndustryInvoice") format = "CII";
      else throw new Error("Unbekannter Rechnungsstandard.");
    }
    if (stack.length > 48) throw new Error("XML zu tief verschachtelt.");
    stack.push(tag.uri === basic ? "b:" + tag.local : tag.uri === aggregate ? "a:" + tag.local :
      tag.uri === ram ? "r:" + tag.local : tag.uri === udt ? "d:" + tag.local :
      tag.uri === ubl || tag.uri === cii ? tag.local : "?");
  });
  parser.on("text", value => {
    if (!value.trim()) return;
    const path = stack.join("/");
    if (values.size > 5000) throw new Error("Zu viele XML-Felder.");
    values.set(path, ((values.get(path) ?? "") + value).slice(0, 1500));
  });
  parser.on("closetag", () => { stack.pop(); });
  parser.write(source).close();
  const get = (path: string) => values.get(path)?.trim() || undefined;
  const date = (value?: string) => value?.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
  if (format === "UBL") return {
    format,
    profile: get("Invoice/b:CustomizationID"),
    supplier: get("Invoice/a:AccountingSupplierParty/a:Party/a:PartyLegalEntity/b:RegistrationName")
      ?? get("Invoice/a:AccountingSupplierParty/a:Party/a:PartyName/b:Name"),
    invoiceNumber: get("Invoice/b:ID"),
    invoiceDate: date(get("Invoice/b:IssueDate")),
    currency: get("Invoice/b:DocumentCurrencyCode"),
    gross: get("Invoice/a:LegalMonetaryTotal/b:TaxInclusiveAmount"),
    net: get("Invoice/a:LegalMonetaryTotal/b:TaxExclusiveAmount"),
    due: date(get("Invoice/b:DueDate")),
  };
  const root = "CrossIndustryInvoice";
  const transaction = root + "/SupplyChainTradeTransaction";
  const settlement = transaction + "/r:ApplicableHeaderTradeSettlement";
  const totals = settlement + "/r:SpecifiedTradeSettlementHeaderMonetarySummation";
  return {
    format,
    profile: get(root + "/ExchangedDocumentContext/r:GuidelineSpecifiedDocumentContextParameter/r:ID"),
    supplier: get(transaction + "/r:ApplicableHeaderTradeAgreement/r:SellerTradeParty/r:Name"),
    invoiceNumber: get(root + "/ExchangedDocument/r:ID"),
    invoiceDate: date(get(root + "/ExchangedDocument/r:IssueDateTime/d:DateTimeString")),
    currency: get(settlement + "/r:InvoiceCurrencyCode"),
    gross: get(totals + "/r:GrandTotalAmount"),
    net: get(totals + "/r:TaxBasisTotalAmount"),
    due: date(get(settlement + "/r:SpecifiedTradePaymentTerms/r:DueDateDateTime/d:DateTimeString")),
  };
}
