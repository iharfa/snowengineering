// Server-side ERPNext client. Never import this into a client component.
// All functions degrade gracefully: when ERPNext env vars are missing they
// return null / no-op so the site works on local seed data alone.

const BASE = process.env.ERPNEXT_BASE_URL;
const KEY = process.env.ERPNEXT_API_KEY;
const SECRET = process.env.ERPNEXT_API_SECRET;
const PRICE_LIST = process.env.ERPNEXT_PRICE_LIST || "Standard Selling";

export const erpnextConfigured = Boolean(BASE && KEY && SECRET);

function headers() {
  return {
    Authorization: `token ${KEY}:${SECRET}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  if (!erpnextConfigured) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`ERPNext ${path} -> ${res.status} ${await res.text()}`);
      return null;
    }
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch (err) {
    console.error("ERPNext request failed", err);
    return null;
  }
}

export interface ErpItem {
  item_code: string;
  item_name: string;
  item_group: string;
  description?: string;
}

export function getItems() {
  return api<ErpItem[]>(
    `/api/resource/Item?filters=[["show_in_website","=",1]]&fields=["item_code","item_name","item_group","description"]&limit_page_length=0`
  );
}

export function getItemByCode(itemCode: string) {
  return api<ErpItem>(`/api/resource/Item/${encodeURIComponent(itemCode)}`);
}

export async function getItemPrice(
  itemCode: string
): Promise<number | null> {
  const data = await api<{ price_list_rate: number }[]>(
    `/api/resource/Item Price?filters=[["item_code","=","${itemCode}"],["price_list","=","${PRICE_LIST}"]]&fields=["price_list_rate"]&limit_page_length=1`
  );
  return data && data.length ? data[0].price_list_rate : null;
}

// --- writes ----------------------------------------------------------------

function create<T>(doctype: string, doc: object) {
  return api<T>(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: JSON.stringify(doc),
  });
}

export interface PriceRevealLog {
  product_id: string;
  item_code: string;
  product_name: string;
  category: string;
  timestamp: string;
  session_id: string;
  user_agent: string;
  referrer: string;
  ip_hash: string;
}

export function createPriceRevealLog(data: PriceRevealLog) {
  return create("Website Price Reveal Log", data);
}

export interface WebsiteOrderInquiry {
  customer_name: string;
  company?: string;
  phone: string;
  email: string;
  location: string;
  preferred_contact_method: string;
  order_notes?: string;
  cart_json: string;
  subtotal: number;
  gst_amount: number;
  estimated_total: number;
  source: string;
  status: string;
}

export function createWebsiteOrderInquiry(data: WebsiteOrderInquiry) {
  return create<{ name: string }>("Website Order Inquiry", data);
}

export function createLeadFromInquiry(data: {
  lead_name: string;
  company_name?: string;
  email_id: string;
  mobile_no: string;
  source?: string;
}) {
  return create<{ name: string }>("Lead", {
    ...data,
    source: data.source || "Website",
  });
}

export function createQuotationDraft(data: {
  party_name: string;
  items: { item_code: string; qty: number }[];
}) {
  return create<{ name: string }>("Quotation", {
    quotation_to: "Lead",
    party_name: data.party_name,
    items: data.items,
    docstatus: 0,
  });
}
