import { useEffect, useMemo, useRef, useState } from "react";

type Module = {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  action: string;
  workflow: string[];
  hidden?: boolean;
};

type Tone = "green" | "amber" | "red" | "navy";
type Rec = { key: string; cells: string[]; stage: number; note?: string };
type Config = {
  headers: string[];
  mode: "pipeline" | "sections";
  prefix?: string;
  money?: number[];
  notes?: string[];
  next?: string[];
  doneText?: string;
  cycle?: boolean;
  rows: [string[], number, string?][];
};

const modules: Module[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂", subtitle: "Business overview", action: "New Booking", workflow: [] },
  { id: "customers", label: "Customers & Inquiries", icon: "◎", subtitle: "Leads, follow-ups and customer history", action: "New Inquiry", workflow: ["Inquiry", "Follow-up", "Quotation", "Booking"] },
  { id: "quotations", label: "Quotations & Packages", icon: "▤", subtitle: "Build packages and preserve approved prices", action: "Create Quotation", workflow: ["Draft", "Review", "Approval", "Convert to booking"] },
  { id: "events", label: "Events & Bookings", icon: "◇", subtitle: "Plan and operate every confirmed event", action: "New Booking", workflow: ["Customer", "Event info", "Venue & time", "Services", "Resources", "Payment", "Review"] },
  { id: "venues", label: "Halls & Venues", icon: "⌂", subtitle: "Capacity, pricing and availability", action: "Add Venue", workflow: ["Availability", "Setup window", "Event", "Cleanup window"] },
  { id: "calendar", label: "Booking Calendar", icon: "□", subtitle: "Venue, people and equipment scheduling", action: "Check Availability", workflow: [] },
  { id: "catering", label: "Catering & Menus", icon: "◉", subtitle: "Menus, production and ingredient planning", action: "Build Menu", workflow: ["Menu approval", "Guest count", "Production sheet", "Consumption"] },
  { id: "decoration", label: "Decoration", icon: "✣", subtitle: "Themes, materials and setup approvals", action: "New Design Brief", workflow: ["Theme", "Costing", "Customer approval", "Setup checklist"] },
  { id: "rentals", label: "Rental Orders", icon: "◇", subtitle: "Reservations, dispatch, return and deposits", action: "New Rental Order", workflow: ["Quote", "Reserve", "Dispatch", "Return", "Deposit settlement"] },
  { id: "inventory", label: "Inventory & Stock", icon: "▣", subtitle: "Returnable assets and consumables", action: "Stock Movement", workflow: ["Reserve", "Issue", "Return", "Transfer", "Adjust"] },
  { id: "purchasing", label: "Purchasing", icon: "⌑", subtitle: "Controlled procure-to-pay workflow", action: "Purchase Request", workflow: ["Request", "Approval", "Purchase order", "Goods receipt", "Supplier bill", "Payment"] },
  { id: "vendors", label: "Vendors & Suppliers", icon: "◌", subtitle: "Commitments, advances and payable balances", action: "Add Vendor", workflow: ["Commitment", "Bill", "Advance", "Payment", "Ledger"] },
  { id: "staff", label: "Staff & Duties", icon: "♙", subtitle: "Assignments, shifts, attendance and wages", action: "Assign Staff", workflow: ["Availability", "Assignment", "Check-in", "Wages", "Payment"] },
  { id: "tasks", label: "Tasks & Schedule", icon: "☷", subtitle: "Event run-sheets, dependencies and escalation", action: "New Task", workflow: ["To do", "In progress", "Review", "Done"] },
  { id: "transport", label: "Transport & Delivery", icon: "▱", subtitle: "Dispatch, delivery and return logistics", action: "Plan Dispatch", workflow: ["Loading", "Dispatch", "Delivery", "Signature", "Pickup", "Return"] },
  { id: "billing", label: "Billing & Receipts", icon: "▤", subtitle: "Invoices, receipts, credits and refunds", action: "Record Payment", workflow: ["Invoice", "Receipt", "Account update", "Daily closing"] },
  { id: "expenses", label: "Expenses & Accounts", icon: "▥", subtitle: "Accruals, payments and account ledgers", action: "Add Expense", workflow: ["Record expense", "Approve", "Pay", "Ledger"] },
  { id: "cash", label: "Cash & Daily Closing", icon: "▣", subtitle: "Drawer control and reconciliation", action: "Start Closing", workflow: [] },
  { id: "reports", label: "Reports", icon: "◔", subtitle: "Operational and financial intelligence", action: "Export Report", workflow: ["Sales", "Events", "Finance", "Inventory"] },
  { id: "settings", label: "Users & Settings", icon: "⚙", subtitle: "Permissions, policies and audit controls", action: "Invite User", workflow: ["Users", "Roles", "Permissions", "Business settings", "Activity log"] },
  { id: "profile", label: "My Profile", icon: "◎", subtitle: "Personal details and account preferences", action: "Save Changes", workflow: [], hidden: true },
];

const configs: Record<string, Config> = {
  customers: {
    headers: ["Customer", "Requirement", "Budget"], mode: "pipeline", money: [2], doneText: "✓ Booked",
    notes: ["New customer requirements awaiting first response.", "Qualified inquiries requiring calls or meetings.", "Customers with a quotation in preparation or review.", "Customers ready to be confirmed as active bookings."],
    next: ["Start follow-up →", "Send quotation →", "Move to booking →", "Confirm booking ✓"],
    rows: [
      [["Ahmed Raza", "Wedding · 14 Nov 2026", "PKR 1,200,000"], 1, "Called on 17 Oct. Wants a venue visit this weekend."],
      [["Nexus Pakistan", "Corporate · 25 Oct 2026", "PKR 650,000"], 4, "Converted to booking EV-0249."],
      [["Sana Malik", "Birthday · 06 Dec 2026", "PKR 180,000"], 0],
      [["Hassan & Maira", "Wedding · 18 Dec 2026", "PKR 950,000"], 2, "Quotation QT-1051 is awaiting approval."],
      [["Vertex Textiles", "Annual dinner · 09 Jan 2027", "PKR 780,000"], 0],
    ],
  },
  quotations: {
    headers: ["Quote", "Customer", "Package", "Total"], mode: "pipeline", prefix: "QT-", money: [3], doneText: "✓ Booking created",
    notes: ["Quotations being prepared. Add packages and services, then send for review.", "Prices and inclusions are being checked. Package items cannot be charged twice.", "Reviewed quotations waiting for owner or customer approval. Approved rates are locked.", "Approved quotations ready to be converted into confirmed bookings."],
    next: ["Send for review →", "Send for approval →", "Approve →", "Convert to booking ✓"],
    rows: [
      [["QT-1050", "Sana Malik", "Birthday package · 06 Dec 2026", "PKR 180,000"], 0],
      [["QT-1052", "Vertex Textiles", "Annual dinner · 09 Jan 2027", "PKR 780,000"], 0],
      [["QT-1049", "Ahmed Raza", "Wedding Gold · Revision 2", "PKR 1,200,000"], 1],
      [["QT-1051", "Hassan & Maira", "Wedding Silver · 18 Dec 2026", "PKR 950,000"], 2],
      [["QT-1048", "Ayesha & Hamza", "Wedding Platinum · 24 Oct 2026", "PKR 500,000"], 3, "Approved rates are locked. Changes create a new revision."],
      [["QT-1047", "Nexus Pakistan", "Corporate summit · 25 Oct 2026", "PKR 650,000"], 4, "Converted to booking EV-0249."],
    ],
  },
  events: {
    headers: ["Event", "Title", "Date"], mode: "pipeline", prefix: "EV-", doneText: "✓ Confirmed",
    next: ["Add event info →", "Pick venue & time →", "Add services →", "Assign resources →", "Take payment →", "Send for review →", "Confirm booking ✓"],
    rows: [
      [["EV-0248", "Ayesha & Hamza Wedding", "24 Oct 2026"], 7, "Operations confirmed. PKR 150,000 still due on INV-1031."],
      [["EV-0249", "Nexus Corporate Summit", "25 Oct 2026"], 4, "Sound and stage resources are still being assigned."],
      [["EV-0250", "Sara’s Birthday", "26 Oct 2026"], 2, "Waiting for venue confirmation at Garden Marquee."],
      [["EV-0251", "Hassan & Maira Wedding", "18 Dec 2026"], 0],
      [["EV-0252", "Vertex Annual Dinner", "09 Jan 2027"], 1],
    ],
  },
  venues: {
    headers: ["Venue", "Capacity", "Base price"], mode: "pipeline", money: [2], cycle: true,
    notes: ["Venues that are free and open for new bookings.", "Venues being prepared before an event.", "Venues with an event in progress.", "Venues being cleaned and reset after an event."],
    next: ["Start setup →", "Start event →", "Start cleanup →", "Release venue ↺"],
    rows: [
      [["Emerald Hall", "350 guests", "PKR 180,000"], 1, "Setup for EV-0248 on 24 Oct from 08:00."],
      [["Garden Marquee", "600 guests", "PKR 260,000"], 0, "Reserved for EV-0250 on 26 Oct."],
      [["Pearl Banquet", "220 guests", "PKR 145,000"], 3, "Blocked for maintenance until 20 Oct."],
      [["Crystal Lawn", "800 guests", "PKR 320,000"], 0],
    ],
  },
  catering: {
    headers: ["Menu", "Event", "Guests"], mode: "pipeline", doneText: "✓ Closed",
    next: ["Confirm guest count →", "Create production sheet →", "Record consumption →", "Close menu ✓"],
    rows: [
      [["Wedding Platinum menu", "EV-0248 · Ayesha & Hamza", "300 (+20 requested)"], 1, "Customer asked for 20 more guests. Approve before 6 PM today."],
      [["Corporate lunch buffet", "EV-0249 · Nexus Summit", "150"], 2],
      [["Birthday hi-tea", "EV-0250 · Sara’s Birthday", "60"], 0],
      [["Annual dinner set menu", "EV-0252 · Vertex Textiles", "220"], 0],
    ],
  },
  decoration: {
    headers: ["Design brief", "Event", "Budget"], mode: "pipeline", money: [2], doneText: "✓ Set up",
    next: ["Send for costing →", "Send to customer →", "Approve design →", "Setup complete ✓"],
    rows: [
      [["Royal floral stage", "EV-0248 · Ayesha & Hamza", "PKR 220,000"], 3, "Setup on 24 Oct, 08:00 at Emerald Hall."],
      [["Corporate branding", "EV-0249 · Nexus Summit", "PKR 90,000"], 2],
      [["Pastel balloon theme", "EV-0250 · Sara’s Birthday", "PKR 45,000"], 1],
      [["Mehndi marigold setup", "EV-0251 · Hassan & Maira", "PKR 160,000"], 0],
    ],
  },
  rentals: {
    headers: ["Order", "Customer", "Items", "Deposit"], mode: "pipeline", prefix: "RO-", money: [3], doneText: "✓ Settled",
    next: ["Reserve items →", "Dispatch →", "Mark returned →", "Settle deposit →", "Close order ✓"],
    rows: [
      [["RO-301", "Bilal Catering", "120 chairs · 12 tables", "PKR 25,000"], 2],
      [["RO-302", "Sana Malik", "20 fairy light strings", "PKR 8,000"], 1],
      [["RO-303", "Nexus Pakistan", "Stage + sound system", "PKR 40,000"], 3, "Return due 26 Oct. The deposit is a liability until settled."],
      [["RO-304", "Imran Events", "30 chafing dishes", "PKR 15,000"], 0],
    ],
  },
  inventory: {
    headers: ["Movement", "Item", "Quantity", "Reference"], mode: "sections", prefix: "MV-",
    notes: ["Stock held for upcoming events.", "Stock issued out to events.", "Stock returned to the store.", "Stock moved between branches.", "Corrections for breakage, loss or recounts."],
    rows: [
      [["MV-501", "Banquet chairs", "300", "EV-0248"], 0],
      [["MV-502", "Dinner plates", "378", "EV-0248"], 0, "Only 42 plates left available. Reorder level is 60."],
      [["MV-503", "Fairy light strings", "40", "EV-0249"], 1],
      [["MV-504", "Chafing dishes", "30", "RO-304"], 2],
      [["MV-505", "Round tables", "20", "Main store → DHA Marquee"], 3],
      [["MV-506", "Wine glasses", "−12", "Breakage · EV-0247"], 4],
    ],
  },
  purchasing: {
    headers: ["Request", "Item", "Supplier", "Amount"], mode: "pipeline", prefix: "PR-", money: [3], doneText: "✓ Paid",
    next: ["Send for approval →", "Approve & create PO →", "Receive goods →", "Record supplier bill →", "Schedule payment →", "Mark paid ✓"],
    rows: [
      [["PR-701", "Dinner plates × 100", "Crockery House", "PKR 45,000"], 1, "Raised because dinner plates are below the reorder level."],
      [["PR-702", "Basmati rice · 200 kg", "Al-Noor Foods", "PKR 84,000"], 3],
      [["PR-703", "Fairy lights × 30", "Lahore Lights", "PKR 21,000"], 0],
      [["PR-704", "Table linen × 50", "Textile Hub", "PKR 37,500"], 4],
    ],
  },
  vendors: {
    headers: ["Supplier", "Service", "Balance"], mode: "pipeline", money: [2], doneText: "✓ Settled",
    next: ["Record bill →", "Pay advance →", "Make payment →", "Post to ledger →", "Close ✓"],
    rows: [
      [["Royal Florists", "Decoration", "PKR 70,000"], 3, "Payment due for EV-0248 floral decoration (EXP-2031)."],
      [["Al-Noor Foods", "Ingredients", "PKR 124,500"], 1],
      [["Rana Transport", "Logistics", "PKR 32,000"], 2, "Advance paid."],
      [["Sound Waves", "Audio & lighting", "PKR 55,000"], 0],
    ],
  },
  staff: {
    headers: ["Team member", "Role", "Shift"], mode: "pipeline", doneText: "✓ Paid",
    next: ["Assign to event →", "Check in →", "Calculate wages →", "Pay wages →", "Close ✓"],
    rows: [
      [["Sarah Raza", "Event Manager", "24 Oct · 08:00–23:00"], 2],
      [["Bilal Ahmed", "Floor Supervisor", "24 Oct · 15:00–23:00"], 1],
      [["Usman Ali", "Driver", "25 Oct · 07:30–19:00"], 0, "Shift conflict with TR-12 dispatch. Reassign before 24 Oct."],
      [["Ayesha Khan", "Waiter lead", "24 Oct · 16:00–23:30"], 3],
    ],
  },
  tasks: {
    headers: ["Task", "Event", "Due", "Owner"], mode: "pipeline", doneText: "✓ Archived",
    next: ["Start task →", "Send for review →", "Mark done →", "Archive ✓"],
    rows: [
      [["Setup at Emerald Hall", "EV-0248", "24 Oct · 08:00", "Sarah Raza"], 1],
      [["Approve guest count", "EV-0248", "Today", "AK"], 2],
      [["Confirm sound check", "EV-0249", "25 Oct · 10:00", "Bilal Ahmed"], 0],
      [["Collect rental returns", "RO-303", "26 Oct", "Usman Ali"], 0],
      [["Print seating plan", "EV-0248", "23 Oct", "Sarah Raza"], 3],
    ],
  },
  transport: {
    headers: ["Trip", "Route", "Vehicle"], mode: "pipeline", prefix: "TR-", doneText: "✓ Returned",
    next: ["Dispatch →", "Mark delivered →", "Get signature →", "Schedule pickup →", "Mark returned →", "Close trip ✓"],
    rows: [
      [["TR-11", "Store → Emerald Hall", "Shehzore · LEA-4521"], 2],
      [["TR-12", "Store → Nexus venue", "Suzuki Ravi · LHR-778"], 0, "Driver Usman Ali has a shift conflict."],
      [["TR-13", "Garden Marquee → Store", "Shehzore · LEA-4521"], 4],
    ],
  },
  billing: {
    headers: ["Invoice", "Customer", "Sales value", "Balance"], mode: "pipeline", prefix: "INV-", doneText: "✓ Closed",
    next: ["Record receipt →", "Update account →", "Add to daily closing →", "Close ✓"],
    rows: [
      [["INV-1031", "Ayesha & Hamza", "PKR 500,000", "PKR 150,000 due"], 1, "Received PKR 350,000 so far."],
      [["INV-1032", "Nexus Pakistan", "PKR 650,000", "Paid"], 3],
      [["INV-1033", "Sara Malik", "PKR 180,000", "PKR 180,000 due"], 0],
    ],
  },
  expenses: {
    headers: ["Reference", "Expense", "Amount"], mode: "pipeline", prefix: "EXP-", money: [2], doneText: "✓ Posted",
    next: ["Send for approval →", "Approve →", "Mark paid →", "Post to ledger ✓"],
    rows: [
      [["EXP-2031", "Royal Florists · EV-0248", "PKR 70,000"], 2, "Payable to Royal Florists."],
      [["EXP-2032", "Fuel & logistics", "PKR 18,500"], 3],
      [["EXP-2033", "Kitchen supplies", "PKR 42,000"], 1],
      [["EXP-2034", "Generator rent · EV-0249", "PKR 12,000"], 0],
    ],
  },
  reports: {
    headers: ["Report", "Period", "Prepared by"], mode: "sections",
    notes: ["Customer pipeline and quotation reports.", "Event schedules, catering and decoration reports.", "Invoices, receipts, expenses and vendor balances.", "Stock movements, rentals and purchasing."],
    rows: [
      [["Monthly sales summary", "Oct 2026", "AK"], 0],
      [["Booking pipeline", "Oct–Dec 2026", "AK"], 0],
      [["Upcoming events schedule", "Next 30 days", "Sarah Raza"], 1],
      [["Event services status", "Oct 2026", "Sarah Raza"], 1],
      [["Receivables & payables", "As of 19 Oct 2026", "Imran Qureshi"], 2],
      [["Expense ledger", "Oct 2026", "Imran Qureshi"], 2],
      [["Stock movements", "Oct 2026", "Store keeper"], 3],
      [["Rentals & purchasing", "Oct 2026", "Store keeper"], 3],
    ],
  },
  settings: {
    headers: ["Name", "Details", "Info"], mode: "sections",
    notes: ["People who can sign in to the workspace.", "Role templates and what each role can access.", "Sensitive actions and who may perform them.", "Business-wide defaults.", "Recent changes made by users."],
    rows: [
      [["AK", "Owner / Admin · ak@eventra.pk", "Active now"], 0],
      [["Sarah Raza", "Event Manager · sarah@eventra.pk", "2 hours ago"], 0],
      [["Imran Qureshi", "Accountant · imran@eventra.pk", "Yesterday"], 0],
      [["Owner / Admin", "Full access to every module", "1 user"], 1],
      [["Event Manager", "Events, staff, tasks and calendar", "1 user"], 1],
      [["Accountant", "Billing, expenses and cash closing", "1 user"], 1],
      [["Approve discounts", "Owner / Admin, Event Manager", "Quotations"], 2],
      [["Close cash drawer", "Owner / Admin, Accountant", "Cash"], 2],
      [["Business name", "AK Event Management", "All branches"], 3],
      [["Currency & tax", "PKR · GST 16%", "All branches"], 3],
      [["Branches", "Lahore Main, DHA Marquee, Gulberg Office", "3 active"], 3],
      [["AK approved QT-1048", "Quotations & Packages", "19 Oct · 09:50"], 4],
      [["Sarah Raza updated EV-0248", "Events & Bookings", "19 Oct · 09:12"], 4],
      [["Imran Qureshi recorded INV-1032", "Billing & Receipts", "18 Oct · 17:40"], 4],
    ],
  },
};

const ruleText: Record<string, string> = {
  customers: "Every inquiry keeps its full history. A customer is only marked booked once a quotation has been converted.",
  quotations: "Package inclusions cannot be charged twice. Approved rates are locked; changes create a new revision.",
  events: "Operational status and payment status remain separate. Rescheduling triggers a fresh venue, staff and stock check.",
  venues: "Reservations include setup and cleanup windows. Capacity and overlapping holds are validated before confirmation.",
  catering: "Guest count changes after menu approval update production quantities and the final invoice.",
  decoration: "Designs need customer approval before materials are purchased or setup is scheduled.",
  inventory: "Available quantity = usable stock − overlapping reservations − issued stock. Consumables and returnable assets use separate movements.",
  rentals: "Refundable security deposits are liabilities and are displayed separately from sales revenue.",
  purchasing: "Purchases follow request → approval → order → receipt → bill → payment. Nothing is paid without a goods receipt.",
  vendors: "Advances reduce the vendor balance. Commitments are not expenses until a bill is recorded.",
  staff: "Staff cannot be assigned to overlapping shifts. Wages are calculated from check-in records.",
  tasks: "Overdue tasks are escalated to the event manager. Completed tasks are archived with the event.",
  transport: "Deliveries need a customer signature before pickup and return can be scheduled.",
  billing: "Receipts reduce invoice balances and update the selected account without creating duplicate sales revenue.",
  expenses: "Expense recognition is separate from payment. Settling a vendor bill does not recognize the expense twice.",
  reports: "Reports are generated from live records. Download any report as a CSV spreadsheet.",
  settings: "Every change is recorded in the activity log with user, time, previous value and new value.",
};

const weddingImage = "https://images.unsplash.com/photo-1779308936221-89739e035a53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";
const corporateImage = "https://images.unsplash.com/photo-1763231575952-98244918f99b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
const birthdayImage = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

const workflowOf = (id: string) => modules.find(m => m.id === id)?.workflow ?? [];
const labelOf = (id: string) => modules.find(m => m.id === id)?.label ?? id;
const isDone = (id: string, r: Rec) => configs[id].mode === "pipeline" && !configs[id].cycle && r.stage >= workflowOf(id).length;
const stageText = (id: string, r: Rec) => isDone(id, r) ? configs[id].doneText ?? "✓ Completed" : workflowOf(id)[r.stage];
const nextText = (id: string, r: Rec) => {
  const wf = workflowOf(id);
  return configs[id].next?.[r.stage] ?? (r.stage < wf.length - 1 ? `Move to ${wf[r.stage + 1]} →` : "Complete ✓");
};
const advanceStage = (id: string, r: Rec) => configs[id].cycle && r.stage >= workflowOf(id).length - 1 ? 0 : r.stage + 1;
const seedRecords = (): Record<string, Rec[]> => Object.fromEntries(Object.entries(configs).map(([id, config]) => [id, config.rows.map(([cells, stage, note], i) => ({ key: `${id}-${i}`, cells, stage, note }))]));

const toNumber = (text: string) => Number(text.replace(/[^0-9.-]/g, "")) || 0;
const pkr = (value: number) => `PKR ${value.toLocaleString("en-US")}`;
const dueOf = (invoice: Rec) => invoice.cells[3].includes("due") ? toNumber(invoice.cells[3]) : 0;
const nextId = (list: Rec[], prefix: string) => {
  const numbers = list.map(r => parseInt(r.cells[0].replace(prefix, ""), 10)).filter(n => !isNaN(n));
  const width = list[0] ? list[0].cells[0].length - prefix.length : 3;
  return prefix + String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(width, "0");
};

const toCsv = (rows: string[][]) => rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
function downloadFile(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([type === "text/csv" ? `\uFEFF${content}` : content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const moduleCsv = (records: Record<string, Rec[]>, ids: string[]) => toCsv(ids.flatMap(id => [
  [labelOf(id).toUpperCase()],
  [...configs[id].headers, configs[id].mode === "pipeline" ? "Stage" : "Section", "Note"],
  ...records[id].map(r => [...r.cells, stageText(id, r), r.note ?? ""]),
  [],
]));
function parseCsv(text: string) {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const reportSections = [["customers", "quotations"], ["events", "catering", "decoration"], ["billing", "expenses", "vendors"], ["inventory", "rentals", "purchasing"]];

function ImportExport({ name, template, hint, onExport, onImport }: { name: string; template: string[][]; hint: string; onExport: () => void; onImport: (rows: string[][]) => void }) {
  const [open, setOpen] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!(event.target as Element).closest(".io-wrap")) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return <div className="io-group">
    <div className="tool-menu-wrap io-wrap"><Button variant="secondary" onClick={() => setOpen(!open)}>↑ Import</Button>{open && <div className="tool-menu io-menu">
      <small>IMPORT FROM CSV / EXCEL</small>
      <button onClick={() => { setOpen(false); file.current?.click(); }}>Choose CSV file…<b>↑</b></button>
      <button onClick={() => { downloadFile(`${name}-template.csv`, toCsv(template)); setOpen(false); }}>Download template<b>↓</b></button>
      <p>{hint}</p>
    </div>}</div>
    <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={async event => { const chosen = event.target.files?.[0]; event.target.value = ""; if (chosen) onImport(parseCsv(await chosen.text())); }} />
    <Button variant="secondary" onClick={onExport}>↓ Export</Button>
  </div>;
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Button({ children, variant = "primary", onClick }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; onClick?: () => void }) {
  return <button className={`button ${variant}`} onClick={onClick}>{children}</button>;
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`badge ${tone}`}><i />{children}</span>;
}

function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  if (onClick) return <button className={`card clickable-card ${className}`} onClick={onClick}>{children}</button>;
  return <section className={`card ${className}`}>{children}</section>;
}

function BackButton({ onClick, label = "Back to dashboard" }: { onClick: () => void; label?: string }) {
  return <button className="back" onClick={onClick}><span aria-hidden="true">←</span>{label}</button>;
}

function AkLogo() {
  const wave = "M0 64 C 34 58, 60 80, 100 70 S 160 46, 200 56";
  const letters = (a: string, k: string) => <>
    <text x="64" y="90" fill={a}>A</text>
    <text x="140" y="90" fill={k}>K</text>
  </>;
  return <svg className="ak-logo" viewBox="0 18 200 80" role="img" aria-label="AK">
    <defs>
      <linearGradient id="ak-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3dfae" /><stop offset=".5" stopColor="#be9b61" /><stop offset="1" stopColor="#95733c" /></linearGradient>
      <clipPath id="ak-top"><path d={`${wave} V0 H0 Z`} /></clipPath>
      <clipPath id="ak-bottom"><path d={`${wave} V100 H0 Z`} transform="translate(0,10)" /></clipPath>
    </defs>
    <g className="ak-letters">
      <g clipPath="url(#ak-top)">{letters("url(#ak-gold)", "#f6eedd")}</g>
      <g clipPath="url(#ak-bottom)">{letters("#f6eedd", "url(#ak-gold)")}</g>
    </g>
    <path d="M2 65 C 36 58, 60 80, 100 70 C 140 60, 162 46, 198 56 C 162 51, 140 66, 100 76.5 C 60 87, 36 62, 2 65 Z" fill="#f6eedd" />
  </svg>;
}

function Sidebar({ active, setActive, open, close }: { active: string; setActive: (id: string) => void; open: boolean; close: () => void }) {
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand" aria-label="AK Event Management"><AkLogo /><small>EVENT MANAGEMENT</small></div>
    <nav>
      {modules.filter(item => !item.hidden).map((item, index) => <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => { setActive(item.id); close(); }}>
        <Icon>{item.icon}</Icon><span className="nav-no">{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span>
      </button>)}
    </nav>
    <div className="sidebar-foot">LAHORE · PAKISTAN<strong>Celebrations made better.</strong></div>
  </aside>;
}

const stats = [
  ["Upcoming events", "12", "4 events this week", "◇"],
  ["Today’s collections", "PKR 250,000", "Cash 100,000 · Bank 150,000", "▣"],
  ["Pending recovery", "PKR 430,000", "2 invoices awaiting payment", "◷"],
  ["Event margin", "PKR 180,000", "EV-0248 · before overheads", "▥"],
];

const events = [
  { id: "EV-0248", name: "Ayesha & Hamza Wedding", date: "24 Oct 2026", place: "Emerald Hall", guests: "300 guests", status: "Confirmed", tone: "green" as const, image: weddingImage },
  { id: "EV-0249", name: "Nexus Corporate Summit", date: "25 Oct 2026", place: "Client venue", guests: "150 guests", status: "Planning", tone: "amber" as const, image: corporateImage },
  { id: "EV-0250", name: "Sara’s Birthday", date: "26 Oct 2026", place: "Garden Marquee", guests: "60 guests", status: "Pending", tone: "red" as const, image: birthdayImage },
];

function Header({ menu, navigate, records }: { menu: () => void; navigate: (id: string) => void; records: Record<string, Rec[]> }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [branch, setBranch] = useState("Lahore Main");
  const [viewMonth, setViewMonth] = useState(new Date(2026, 9, 1));
  const [draftStart, setDraftStart] = useState<Date | null>(new Date(2026, 9, 19));
  const [draftEnd, setDraftEnd] = useState<Date | null>(new Date(2026, 9, 25));
  const [dateLabel, setDateLabel] = useState("19–25 Oct 2026");
  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".date-picker-wrap, .branch-wrap, .notification-wrap, .profile-wrap")) {
        setCalendarOpen(false);
        setBranchOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
      if (!target.closest(".search-wrap")) setSearchOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);
  const monthName = viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingDays = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7;
  const pickDate = (day: number) => {
    const selected = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (!draftStart || draftEnd) {
      setDraftStart(selected);
      setDraftEnd(null);
    } else if (selected < draftStart) {
      setDraftStart(selected);
    } else {
      setDraftEnd(selected);
    }
  };
  const formatShort = (date: Date) => date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const applyDates = () => {
    if (draftStart) {
      setDateLabel(draftEnd
        ? `${draftStart.getDate()}–${draftEnd.getDate()} ${draftEnd.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
        : formatShort(draftStart));
    }
    setCalendarOpen(false);
  };
  const q = query.trim().toLowerCase();
  const results = q.length < 2 ? [] : [
    ...modules.filter(m => !m.hidden && m.label.toLowerCase().includes(q)).map(m => ({ key: m.id, title: m.label, sub: "Open page", id: m.id })),
    ...Object.entries(records).flatMap(([id, list]) => list.filter(r => r.cells.join(" ").toLowerCase().includes(q)).map(r => ({ key: r.key, title: r.cells[0], sub: `${labelOf(id)} · ${r.cells[1]}`, id }))),
  ].slice(0, 8);
  const go = (id: string) => { navigate(id); setQuery(""); setSearchOpen(false); };
  const closeOthers = () => { setCalendarOpen(false); setBranchOpen(false); setNotificationOpen(false); setProfileOpen(false); };
  return <header className="topbar">
    <button className="menu-button" onClick={menu} aria-label="Open menu">☰</button>
    <div className="search-wrap">
      <div className="search"><Icon>⌕</Icon><input aria-label="Global search" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === "Enter" && results[0]) go(results[0].id); if (event.key === "Escape") setSearchOpen(false); }} placeholder="Search events, customers, invoices…" /></div>
      {searchOpen && q.length >= 2 && <div className="search-results">
        {results.length ? results.map(result => <button key={result.key} onClick={() => go(result.id)}><b>{result.title}</b><small>{result.sub}</small></button>) : <div className="search-empty">No results for “{query}”</div>}
      </div>}
    </div>
    <div className="header-tools">
      <div className="date-picker-wrap">
        <button className={`top-date ${calendarOpen ? "active" : ""}`} onClick={() => { closeOthers(); setCalendarOpen(!calendarOpen); }}><Icon>▣</Icon><span>{dateLabel}</span><b>⌄</b></button>
        {calendarOpen && <div className="date-popover">
          <div className="date-popover-head"><button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>‹</button><strong>{monthName}</strong><button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>›</button></div>
          <div className="mini-calendar">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span className="mini-weekday" key={`${day}-${index}`}>{day}</span>)}
            {Array.from({ length: leadingDays }, (_, index) => <i key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const inRange = !!draftStart && !!draftEnd && date >= draftStart && date <= draftEnd;
              const isStart = !!draftStart && date.getTime() === draftStart.getTime();
              const isEnd = !!draftEnd && date.getTime() === draftEnd.getTime();
              return <button onClick={() => pickDate(day)} key={day} className={`${inRange || isStart ? "selected" : ""} ${isStart ? "range-start" : ""} ${isEnd ? "range-end" : ""}`}>{day}</button>;
            })}
          </div>
          <div className="date-popover-actions"><span>{draftStart ? formatShort(draftStart) : "Select start"}{draftEnd ? ` – ${formatShort(draftEnd)}` : ""}</span><Button onClick={applyDates}>Apply</Button></div>
        </div>}
      </div>
      <div className="branch-wrap">
        <button className={`branch-button ${branchOpen ? "active" : ""}`} onClick={() => { closeOthers(); setBranchOpen(!branchOpen); }}><span>{branch}</span><b>⌄</b></button>
        {branchOpen && <div className="branch-menu">
          <small>SELECT BRANCH</small>
          {["Lahore Main", "DHA Marquee", "Gulberg Office"].map(item => <button className={branch === item ? "selected" : ""} key={item} onClick={() => { setBranch(item); setBranchOpen(false); }}><span>{item}</span>{branch === item && <b>✓</b>}</button>)}
        </div>}
      </div>
      <div className="notification-wrap">
        <button className={`notification ${notificationOpen ? "active" : ""}`} aria-label="Notifications" onClick={() => { closeOthers(); setNotificationOpen(!notificationOpen); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i />
        </button>
        {notificationOpen && <div className="notification-panel">
          <div className="notification-head"><div><small>NOTIFICATIONS</small><strong>Needs your attention</strong></div><button onClick={() => setNotificationOpen(false)}>×</button></div>
          <button onClick={() => { navigate("catering"); setNotificationOpen(false); }}><i className="amber" /><span><b>Guest count approval due</b><small>Ayesha & Hamza · 12 minutes ago</small></span></button>
          <button onClick={() => { navigate("inventory"); setNotificationOpen(false); }}><i className="red" /><span><b>Low stock: dinner plates</b><small>Only 42 available · 35 minutes ago</small></span></button>
          <button onClick={() => { navigate("billing"); setNotificationOpen(false); }}><i className="green" /><span><b>Payment received</b><small>PKR 100,000 · INV-1031</small></span></button>
          <button className="notification-footer" onClick={() => { navigate("tasks"); setNotificationOpen(false); }}>View all tasks →</button>
        </div>}
      </div>
      <div className="profile-wrap">
        <button className={`profile ${profileOpen ? "active" : ""}`} onClick={() => { closeOthers(); setProfileOpen(!profileOpen); }}><span>AK</span><div><b>AK</b><small>Owner / Admin</small></div><i>⌄</i></button>
        {profileOpen && <div className="profile-menu">
          <div className="profile-summary"><span>AK</span><div><b>AK</b><small>Owner / Admin</small></div></div>
          <button onClick={() => { navigate("profile"); setProfileOpen(false); }}>My profile</button>
          <button onClick={() => { navigate("settings"); setProfileOpen(false); }}>Users & settings</button>
          <button onClick={() => { navigate("settings"); setProfileOpen(false); }}>Activity log</button>
          <button className="sign-out" onClick={() => setProfileOpen(false)}>Sign out</button>
        </div>}
      </div>
    </div>
  </header>;
}

function Dashboard({ openEvent, openAction, navigate }: { openEvent: (id: string) => void; openAction: (name: string) => void; navigate: (id: string) => void }) {
  const [doneTasks, setDoneTasks] = useState<number[]>([0]);
  const [openTask, setOpenTask] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(5);
  const [quickClicked, setQuickClicked] = useState("New Booking");
  const [quickHover, setQuickHover] = useState<string | null>(null);
  const quickActive = quickHover ?? quickClicked;
  const attentionTasks = [
    { title: "Setup at Emerald Hall", note: "EV-0248 · 08:00 AM", category: "Event setup", priority: "High", module: "events", moduleLabel: "Events & Bookings",
      details: [["Event", "Ayesha & Hamza Wedding"], ["Venue", "Emerald Hall"], ["Event date", "Saturday, 24 Oct 2026"], ["Setup starts", "08:00 AM"], ["Assigned to", "Sarah Raza · Event Manager"]],
      description: "Stage, lighting and floral decoration must be ready before guest arrival. Confirm the decoration team and transport have reached the venue." },
    { title: "Approve guest count", note: "Due today · Catering", category: "Catering", priority: "High", module: "catering", moduleLabel: "Catering & Menus",
      details: [["Event", "Ayesha & Hamza Wedding"], ["Planned guests", "300"], ["Requested change", "+20 guests"], ["Deadline", "Today, 19 Oct 2026"], ["Department", "Catering"]],
      description: "The customer has asked to increase the guest count. Approving it updates the catering quantities and the final invoice." },
    { title: "Vendor payment due", note: "Royal Florists · PKR 70,000", category: "Payment", priority: "Medium", module: "vendors", moduleLabel: "Vendors & Suppliers",
      details: [["Vendor", "Royal Florists"], ["Amount", "PKR 70,000"], ["Expense", "EXP-2031 · EV-0248"], ["Service", "Decoration"], ["Status", "Payable"]],
      description: "Floral decoration payment for EV-0248 is due. Record the payment once it has been made to clear the payable balance." },
    { title: "Low stock: dinner plates", note: "42 available · reorder at 60", category: "Inventory", priority: "Medium", module: "inventory", moduleLabel: "Inventory & Stock",
      details: [["Item", "Dinner plates"], ["Available", "42"], ["Reorder level", "60"], ["Required for EV-0248", "300"], ["Location", "Main store"]],
      description: "Stock is below the reorder level. Create a purchase order or arrange a rental before the upcoming events." },
  ];
  const task = openTask === null ? null : attentionTasks[openTask];
  const toggleDone = (index: number) => setDoneTasks(list => list.includes(index) ? list.filter(i => i !== index) : [...list, index]);
  return <>
    <div className="page-heading">
      <div><small>WORKSPACE / BUSINESS OVERVIEW</small><h1>Every event, beautifully managed.</h1><p>Monday, 19 October 2026 · Lahore</p></div>
      <div className="quick-actions" onMouseLeave={() => setQuickHover(null)}>{["New Booking", "Create Quotation", "Record Payment", "Add Expense"].map(x => <button key={x} className={`button ${quickActive === x ? "primary" : "secondary"}`} onMouseEnter={() => setQuickHover(x)} onFocus={() => setQuickHover(x)} onBlur={() => setQuickHover(null)} onClick={() => { setQuickClicked(x); openAction(x); }}>{x}</button>)}</div>
    </div>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,22,38,.92),rgba(10,22,38,.15)),url("${weddingImage}")` }}>
      <div><small>WEDDINGS · CORPORATE · BIRTHDAYS · CATERING · RENTALS</small><h2>Your next unforgettable<br />event starts here.</h2><p>One connected workspace from first inquiry to final settlement.</p></div>
    </section>
    <div className="stats-grid">{stats.map(([label, value, note, icon], index) => <Card key={label} className="stat" onClick={() => navigate(["events", "cash", "billing", "reports"][index])}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><b>↗</b></Card>)}</div>
    <div className="section-title"><div><Icon>◇</Icon><h3>Upcoming events</h3></div><Button variant="ghost" onClick={() => navigate("calendar")}>View calendar →</Button></div>
    <div className="event-grid">{events.map(event => <Card key={event.name} className="event-card">
      <div className="event-image" style={{ backgroundImage: `url("${event.image}")` }}><Badge tone={event.tone}>{event.status}</Badge></div>
      <div className="event-copy"><h3>{event.name}</h3><div className="event-meta"><span>□ {event.date}</span><span>⌖ {event.place}</span><span>◎ {event.guests}</span></div><div className="event-footer"><div className="avatars"><i>AK</i><i>SR</i><i>+3</i></div><Button variant="secondary" onClick={() => openEvent(event.id)}>View details →</Button></div></div>
    </Card>)}</div>
    <div className="dashboard-bottom">
      <Card onClick={() => navigate("calendar")}><div className="section-title compact"><div><Icon>□</Icon><h3>Weekly booking calendar</h3></div><Badge tone="amber">19–25 October</Badge></div>
        <div className="week">{["Mon 19|1 event", "Tue 20|2 events", "Wed 21|1 event", "Thu 22|Open", "Fri 23|2 events", "Sat 24|Wedding", "Sun 25|Summit"].map((d, i) => { const [day, note] = d.split("|"); return <div className={selectedDay === i ? "selected" : ""} key={d} onClick={event => { event.stopPropagation(); setSelectedDay(i); }}><span>{day}</span><b>{note}</b><i /></div>; })}</div>
      </Card>
      <Card onClick={() => navigate("tasks")}><div className="section-title compact"><div><Icon>☷</Icon><h3>Needs attention</h3></div><span className="count">6</span></div>
        <div className="task-list">{attentionTasks.map(({ title, note }, index) => { const done = doneTasks.includes(index); return <div className={`${done ? "task-complete" : ""} ${openTask === index ? "task-open" : ""}`} key={title} onClick={event => { event.stopPropagation(); setOpenTask(index); }}><i className={`check ${done ? "done" : index > 1 ? "warning" : ""}`}>{done ? "✓" : index > 1 ? "!" : ""}</i><span><b>{title}</b><small>{note}</small></span></div>; })}</div>
      </Card>
    </div>
    {task && openTask !== null && <div className="modal-backdrop" onMouseDown={() => setOpenTask(null)}><div className="modal task-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><small>NEEDS ATTENTION · {task.category.toUpperCase()}</small><h2>{task.title}</h2></div><button onClick={() => setOpenTask(null)} aria-label="Close">×</button></div>
      <div className="task-badges"><Badge tone={task.priority === "High" ? "red" : "amber"}>{task.priority} priority</Badge>{doneTasks.includes(openTask) ? <Badge tone="green">Completed</Badge> : <Badge tone="navy">Open</Badge>}</div>
      <div className="mini-list">{task.details.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}</b></p>)}</div>
      <div className="modal-note">{task.description}</div>
      <div className="modal-actions"><Button variant="ghost" onClick={() => { setOpenTask(null); navigate(task.module); }}>Open {task.moduleLabel} →</Button><Button variant="secondary" onClick={() => toggleDone(openTask)}>{doneTasks.includes(openTask) ? "Mark as open" : "Mark as done"}</Button><Button onClick={() => setOpenTask(null)}>Close</Button></div>
    </div></div>}
  </>;
}

function FinanceSummary({ invoice, received, outstanding, costs, paid, title = "Invoiced sales" }: { invoice: number; received: number; outstanding: number; costs: number; paid: number; title?: string }) {
  return <div className="finance-panel">
    <div><span>{title}</span><b>{pkr(invoice)}</b></div><div><span>Customer received</span><b>{pkr(received)}</b></div><div><span>Customer outstanding</span><b>{pkr(outstanding)}</b></div>
    <div><span>Recorded costs</span><b>{pkr(costs)}</b></div><div><span>Costs paid</span><b>{pkr(paid)}</b></div><div><span>Costs payable</span><b>{pkr(costs - paid)}</b></div>
    <div className="margin"><span>Margin before overhead</span><b>{pkr(invoice - costs)}</b><small>Profitability metric — not available cash</small></div>
  </div>;
}

function PageTitle({ module, action }: { module: Module; action: () => void }) {
  return <div className="page-heading module-title"><div><small>AK / {module.label.toUpperCase()}</small><h1>{module.label}</h1><p>{module.subtitle}</p></div><Button onClick={action}>{module.id === "reports" ? "↓" : "＋"} {module.action}</Button></div>;
}

function RecordsPage({ module, records, action, back, update, remove, openEvent, notify, importRows }: { module: Module; records: Record<string, Rec[]>; action: () => void; back: () => void; update: (key: string, change: (r: Rec) => Rec) => void; remove: (key: string) => void; openEvent: (id: string) => void; notify: (message: string) => void; importRows: (items: { cells: string[]; stage: number; note?: string }[]) => { added: number; updated: number } }) {
  const config = configs[module.id];
  const list = records[module.id];
  const wf = module.workflow;
  const pipeline = config.mode === "pipeline";
  const [stage, setStage] = useState(-1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "done">("all");
  const [hidden, setHidden] = useState<number[]>([]);
  const [menu, setMenu] = useState<"filters" | "columns" | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  useEffect(() => {
    const closeMenus = (event: MouseEvent) => { if (!(event.target as Element).closest(".tool-menu-wrap")) setMenu(null); };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);
  const stageOf = (r: Rec) => Math.min(r.stage, wf.length - 1);
  const done = (r: Rec) => isDone(module.id, r);
  const inStage = stage === -1 ? list : list.filter(r => stageOf(r) === stage);
  const visible = inStage.filter(r => (status === "all" || (status === "done") === done(r)) && [...r.cells, r.note ?? "", stageText(module.id, r)].join(" ").toLowerCase().includes(search.toLowerCase()));
  const columns = config.headers.map((header, index) => ({ header, index })).filter(c => !hidden.includes(c.index));
  const grid = { gridTemplateColumns: `${columns.map(c => c.index === 1 ? "1.4fr" : "1fr").join(" ")} ${pipeline ? "1.6fr" : "1fr"} 84px` };
  const advance = (r: Rec) => update(r.key, x => ({ ...x, stage: advanceStage(module.id, x) }));
  const open = list.find(r => r.key === openKey);
  const editing = list.find(r => r.key === editKey);
  const csvHeader = [...config.headers, pipeline ? "Stage" : "Section", "Note"];
  const exportCsv = () => { downloadFile(`${module.id}.csv`, toCsv([csvHeader, ...visible.map(r => [...r.cells, stageText(module.id, r), r.note ?? ""])])); notify(`${visible.length} records exported`); };
  const stageNames = pipeline && !config.cycle ? [...wf, config.doneText ?? "Completed"] : wf;
  const importCsv = (rows: string[][]) => {
    const data = rows.filter(r => normalize(r[0] ?? "") !== normalize(config.headers[0]) && !(r.filter(c => c.trim()).length === 1 && normalize(r[0]) === normalize(module.label)));
    let skipped = 0;
    const items = data.flatMap(r => {
      const cells = config.headers.map((_, i) => {
        const value = (r[i] ?? "").trim();
        return config.money?.includes(i) && /^[\d,]+$/.test(value) ? pkr(toNumber(value)) : value;
      });
      if (cells.some((cell, i) => !cell && !(i === 0 && config.prefix))) { skipped++; return []; }
      const stageCell = normalize(r[config.headers.length] ?? "");
      const found = stageNames.findIndex(step => normalize(step) === stageCell);
      const stage = found >= 0 ? found : ["completed", "done"].includes(stageCell) && stageNames.length > wf.length ? wf.length : 0;
      const note = (r[config.headers.length + 1] ?? "").trim() || undefined;
      return [{ cells, stage, note }];
    });
    if (!items.length) { notify("No valid rows found in the file"); return; }
    const { added, updated } = importRows(items);
    notify(`Imported: ${added} added, ${updated} updated${skipped ? `, ${skipped} skipped` : ""}`);
  };
  const sum = (id: string, test: (r: Rec) => boolean, cell: number) => records[id].filter(test).reduce((total, r) => total + toNumber(r.cells[cell]), 0);
  const showFinance = ["billing", "expenses", "reports"].includes(module.id);
  const sales = sum("billing", () => true, 2);
  const outstanding = records.billing.reduce((total, r) => total + dueOf(r), 0);
  const active = list.filter(r => !done(r)).length;
  return <>
    <BackButton onClick={back} />
    <PageTitle module={module} action={action} />
    <div className="workflow">
      <div className={stage === -1 ? "active" : ""} onClick={() => setStage(-1)}><i>∑</i><span>All</span><em className="step-count">{list.length}</em><b className="divider" /></div>
      {wf.map((step, i) => <div key={step} className={i === stage ? "active" : ""} onClick={() => setStage(stage === i ? -1 : i)}><i>{i + 1}</i><span>{step}</span><em className="step-count">{list.filter(r => stageOf(r) === i).length}</em>{i < wf.length - 1 && <b>→</b>}</div>)}
    </div>
    {showFinance && <FinanceSummary invoice={sales} received={sales - outstanding} outstanding={outstanding} costs={sum("expenses", () => true, 2)} paid={sum("expenses", r => r.stage >= 3, 2)} />}
    <Card className="stage-summary"><div>
      <small>{stage === -1 ? `ALL ${pipeline ? "STAGES" : "SECTIONS"}` : `${pipeline ? "STAGE" : "SECTION"} ${stage + 1} OF ${wf.length}`}</small>
      <h3>{stage === -1 ? `All ${module.label.toLowerCase()}` : wf[stage]}</h3>
      <p>{stage === -1 ? `Showing every record. Select a ${pipeline ? "stage" : "section"} above to narrow the list${pipeline ? ", or use the button on a row to move it forward" : ""}.` : config.notes?.[stage] ?? `Records currently at the ${wf[stage].toLowerCase()} stage. Use the button on a row to move it forward.`}</p>
    </div><Badge tone={pipeline ? "amber" : "navy"}>{visible.length} {visible.length === 1 ? "record" : "records"}</Badge></Card>
    <div className="toolbar">
      <div className="search table-search"><Icon>⌕</Icon><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${module.label.toLowerCase()}…`} /></div>
      {pipeline && !config.cycle && <div className="tool-menu-wrap"><Button variant="secondary" onClick={() => setMenu(menu === "filters" ? null : "filters")}>{status === "all" ? "Filters" : status === "active" ? "Filters · In progress" : "Filters · Completed"}</Button>{menu === "filters" && <div className="tool-menu"><small>STATUS</small>{(["all", "active", "done"] as const).map(value => <button key={value} className={status === value ? "selected" : ""} onClick={() => { setStatus(value); setMenu(null); }}>{value === "all" ? "All records" : value === "active" ? "In progress" : "Completed"}<b>{status === value ? "✓" : ""}</b></button>)}</div>}</div>}
      <div className="tool-menu-wrap"><Button variant="secondary" onClick={() => setMenu(menu === "columns" ? null : "columns")}>Columns</Button>{menu === "columns" && <div className="tool-menu"><small>VISIBLE COLUMNS</small>{config.headers.map((header, index) => <button key={header} disabled={index === 0} onClick={() => setHidden(prev => prev.includes(index) ? prev.filter(x => x !== index) : [...prev, index])}>{header}<b>{hidden.includes(index) ? "" : "✓"}</b></button>)}</div>}</div>
      <span className="spacer" /><ImportExport name={module.id} template={[csvHeader, [...(config.rows[0]?.[0] ?? []), stageNames[0], "Optional note"]]} hint={`Columns: ${csvHeader.join(", ")}. Rows with an existing ${config.headers[0].toLowerCase()} are updated, new ones are added.`} onExport={exportCsv} onImport={importCsv} />
    </div>
    <Card className="table-card"><div className="data-table">
      <div className="table-row table-header" style={grid}>{columns.map(c => <span key={c.header}>{c.header}</span>)}<span>{pipeline ? "Stage" : "Section"}</span><span /></div>
      {visible.length ? visible.map(r => <div className="table-row record-row" style={grid} key={r.key} onClick={() => setOpenKey(r.key)}>
        {columns.map(c => <span key={c.header}>{c.index === 0 && <i className="record-icon">{module.icon}</i>}{r.cells[c.index]}</span>)}
        <span className="quote-status"><em className={done(r) ? "booked" : pipeline ? "" : "section"}>{stageText(module.id, r)}</em>{pipeline && !done(r) && <button onClick={event => { event.stopPropagation(); advance(r); }}>{nextText(module.id, r)}</button>}</span>
        <span className="row-actions"><button aria-label={`Edit ${r.cells[0]}`} onClick={event => { event.stopPropagation(); setEditKey(r.key); }}>✎ Edit</button></span>
      </div>) : <div className="empty-state"><b>No records found</b><span>Try a different search, filter or {pipeline ? "stage" : "section"}.</span></div>}
    </div></Card>
    <div className="info-grid">
      <Card><div className="card-head"><div><small>BUSINESS RULE</small><h3>{module.label} controls</h3></div><Icon>i</Icon></div><p className="muted">{ruleText[module.id] ?? "Changes remain traceable with user, timestamp, previous value, new value and reason."}</p></Card>
      <Card><div className="card-head"><div><small>WORK QUEUE</small><h3>Summary</h3></div><Badge tone={active ? "amber" : "green"}>{pipeline && !config.cycle ? `${active} open` : `${list.length} total`}</Badge></div>
        <div className="mini-list">{pipeline && !config.cycle
          ? <><p><span>In progress</span><b>{active}</b></p><p><span>Completed</span><b>{list.length - active}</b></p><p><span>Total records</span><b>{list.length}</b></p></>
          : wf.map((step, i) => <p key={step}><span>{step}</span><b>{list.filter(r => stageOf(r) === i).length}</b></p>)}</div>
      </Card>
    </div>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpenKey(null)}><div className="modal task-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><small>{module.label.toUpperCase()}</small><h2>{open.cells[0]}</h2></div><button onClick={() => setOpenKey(null)} aria-label="Close">×</button></div>
      <div className="task-badges"><Badge tone={done(open) ? "green" : pipeline ? "amber" : "navy"}>{stageText(module.id, open)}</Badge></div>
      <div className="mini-list">{config.headers.map((header, i) => <p key={header}><span>{header}</span><b>{open.cells[i]}</b></p>)}</div>
      {open.note && <div className="modal-note">{open.note}</div>}
      {pipeline && <div className="stage-track">{wf.map((step, i) => <span key={step} className={i < open.stage ? "passed" : i === open.stage ? "current" : ""}>{i < open.stage ? "✓ " : ""}{step}</span>)}</div>}
      <div className="modal-actions">
        <Button variant="ghost" onClick={() => { if (window.confirm(`Delete ${open.cells[0]}?`)) { remove(open.key); setOpenKey(null); } }}>Delete</Button>
        <Button variant="secondary" onClick={() => { setOpenKey(null); setEditKey(open.key); }}>✎ Edit</Button>
        {module.id === "events" && eventDetails[open.cells[0]] && <Button variant="secondary" onClick={() => openEvent(open.cells[0])}>Open event details →</Button>}
        {module.id === "reports" && <Button variant="secondary" onClick={() => downloadFile(`${open.cells[0].toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, moduleCsv(records, reportSections[open.stage]))}>↓ Download report</Button>}
        {pipeline && !done(open) && <Button variant="secondary" onClick={() => advance(open)}>{nextText(module.id, open)}</Button>}
        <Button onClick={() => setOpenKey(null)}>Close</Button>
      </div>
    </div></div>}
    {editing && <RecordFormModal module={module} list={list} initial={editing} close={() => setEditKey(null)} save={(cells, stage, note) => { update(editing.key, r => ({ ...r, cells, stage, note })); notify(`${cells[0]} updated`); setEditKey(null); }} />}
  </>;
}

function RecordFormModal({ module, list, initial, close, save }: { module: Module; list: Rec[]; initial?: Rec; close: () => void; save: (cells: string[], stage: number, note?: string) => void }) {
  const config = configs[module.id];
  const [values, setValues] = useState<string[]>(initial ? [...initial.cells] : config.headers.map(() => ""));
  const [stage, setStage] = useState(initial?.stage ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const suggested = config.prefix ? nextId(list, config.prefix) : "";
  const autoRef = (i: number) => i === 0 && !!config.prefix && !initial;
  const example = config.rows[0]?.[0] ?? [];
  const stages = config.mode === "pipeline" && !config.cycle ? [...module.workflow, config.doneText ?? "✓ Completed"] : module.workflow;
  const submit = () => {
    const errors: Record<number, string> = {};
    config.headers.forEach((header, i) => {
      const value = values[i].trim();
      if (!value && autoRef(i)) return;
      if (!value) errors[i] = `Please enter ${header.toLowerCase()}`;
      else if (i === 0 && list.some(r => r.key !== initial?.key && r.cells[0].trim().toLowerCase() === value.toLowerCase())) errors[i] = `${value} already exists. Use a different ${header.toLowerCase()}.`;
      else if (config.money?.includes(i) && !/\d/.test(value)) errors[i] = "Enter an amount in numbers, e.g. 70000";
    });
    setFieldErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError !== undefined) {
      setError(`Please fill in the ${Object.keys(errors).length === 1 ? "highlighted field" : "highlighted fields"} to save.`);
      document.querySelector<HTMLInputElement>(`.modal [data-field="${firstError}"]`)?.focus();
      return;
    }
    const cells = config.headers.map((_, i) => {
      const value = values[i].trim();
      if (autoRef(i) && !value) return suggested;
      return config.money?.includes(i) && /^[\d,]+$/.test(value) ? pkr(toNumber(value)) : value;
    });
    save(cells, stage, note.trim() || undefined);
  };
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") close(); if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") { event.preventDefault(); submit(); } }}>
    <div className="modal-head"><div><small>{module.label.toUpperCase()}</small><h2>{initial ? `Edit ${initial.cells[0]}` : module.action}</h2></div><button onClick={close} aria-label="Close">×</button></div>
    <div className="form-grid">
      {config.headers.map((header, i) => <label key={header}>{header}<input data-field={i} className={fieldErrors[i] ? "invalid" : ""} value={values[i]} autoFocus={i === 0} inputMode={config.money?.includes(i) ? "numeric" : undefined} placeholder={config.money?.includes(i) ? "e.g. 70000" : autoRef(i) ? `e.g. ${suggested}` : `e.g. ${example[i] ?? ""}`} onChange={event => { const value = event.target.value; setValues(prev => prev.map((x, j) => j === i ? value : x)); setFieldErrors(prev => { const next = { ...prev }; delete next[i]; return next; }); setError(""); }} />{fieldErrors[i] ? <span className="field-error">{fieldErrors[i]}</span> : autoRef(i) && <span className="field-hint">Type your own, or leave empty to use {suggested}</span>}</label>)}
      <label>{config.mode === "pipeline" ? (initial ? "Stage" : "Starting stage") : "Section"}<select value={stage} onChange={event => setStage(Number(event.target.value))}>{stages.map((step, i) => <option key={step} value={i}>{step}</option>)}</select></label>
      <label className="full">Note (optional)<textarea value={note} placeholder="Add any details or reminders…" onChange={event => setNote(event.target.value)} /></label>
    </div>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-note">{initial ? "Press Enter or Save changes. Changes are saved to this record straight away." : `Fill in the fields and press Enter or Save. The new record appears at the top of ${module.label}.`}</div>
    <div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={submit}>{initial ? "Save changes" : "Save →"}</Button></div>
  </div></div>;
}

function PaymentModal({ invoices, initial, close, save }: { invoices: Rec[]; initial?: string; close: () => void; save: (key: string, amount: number, method: string) => void }) {
  const unpaid = invoices.filter(r => dueOf(r) > 0);
  const [key, setKey] = useState(unpaid.find(r => r.cells[0] === initial)?.key ?? unpaid[0]?.key ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [error, setError] = useState("");
  const invoice = unpaid.find(r => r.key === key);
  const submit = () => {
    const value = toNumber(amount);
    if (!invoice) return;
    if (value <= 0) { setError("Enter the amount received."); return; }
    if (value > dueOf(invoice)) { setError(`Amount is more than the ${pkr(dueOf(invoice))} due.`); return; }
    save(invoice.key, value, method);
  };
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") close(); if (event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") { event.preventDefault(); submit(); } }}>
    <div className="modal-head"><div><small>BILLING & RECEIPTS</small><h2>Record Payment</h2></div><button onClick={close} aria-label="Close">×</button></div>
    {unpaid.length ? <>
      <div className="form-grid">
        <label>Invoice<select value={key} onChange={event => { setKey(event.target.value); setError(""); }}>{unpaid.map(r => <option key={r.key} value={r.key}>{r.cells[0]} · {r.cells[1]} · {pkr(dueOf(r))} due</option>)}</select></label>
        <label>Amount received (PKR)<input value={amount} autoFocus inputMode="numeric" placeholder={invoice ? String(dueOf(invoice)) : ""} onChange={event => { setAmount(event.target.value); setError(""); }} /></label>
        <label>Method<select value={method} onChange={event => setMethod(event.target.value)}><option>Cash</option><option>Bank transfer</option><option>Cheque</option></select></label>
        <label>Balance after payment<input readOnly value={invoice ? pkr(Math.max(0, dueOf(invoice) - toNumber(amount))) : ""} /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-note">Cash payments are added to today’s drawer. Bank receipts are excluded from physical cash.</div>
      <div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={submit}>Save payment →</Button></div>
    </> : <><div className="availability free"><b>All invoices are fully paid</b><span>There is no outstanding balance to record.</span></div><div className="modal-actions"><Button onClick={close}>Close</Button></div></>}
  </div></div>;
}

type CalEvent = { date: string; title: string; tone: Tone; venue: string; event?: string };
const calendarEvents: CalEvent[] = [
  { date: "2026-10-06", title: "Sana · Menu tasting", tone: "navy", venue: "Office" },
  { date: "2026-10-10", title: "Corporate dinner", tone: "amber", venue: "Pearl Banquet" },
  { date: "2026-10-14", title: "Venue blocked · maintenance", tone: "red", venue: "Pearl Banquet" },
  { date: "2026-10-19", title: "Ayesha · Final review", tone: "navy", venue: "Office" },
  { date: "2026-10-23", title: "Emerald Hall setup", tone: "amber", venue: "Emerald Hall" },
  { date: "2026-10-24", title: "Ayesha & Hamza", tone: "green", venue: "Emerald Hall", event: "EV-0248" },
  { date: "2026-10-24", title: "Cleanup · until 02:00", tone: "navy", venue: "Emerald Hall" },
  { date: "2026-10-25", title: "Nexus Summit", tone: "amber", venue: "Client venue", event: "EV-0249" },
  { date: "2026-10-26", title: "Sara’s Birthday", tone: "red", venue: "Garden Marquee", event: "EV-0250" },
  { date: "2026-11-14", title: "Ahmed Raza · Wedding", tone: "amber", venue: "Garden Marquee" },
  { date: "2026-12-06", title: "Sana Malik · Birthday", tone: "amber", venue: "Pearl Banquet" },
  { date: "2026-12-18", title: "Hassan & Maira", tone: "amber", venue: "Emerald Hall" },
];
const TODAY = new Date(2026, 9, 19);
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

function CalendarPage({ module, back, openEvent, events, setEvents, notify }: { module: Module; back: () => void; openEvent: (id: string) => void; events: CalEvent[]; setEvents: (events: CalEvent[]) => void; notify: (message: string) => void }) {
  const [cursor, setCursor] = useState(TODAY);
  const [view, setView] = useState<"Month" | "Week" | "Day">("Month");
  const [tone, setTone] = useState<Tone | "all">("all");
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkDate, setCheckDate] = useState("2026-10-24");
  const [checkVenue, setCheckVenue] = useState("Emerald Hall");
  const eventsOn = (d: Date) => events.filter(e => e.date === dateKey(d) && (tone === "all" || e.tone === tone));
  const weekStart = addDays(cursor, -((cursor.getDay() + 6) % 7));
  const move = (dir: number) => setCursor(view === "Month" ? new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1) : addDays(cursor, view === "Week" ? 7 * dir : dir));
  const title = view === "Month" ? cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : view === "Week" ? `${weekStart.getDate()} ${weekStart.toLocaleDateString("en-GB", { month: "short" })} – ${addDays(weekStart, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const lead = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7;
  const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const days = view === "Month"
    ? Array.from({ length: Math.ceil((lead + total) / 7) * 7 }, (_, i) => i < lead || i >= lead + total ? null : new Date(cursor.getFullYear(), cursor.getMonth(), i - lead + 1))
    : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selected = eventsOn(cursor);
  const venues = ["Emerald Hall", "Garden Marquee", "Pearl Banquet", "Crystal Lawn"];
  const toneNames: [Tone, string][] = [["green", "Confirmed"], ["amber", "Planning"], ["red", "Conflict / blocked"], ["navy", "Other"]];
  const exportEvents = () => { downloadFile("booking-calendar.csv", toCsv([["Date", "Title", "Venue", "Status"], ...events.map(e => [e.date, e.title, e.venue, toneNames.find(([t]) => t === e.tone)?.[1] ?? "Other"])])); notify(`${events.length} calendar entries exported`); };
  const importEvents = (rows: string[][]) => {
    let skipped = 0;
    const added = rows.filter(r => normalize(r[0] ?? "") !== "date").flatMap(r => {
      const raw = (r[0] ?? "").trim();
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : !isNaN(Date.parse(raw)) ? dateKey(new Date(Date.parse(raw))) : "";
      const title = (r[1] ?? "").trim();
      if (!parsed || !title) { skipped++; return []; }
      const status = normalize(r[3] ?? "");
      const tone = toneNames.find(([, label]) => normalize(label).startsWith(status) && status)?.[0] ?? "navy";
      return [{ date: parsed, title, venue: (r[2] ?? "").trim() || "—", tone }];
    });
    if (!added.length) { notify("No valid rows found in the file"); return; }
    const same = (a: CalEvent, b: CalEvent) => a.date === b.date && normalize(a.title) === normalize(b.title) && normalize(a.venue) === normalize(b.venue);
    const fresh = added.filter((e, i) => !events.some(x => same(x, e)) && added.findIndex(x => same(x, e)) === i);
    setEvents([...events, ...fresh]);
    const existing = added.length - fresh.length;
    notify(`Imported: ${fresh.length} calendar entries added${existing ? `, ${existing} already on calendar` : ""}${skipped ? `, ${skipped} skipped` : ""}`);
  };
  const conflicts = events.filter(e => e.date === checkDate && e.venue === checkVenue);
  const dayList = selected.length
    ? selected.map(e => <div className={`day-event ${e.tone}`} key={e.title}><div><b>{e.title}</b><span>{e.venue}</span></div>{e.event && <Button variant="secondary" onClick={() => openEvent(e.event as string)}>Open event →</Button>}</div>)
    : <div className="empty-state"><b>No bookings on this day</b><span>This date is free for new bookings.</span></div>;
  return <>
    <BackButton onClick={back} />
    <PageTitle module={module} action={() => setCheckOpen(true)} />
    <div className="toolbar"><span className="spacer" /><ImportExport name="booking-calendar" template={[["Date", "Title", "Venue", "Status"], ["2026-10-24", "Ayesha & Hamza", "Emerald Hall", "Confirmed"]]} hint="Columns: Date (2026-10-24 or 24 Oct 2026), Title, Venue, Status (Confirmed, Planning, Conflict / blocked or Other). Entries are added to the calendar." onExport={exportEvents} onImport={importEvents} /></div>
    <Card className="calendar-card">
      <div className="calendar-toolbar">
        <div className="calendar-title"><button aria-label="Previous" onClick={() => move(-1)}>‹</button><div><small>BOOKING CALENDAR · {view.toUpperCase()} VIEW</small><h3>{title}</h3></div><button aria-label="Next" onClick={() => move(1)}>›</button></div>
        <div className="calendar-controls"><Button variant="secondary" onClick={() => setCursor(TODAY)}>Today</Button><div className="view-switch">{(["Month", "Week", "Day"] as const).map(v => <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{v}</button>)}</div></div>
      </div>
      <div className="calendar-filters">
        {([["all", "navy", "All events"], ["green", "green", "Confirmed"], ["amber", "amber", "Planning"], ["red", "red", "Conflict / blocked"]] as const).map(([value, badgeTone, text]) => <button key={value} className={`filter-chip ${tone === value ? "active" : ""}`} onClick={() => setTone(value)}><Badge tone={badgeTone}>{text}</Badge></button>)}
        <span>Click a day to select it · double-click for day view</span>
      </div>
      {view === "Day" ? <div className="day-view">{dayList}</div> : <div className={`month-grid ${view === "Week" ? "week-grid" : ""}`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <div className="weekday" key={day}>{day}</div>)}
        {days.map((d, i) => d
          ? <button key={i} className={`calendar-day ${dateKey(d) === dateKey(TODAY) ? "today" : ""} ${dateKey(d) === dateKey(cursor) ? "selected" : ""}`} onClick={() => setCursor(d)} onDoubleClick={() => { setCursor(d); setView("Day"); }}>
              <span>{d.getDate()}</span>
              <div>{eventsOn(d).map(e => <i className={`${e.tone} ${e.event ? "link" : ""}`} key={e.title} onClick={event => { if (e.event) { event.stopPropagation(); openEvent(e.event); } }}>{e.title}</i>)}</div>
            </button>
          : <div className="calendar-day muted-day" key={i} />)}
      </div>}
    </Card>
    {view !== "Day" && <Card className="day-panel"><div className="card-head"><div><small>SELECTED DAY</small><h3>{cursor.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3></div><Button variant="secondary" onClick={() => setView("Day")}>Open day view</Button></div>{dayList}</Card>}
    {checkOpen && <div className="modal-backdrop" onMouseDown={() => setCheckOpen(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><small>BOOKING CALENDAR</small><h2>Check availability</h2></div><button onClick={() => setCheckOpen(false)} aria-label="Close">×</button></div>
      <div className="form-grid"><label>Date<input type="date" value={checkDate} onChange={event => setCheckDate(event.target.value)} /></label><label>Venue<select value={checkVenue} onChange={event => setCheckVenue(event.target.value)}>{venues.map(v => <option key={v}>{v}</option>)}</select></label></div>
      {conflicts.length
        ? <div className="availability busy"><b>Not available</b><span>{checkVenue} is booked: {conflicts.map(c => c.title).join(", ")}</span></div>
        : <div className="availability free"><b>Available</b><span>{checkVenue} is free on this date.</span></div>}
      <div className="modal-actions"><Button variant="ghost" onClick={() => setCheckOpen(false)}>Close</Button><Button onClick={() => { const [y, m, d] = checkDate.split("-").map(Number); if (y && m && d) { setCursor(new Date(y, m - 1, d)); setView("Day"); } setCheckOpen(false); }}>Show on calendar →</Button></div>
    </div></div>}
  </>;
}

function CashPage({ module, back, movements, setMovements, notify }: { module: Module; back: () => void; movements: [string, number][]; setMovements: (movements: [string, number][]) => void; notify: (message: string) => void }) {
  const expected = movements.reduce((total, [, value]) => total + value, 0);
  const [actual, setActual] = useState("114,500");
  const [reason, setReason] = useState("Petty cash voucher pending verification");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const counted = toNumber(actual);
  const diff = counted - expected;
  const start = () => { setActual(""); setReason(""); setSubmitted(false); setError(""); input.current?.focus(); };
  const submit = () => {
    if (!actual.trim()) { setError("Enter the cash you counted."); return; }
    if (diff !== 0 && !reason.trim()) { setError("Add a reason for the difference."); return; }
    setError("");
    setSubmitted(true);
  };
  const exportCash = () => { downloadFile("cash-closing.csv", toCsv([["Movement", "Amount"], ...movements.map(([label, value]) => [label, String(value)]), ["Expected cash", String(expected)], ["Actual cash counted", actual.trim() ? String(counted) : ""], ["Difference", actual.trim() ? String(diff) : ""], ["Reason", reason]])); notify("Cash closing sheet exported"); };
  const importCash = (rows: string[][]) => {
    const summary = ["movement", "expected cash", "actual cash counted", "difference", "reason"];
    const items = rows.filter(r => !summary.includes(normalize(r[0] ?? ""))).flatMap(r => {
      const label = (r[0] ?? "").trim();
      const text = (r[1] ?? "").trim();
      if (!label || !/\d/.test(text)) return [];
      const value = Math.abs(toNumber(text));
      return [[label, /^[-−]/.test(text) || /^\(/.test(text) ? -value : value] as [string, number]];
    });
    if (!items.length) { notify("No valid rows found in the file"); return; }
    setMovements(items);
    setSubmitted(false);
    notify(`Imported ${items.length} cash movements`);
  };
  return <>
    <BackButton onClick={back} />
    <PageTitle module={module} action={start} />
    <div className="toolbar"><span className="spacer" /><ImportExport name="cash-closing" template={[["Movement", "Amount"], ["Opening cash", "50000"], ["Cash received", "100000"], ["Vendor payment", "-30000"]]} hint="Columns: Movement, Amount. Use a minus sign for cash going out. Importing replaces today’s movements." onExport={exportCash} onImport={importCash} /></div>
    <div className="closing-grid">
      <Card><div className="card-head"><div><small>PHYSICAL DRAWER</small><h3>Expected cash</h3></div><Badge tone={submitted ? "green" : "amber"}>{submitted ? "Submitted" : "Open day"}</Badge></div>
        <div className="calculation">{movements.map(([label, value], i) => <p key={label} className={i > 0 && value > 0 ? "positive" : ""}><span>{label}</span><b>{i === 0 ? pkr(value) : `${value > 0 ? "+" : "−"} ${pkr(Math.abs(value))}`}</b></p>)}<strong><span>Expected cash</span><b>{pkr(expected)}</b></strong></div>
        <div className="rule-note">Bank receipts are excluded from physical drawer cash. Transfers are not revenue.</div>
      </Card>
      <Card><div className="card-head"><div><small>DENOMINATION COUNT</small><h3>Reconciliation</h3></div></div>
        <label>Actual cash counted (PKR)<input ref={input} value={actual} inputMode="numeric" placeholder={`e.g. ${expected.toLocaleString("en-US")}`} onChange={event => { setActual(event.target.value); setSubmitted(false); setError(""); }} /></label>
        {actual.trim() && <div className={`discrepancy ${diff === 0 ? "balanced" : ""}`}><span>{diff === 0 ? "Balanced" : diff < 0 ? "Shortage" : "Excess"}</span><b>{pkr(Math.abs(diff))}</b></div>}
        <label>Reason<textarea value={reason} placeholder="Explain any shortage or excess" onChange={event => { setReason(event.target.value); setSubmitted(false); }} /></label>
        {error && <p className="form-error">{error}</p>}
        {submitted ? <div className="success-note">✓ Closing submitted for approval · {pkr(counted)} counted</div> : <Button onClick={submit}>Submit for approval</Button>}
      </Card>
    </div>
  </>;
}

function ProfilePage({ back }: { back: () => void }) {
  const [saved, setSaved] = useState(false);
  return <>
    <BackButton onClick={back} />
    <div className="page-heading module-title"><div><small>AK / ACCOUNT</small><h1>My Profile</h1><p>Manage your personal information and account preferences</p></div></div>
    <div className="profile-page">
      <Card className="profile-identity">
        <div className="profile-avatar">AK</div>
        <h3>AK</h3><p>Owner / Admin</p><Badge tone="green">Active account</Badge>
        <button className="change-photo">Change profile photo</button>
        <div className="profile-meta"><span>Last sign in<b>19 Oct 2026 · 09:42 AM</b></span><span>Timezone<b>Asia/Karachi</b></span><span>Branch<b>Lahore Main</b></span></div>
      </Card>
      <Card className="profile-form-card">
        <div className="card-head"><div><small>PROFILE INFORMATION</small><h3>Personal details</h3></div>{saved && <Badge tone="green">Changes saved</Badge>}</div>
        <div className="form-grid">
          <label>Display name<input defaultValue="AK" /></label>
          <label>Role<input value="Owner / Admin" readOnly /></label>
          <label>Email address<input type="email" defaultValue="ak@eventra.pk" /></label>
          <label>Phone number<input defaultValue="+92 300 1234567" /></label>
          <label>Preferred language<select defaultValue="English"><option>English</option><option>Urdu</option></select></label>
          <label>Default branch<select defaultValue="Lahore Main"><option>Lahore Main</option><option>DHA Marquee</option><option>Gulberg Office</option></select></label>
        </div>
        <div className="profile-actions"><Button variant="secondary">Change password</Button><Button onClick={() => setSaved(true)}>Save changes</Button></div>
      </Card>
    </div>
  </>;
}

type EventInfo = {
  title: string; type: string; date: string; venue: string; guests: number; invoice: string; costs: number; costsPaid: number; readiness: number; readinessNote: string;
  team: [string, string, string][]; timeline: [string, string, string, Tone][]; services: [string, string, string, Tone][]; history: [string, string][];
};
const eventDetails: Record<string, EventInfo> = {
  "EV-0248": {
    title: "Ayesha & Hamza", type: "Wedding", date: "Saturday, 24 October 2026", venue: "Emerald Hall", guests: 300, invoice: "INV-1031", costs: 320000, costsPaid: 250000, readiness: 78, readinessNote: "7 of 9 operational areas confirmed",
    team: [["SR", "Sarah Raza", "Event manager"], ["BA", "Bilal Ahmed", "Floor supervisor"], ["+8", "Service crew", "Confirmed"]],
    timeline: [["08:00", "Venue handover & decoration setup", "On track", "green"], ["15:00", "Catering team arrival", "Pending", "amber"], ["18:30", "Guest doors open", "Scheduled", "navy"], ["23:00", "Event close & rental count", "Scheduled", "navy"]],
    services: [["Catering", "Wedding Platinum menu · 300 guests", "Guest count pending", "amber"], ["Decoration", "Royal floral stage · Royal Florists", "Approved", "green"], ["Rentals", "300 banquet chairs · 378 dinner plates", "Reserved", "green"], ["Transport", "TR-11 · Store → Emerald Hall", "In transit", "amber"]],
    history: [["19 Oct · 09:12", "Sarah Raza updated the run of show"], ["18 Oct · 16:40", "Payment of PKR 100,000 received on INV-1031"], ["15 Oct · 11:05", "QT-1048 approved and converted to booking"]],
  },
  "EV-0249": {
    title: "Nexus Corporate Summit", type: "Corporate", date: "Sunday, 25 October 2026", venue: "Client venue", guests: 150, invoice: "INV-1032", costs: 410000, costsPaid: 300000, readiness: 55, readinessNote: "5 of 9 operational areas confirmed",
    team: [["BA", "Bilal Ahmed", "Event lead"], ["UA", "Usman Ali", "Driver"], ["+5", "Service crew", "Assigned"]],
    timeline: [["07:30", "Equipment loading at store", "Scheduled", "navy"], ["10:00", "Sound check", "Pending", "amber"], ["12:30", "Lunch buffet service", "Scheduled", "navy"], ["18:00", "Pack-up & return", "Scheduled", "navy"]],
    services: [["Catering", "Corporate lunch buffet · 150 guests", "Production sheet", "amber"], ["Decoration", "Corporate branding", "Customer approval", "amber"], ["Rentals", "RO-303 · Stage + sound system", "Return pending", "amber"], ["Transport", "TR-12 · Store → Nexus venue", "Loading", "navy"]],
    history: [["18 Oct · 14:20", "Bilal Ahmed assigned as event lead"], ["16 Oct · 10:00", "Invoice INV-1032 paid in full"], ["12 Oct · 12:30", "Booking confirmed from QT-1047"]],
  },
  "EV-0250": {
    title: "Sara’s Birthday", type: "Birthday", date: "Monday, 26 October 2026", venue: "Garden Marquee", guests: 60, invoice: "INV-1033", costs: 60000, costsPaid: 20000, readiness: 30, readinessNote: "3 of 9 operational areas confirmed",
    team: [["SR", "Sarah Raza", "Event manager"], ["+3", "Service crew", "To assign"]],
    timeline: [["14:00", "Balloon décor setup", "Pending", "amber"], ["16:30", "Hi-tea service", "Scheduled", "navy"], ["19:00", "Cake cutting", "Scheduled", "navy"], ["20:30", "Cleanup", "Scheduled", "navy"]],
    services: [["Catering", "Birthday hi-tea · 60 guests", "Menu approval", "amber"], ["Decoration", "Pastel balloon theme", "Costing", "amber"], ["Rentals", "Not required", "—", "navy"], ["Transport", "Not scheduled", "—", "navy"]],
    history: [["17 Oct · 15:45", "Venue hold placed on Garden Marquee"], ["14 Oct · 13:10", "Inquiry converted to booking"]],
  },
};

function EventDetail({ id, records, back, navigate, openPayment }: { id: string; records: Record<string, Rec[]>; back: () => void; navigate: (id: string) => void; openPayment: (invoice: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const ev = eventDetails[id];
  const invoice = records.billing.find(r => r.cells[0] === ev.invoice);
  const sales = invoice ? toNumber(invoice.cells[2]) : 0;
  const due = invoice ? dueOf(invoice) : 0;
  const received = sales - due;
  const booking = records.events.find(r => r.cells[0] === id);
  const confirmed = !!booking && isDone("events", booking);
  const tasks = records.tasks.filter(r => r.cells[1] === id);
  const stock = records.inventory.filter(r => r.cells[3].includes(id));
  const summary = `${ev.title} (${id})\n${ev.type} · ${ev.date}\nVenue: ${ev.venue}\nGuests: ${ev.guests}\nInvoice ${ev.invoice}: ${pkr(sales)} · received ${pkr(received)} · due ${pkr(due)}\n`;
  const docs = ["Quotation", "Contract", "Invoice", "Run-sheet"];
  return <>
    <BackButton onClick={back} label="Back" />
    <div className="event-detail-head"><div><div className="eyebrow">{id} · {ev.type.toUpperCase()}</div><h1>{ev.title}</h1><p>{ev.date} · {ev.venue} · {ev.guests} guests</p></div><div><Badge tone={confirmed ? "green" : "amber"}>{confirmed ? "Operations confirmed" : booking ? `Booking stage: ${stageText("events", booking)}` : "Planning"}</Badge><Badge tone={due ? "amber" : "green"}>{due ? `${pkr(due)} due` : "Paid in full"}</Badge></div></div>
    <div className="tabs">{["Overview", "Services", "Planning", "Inventory", "Finance", "Documents", "History"].map(x => <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>{x}</button>)}</div>
    <div className="detail-layout">
      <div>
        {tab === "Overview" && <><Card className="detail-hero"><div><small>EVENT READINESS</small><h3>{ev.readiness >= 70 ? "Everything is on track" : "Work in progress"}</h3><p>{ev.readinessNote}</p></div><div className="progress-ring">{ev.readiness}%</div></Card>
          <Card><div className="card-head"><div><small>RUN OF SHOW</small><h3>Event timeline</h3></div><Button variant="secondary" onClick={() => navigate("tasks")}>Open run-sheet</Button></div><div className="timeline">{ev.timeline.map(([time, text, status, tone]) => <p key={time}><b>{time}</b><span>{text}</span><Badge tone={tone}>{status}</Badge></p>)}</div></Card></>}
        {tab === "Services" && <Card><div className="card-head"><div><small>BOOKED SERVICES</small><h3>Services</h3></div><Button variant="secondary" onClick={() => navigate("catering")}>Open catering</Button></div><div className="detail-list">{ev.services.map(([name, text, status, tone]) => <p key={name}><b>{name}</b><span>{text}</span><Badge tone={tone}>{status}</Badge></p>)}</div></Card>}
        {tab === "Planning" && <Card><div className="card-head"><div><small>TASKS FOR {id}</small><h3>Planning</h3></div><Button variant="secondary" onClick={() => navigate("tasks")}>Open tasks</Button></div>{tasks.length ? <div className="detail-list">{tasks.map(r => <p key={r.key}><b>{r.cells[2]}</b><span>{r.cells[0]}<small>{r.cells[3]}</small></span><Badge tone={isDone("tasks", r) ? "green" : "amber"}>{stageText("tasks", r)}</Badge></p>)}</div> : <p className="muted">No tasks yet for this event.</p>}</Card>}
        {tab === "Inventory" && <Card><div className="card-head"><div><small>STOCK FOR {id}</small><h3>Inventory</h3></div><Button variant="secondary" onClick={() => navigate("inventory")}>Open inventory</Button></div>{stock.length ? <div className="detail-list">{stock.map(r => <p key={r.key}><b>{r.cells[0]}</b><span>{r.cells[1]}<small>Quantity {r.cells[2]}</small></span><Badge tone="navy">{stageText("inventory", r)}</Badge></p>)}</div> : <p className="muted">No stock reserved or issued for this event yet.</p>}</Card>}
        {tab === "Finance" && <FinanceSummary title="Event invoice" invoice={sales} received={received} outstanding={due} costs={ev.costs} paid={ev.costsPaid} />}
        {tab === "Documents" && <Card><div className="card-head"><div><small>FILES</small><h3>Documents</h3></div></div><div className="detail-list">{docs.map(doc => <p key={doc}><b>{doc}</b><span>{id}-{doc.toLowerCase()}.txt</span><button className="link-button" onClick={() => downloadFile(`${id}-${doc.toLowerCase()}.txt`, `${doc.toUpperCase()}\n\n${summary}${doc === "Run-sheet" ? "\n" + ev.timeline.map(([time, text]) => `${time}  ${text}`).join("\n") : ""}`, "text/plain")}>↓ Download</button></p>)}</div></Card>}
        {tab === "History" && <Card><div className="card-head"><div><small>ACTIVITY</small><h3>History</h3></div></div><div className="detail-list">{ev.history.map(([when, text]) => <p key={when}><b>{when}</b><span>{text}</span><span /></p>)}</div></Card>}
      </div>
      <div>
        <Card><div className="card-head"><div><small>ASSIGNMENTS</small><h3>Event team</h3></div><Button variant="ghost" onClick={() => navigate("staff")}>Manage</Button></div><div className="people">{ev.team.map(([initials, name, role]) => <p key={name}><i>{initials}</i><span><b>{name}</b><small>{role}</small></span></p>)}</div></Card>
        <Card><div className="card-head"><div><small>CUSTOMER BALANCE · {ev.invoice}</small><h3>{due ? `${pkr(due)} due` : "Fully paid"}</h3></div></div><div className="balance-bar"><i style={{ width: `${sales ? Math.round((received / sales) * 100) : 0}%` }} /></div><p className="muted">{pkr(received)} received of {pkr(sales)}</p>{due > 0 ? <Button variant="secondary" onClick={() => openPayment(ev.invoice)}>Record payment</Button> : <Badge tone="green">Paid in full</Badge>}</Card>
      </div>
    </div>
  </>;
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, Rec[]>>(seedRecords);
  const [modal, setModal] = useState<{ kind: "add" | "payment"; module: string; invoice?: string; goTo?: boolean } | null>(null);
  const [toast, setToast] = useState("");
  const [calEvents, setCalEvents] = useState<CalEvent[]>(calendarEvents);
  const [cashMoves, setCashMoves] = useState<[string, number][]>([["Opening cash", 50000], ["Cash received", 100000], ["Vendor payment", -30000], ["Petty expense", -5000]]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);
  const current = useMemo(() => modules.find(m => m.id === active) || modules[0], [active]);
  const chooseModule = (id: string) => { setActive(id); setEventId(null); window.scrollTo(0, 0); };
  const back = () => chooseModule("dashboard");
  const update = (moduleId: string, key: string, change: (r: Rec) => Rec) => setRecords(all => ({ ...all, [moduleId]: all[moduleId].map(r => r.key === key ? change(r) : r) }));
  const remove = (moduleId: string, key: string) => setRecords(all => ({ ...all, [moduleId]: all[moduleId].filter(r => r.key !== key) }));
  const runAction = (moduleId: string, goTo = false) => {
    if (moduleId === "reports") {
      downloadFile("ak-business-report.csv", moduleCsv(records, reportSections.flat()));
      setToast("Business report downloaded");
    } else if (moduleId === "billing") {
      setModal({ kind: "payment", module: "billing", goTo });
    } else {
      setModal({ kind: "add", module: moduleId, goTo });
    }
  };
  const quickActions: Record<string, string> = { "New Booking": "events", "Create Quotation": "quotations", "Record Payment": "billing", "Add Expense": "expenses" };
  const addRecord = (moduleId: string, cells: string[], stage: number, note?: string) => {
    setRecords(all => ({ ...all, [moduleId]: [{ key: `${moduleId}-${Date.now()}`, cells, stage, note }, ...all[moduleId]] }));
    setToast(`${cells[0]} added to ${labelOf(moduleId)}`);
    if (modal?.goTo) chooseModule(moduleId);
    setModal(null);
  };
  const recordPayment = (key: string, amount: number, method: string) => {
    const invoice = records.billing.find(r => r.key === key);
    update("billing", key, r => {
      const due = Math.max(0, dueOf(r) - amount);
      return { ...r, cells: [r.cells[0], r.cells[1], r.cells[2], due ? `${pkr(due)} due` : "Paid"], stage: Math.max(r.stage, 1), note: `${r.note ? `${r.note} ` : ""}Received ${pkr(amount)} by ${method.toLowerCase()} on 19 Oct 2026.` };
    });
    setToast(`${pkr(amount)} recorded on ${invoice?.cells[0] ?? "invoice"}`);
    if (modal?.goTo) chooseModule("billing");
    setModal(null);
  };
  const importRecords = (moduleId: string, items: { cells: string[]; stage: number; note?: string }[]) => {
    const prefix = configs[moduleId].prefix;
    let list = [...records[moduleId]];
    let added = 0;
    let updated = 0;
    items.forEach((item, n) => {
      const cells = [...item.cells];
      if (!cells[0] && prefix) cells[0] = nextId(list, prefix);
      const index = list.findIndex(r => r.cells[0].toLowerCase() === cells[0].toLowerCase());
      if (index >= 0) { list[index] = { ...list[index], cells, stage: item.stage, note: item.note ?? list[index].note }; updated++; }
      else { list = [{ key: `${moduleId}-${Date.now()}-${n}`, cells, stage: item.stage, note: item.note }, ...list]; added++; }
    });
    setRecords(all => ({ ...all, [moduleId]: list }));
    return { added, updated };
  };
  const modalModule = modal ? modules.find(m => m.id === modal.module) : undefined;
  let page: React.ReactNode;
  if (eventId && eventDetails[eventId]) page = <EventDetail key={eventId} id={eventId} records={records} back={() => setEventId(null)} navigate={chooseModule} openPayment={invoice => setModal({ kind: "payment", module: "billing", invoice })} />;
  else if (active === "dashboard") page = <Dashboard openEvent={setEventId} openAction={name => runAction(quickActions[name], true)} navigate={chooseModule} />;
  else if (active === "profile") page = <ProfilePage back={back} />;
  else if (active === "calendar") page = <CalendarPage module={current} back={back} openEvent={setEventId} events={calEvents} setEvents={setCalEvents} notify={setToast} />;
  else if (active === "cash") page = <CashPage module={current} back={back} movements={cashMoves} setMovements={setCashMoves} notify={setToast} />;
  else page = <RecordsPage key={active} module={current} records={records} action={() => runAction(active)} back={back} update={(key, change) => update(active, key, change)} remove={key => remove(active, key)} openEvent={setEventId} notify={setToast} importRows={items => importRecords(active, items)} />;
  return <div className="app-shell">
    <Sidebar active={active} setActive={chooseModule} open={mobileNav} close={() => setMobileNav(false)} />
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <main><Header menu={() => setMobileNav(true)} navigate={chooseModule} records={records} /><div className="page-content">{page}</div></main>
    {modal?.kind === "add" && modalModule && <RecordFormModal module={modalModule} list={records[modal.module]} close={() => setModal(null)} save={(cells, stage, note) => addRecord(modal.module, cells, stage, note)} />}
    {modal?.kind === "payment" && <PaymentModal invoices={records.billing} initial={modal.invoice} close={() => setModal(null)} save={recordPayment} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
