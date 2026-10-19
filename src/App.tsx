import { useEffect, useMemo, useState } from "react";

type Module = {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  action: string;
  workflow: string[];
  hidden?: boolean;
};

const modules: Module[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂", subtitle: "Business overview", action: "New Booking", workflow: [] },
  { id: "customers", label: "Customers & Inquiries", icon: "◎", subtitle: "Leads, follow-ups and customer history", action: "New Inquiry", workflow: ["Inquiry", "Follow-up", "Quotation", "Booking"] },
  { id: "quotations", label: "Quotations & Packages", icon: "▤", subtitle: "Build packages and preserve approved prices", action: "Create Quotation", workflow: ["Draft", "Review", "Approval", "Convert to booking"] },
  { id: "events", label: "Events & Bookings", icon: "◇", subtitle: "Plan and operate every confirmed event", action: "New Booking", workflow: ["Customer", "Event info", "Venue & time", "Services", "Resources", "Payment", "Review"] },
  { id: "venues", label: "Halls & Venues", icon: "⌂", subtitle: "Capacity, pricing and availability", action: "Add Venue", workflow: ["Availability", "Setup window", "Event", "Cleanup window"] },
  { id: "calendar", label: "Booking Calendar", icon: "□", subtitle: "Venue, people and equipment scheduling", action: "Check Availability", workflow: ["Month", "Week", "Day", "Conflict resolution"] },
  { id: "catering", label: "Catering & Menus", icon: "◉", subtitle: "Menus, production and ingredient planning", action: "Build Menu", workflow: ["Menu approval", "Guest count", "Production sheet", "Consumption"] },
  { id: "decoration", label: "Decoration", icon: "✣", subtitle: "Themes, materials and setup approvals", action: "New Design Brief", workflow: ["Theme", "Costing", "Customer approval", "Setup checklist"] },
  { id: "rentals", label: "Rental Orders", icon: "◇", subtitle: "Reservations, dispatch, return and deposits", action: "New Rental Order", workflow: ["Quote", "Reserve", "Dispatch", "Return", "Deposit settlement"] },
  { id: "inventory", label: "Inventory & Stock", icon: "▣", subtitle: "Returnable assets and consumables", action: "Stock Movement", workflow: ["Reserve", "Issue", "Return", "Transfer", "Adjust"] },
  { id: "purchasing", label: "Purchasing", icon: "⌑", subtitle: "Controlled procure-to-pay workflow", action: "Purchase Request", workflow: ["Request", "Approval", "Purchase order", "Goods receipt", "Supplier bill", "Payment"] },
  { id: "vendors", label: "Vendors & Suppliers", icon: "◌", subtitle: "Commitments, advances and payable balances", action: "Add Vendor", workflow: ["Commitment", "Bill", "Advance", "Payment", "Ledger"] },
  { id: "staff", label: "Staff & Duties", icon: "♙", subtitle: "Assignments, shifts, attendance and wages", action: "Assign Staff", workflow: ["Availability", "Assignment", "Check-in", "Wages", "Payment"] },
  { id: "tasks", label: "Tasks & Schedule", icon: "☷", subtitle: "Event run-sheets, dependencies and escalation", action: "New Task", workflow: ["List", "Kanban", "Run-sheet", "Escalations"] },
  { id: "transport", label: "Transport & Delivery", icon: "▱", subtitle: "Dispatch, delivery and return logistics", action: "Plan Dispatch", workflow: ["Loading", "Dispatch", "Delivery", "Signature", "Pickup", "Return"] },
  { id: "billing", label: "Billing & Receipts", icon: "▤", subtitle: "Invoices, receipts, credits and refunds", action: "Record Payment", workflow: ["Invoice", "Receipt", "Account update", "Daily closing"] },
  { id: "expenses", label: "Expenses & Accounts", icon: "▥", subtitle: "Accruals, payments and account ledgers", action: "Add Expense", workflow: ["Record expense", "Approve", "Pay", "Ledger"] },
  { id: "cash", label: "Cash & Daily Closing", icon: "▣", subtitle: "Drawer control and reconciliation", action: "Start Closing", workflow: ["Opening", "Movements", "Count", "Discrepancy", "Approval", "Close"] },
  { id: "reports", label: "Reports", icon: "◔", subtitle: "Operational and financial intelligence", action: "Export Report", workflow: ["Filter", "Preview", "PDF", "Spreadsheet"] },
  { id: "settings", label: "Users & Settings", icon: "⚙", subtitle: "Permissions, policies and audit controls", action: "Invite User", workflow: ["Users", "Roles", "Permissions", "Business settings", "Activity log"] },
  { id: "profile", label: "My Profile", icon: "◎", subtitle: "Personal details and account preferences", action: "Save Changes", workflow: [], hidden: true },
];

const weddingImage = "https://images.unsplash.com/photo-1779308936221-89739e035a53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";
const corporateImage = "https://images.unsplash.com/photo-1763231575952-98244918f99b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
const birthdayImage = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Button({ children, variant = "primary", onClick }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; onClick?: () => void }) {
  return <button className={`button ${variant}`} onClick={onClick}>{children}</button>;
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "red" | "navy" }) {
  return <span className={`badge ${tone}`}><i />{children}</span>;
}

function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  if (onClick) return <button className={`card clickable-card ${className}`} onClick={onClick}>{children}</button>;
  return <section className={`card ${className}`}>{children}</section>;
}

function Sidebar({ active, setActive, open, close }: { active: string; setActive: (id: string) => void; open: boolean; close: () => void }) {
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <div className="brand">AK.<small>EVENT MANAGEMENT</small></div>
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
  { name: "Ayesha & Hamza Wedding", date: "24 Oct 2026", place: "Emerald Hall", guests: "300 guests", status: "Confirmed", tone: "green" as const, image: weddingImage },
  { name: "Nexus Corporate Summit", date: "25 Oct 2026", place: "Client venue", guests: "150 guests", status: "Planning", tone: "amber" as const, image: corporateImage },
  { name: "Sara’s Birthday", date: "26 Oct 2026", place: "Garden Marquee", guests: "60 guests", status: "Pending", tone: "red" as const, image: birthdayImage },
];

function Header({ current, menu, action, navigate }: { current: Module; menu: () => void; action: () => void; navigate: (id: string) => void }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
  return <header className="topbar">
    <button className="menu-button" onClick={menu} aria-label="Open menu">☰</button>
    <div className="search"><Icon>⌕</Icon><input aria-label="Global search" placeholder="Search events, customers, invoices…" /></div>
    <div className="header-tools">
      <div className="date-picker-wrap">
        <button className={`top-date ${calendarOpen ? "active" : ""}`} onClick={() => { setCalendarOpen(!calendarOpen); setBranchOpen(false); setNotificationOpen(false); setProfileOpen(false); }}><Icon>▣</Icon><span>{dateLabel}</span><b>⌄</b></button>
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
        <button className={`branch-button ${branchOpen ? "active" : ""}`} onClick={() => { setBranchOpen(!branchOpen); setCalendarOpen(false); setNotificationOpen(false); setProfileOpen(false); }}><span>{branch}</span><b>⌄</b></button>
        {branchOpen && <div className="branch-menu">
          <small>SELECT BRANCH</small>
          {["Lahore Main", "DHA Marquee", "Gulberg Office"].map(item => <button className={branch === item ? "selected" : ""} key={item} onClick={() => { setBranch(item); setBranchOpen(false); }}><span>{item}</span>{branch === item && <b>✓</b>}</button>)}
        </div>}
      </div>
      <div className="notification-wrap">
        <button className={`notification ${notificationOpen ? "active" : ""}`} aria-label="Notifications" onClick={() => { setNotificationOpen(!notificationOpen); setCalendarOpen(false); setBranchOpen(false); setProfileOpen(false); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i />
        </button>
        {notificationOpen && <div className="notification-panel">
          <div className="notification-head"><div><small>NOTIFICATIONS</small><strong>Needs your attention</strong></div><button onClick={() => setNotificationOpen(false)}>×</button></div>
          <button><i className="amber" /><span><b>Guest count approval due</b><small>Ayesha & Hamza · 12 minutes ago</small></span></button>
          <button><i className="red" /><span><b>Low stock: dinner plates</b><small>Only 42 available · 35 minutes ago</small></span></button>
          <button><i className="green" /><span><b>Payment received</b><small>PKR 100,000 · INV-1031</small></span></button>
          <div className="notification-footer">View all notifications</div>
        </div>}
      </div>
      <div className="profile-wrap">
        <button className={`profile ${profileOpen ? "active" : ""}`} onClick={() => { setProfileOpen(!profileOpen); setCalendarOpen(false); setBranchOpen(false); setNotificationOpen(false); }}><span>AK</span><div><b>AK</b><small>Owner / Admin</small></div><i>⌄</i></button>
        {profileOpen && <div className="profile-menu">
          <div className="profile-summary"><span>AK</span><div><b>AK</b><small>Owner / Admin</small></div></div>
          <button onClick={() => { navigate("profile"); setProfileOpen(false); }}>My profile</button>
          <button onClick={() => { navigate("settings"); setProfileOpen(false); }}>Users & settings</button>
          <button onClick={() => setProfileOpen(false)}>Activity log</button>
          <button className="sign-out" onClick={() => setProfileOpen(false)}>Sign out</button>
        </div>}
      </div>
      <Button onClick={action}>＋ {current.action}</Button>
    </div>
  </header>;
}

function Dashboard({ openEvent, openAction, navigate }: { openEvent: () => void; openAction: (name: string) => void; navigate: (id: string) => void }) {
  const [activeTask, setActiveTask] = useState(0);
  const attentionTasks = [
    ["Setup at Emerald Hall", "EV-0248 · 08:00 AM"],
    ["Approve guest count", "Due today · Catering"],
    ["Vendor payment due", "Royal Florists · PKR 70,000"],
    ["Low stock: dinner plates", "42 available · reorder at 60"],
  ];
  return <>
    <div className="page-heading">
      <div><small>WORKSPACE / BUSINESS OVERVIEW</small><h1>Every event, beautifully managed.</h1><p>Monday, 19 October 2026 · Lahore</p></div>
      <div className="quick-actions">{["New Booking", "Create Quotation", "Record Payment", "Add Expense"].map((x, i) => <Button key={x} variant={i ? "secondary" : "primary"} onClick={() => openAction(x)}>{x}</Button>)}</div>
    </div>
    <section className="hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,22,38,.92),rgba(10,22,38,.15)),url("${weddingImage}")` }}>
      <div><small>WEDDINGS · CORPORATE · BIRTHDAYS · CATERING · RENTALS</small><h2>Your next unforgettable<br />event starts here.</h2><p>One connected workspace from first inquiry to final settlement.</p></div>
    </section>
    <div className="stats-grid">{stats.map(([label, value, note, icon], index) => <Card key={label} className="stat" onClick={() => navigate(["events", "cash", "billing", "reports"][index])}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><b>↗</b></Card>)}</div>
    <div className="section-title"><div><Icon>◇</Icon><h3>Upcoming events</h3></div><Button variant="ghost" onClick={openEvent}>View calendar →</Button></div>
    <div className="event-grid">{events.map(event => <Card key={event.name} className="event-card">
      <div className="event-image" style={{ backgroundImage: `url("${event.image}")` }}><Badge tone={event.tone}>{event.status}</Badge></div>
      <div className="event-copy"><h3>{event.name}</h3><div className="event-meta"><span>□ {event.date}</span><span>⌖ {event.place}</span><span>◎ {event.guests}</span></div><div className="event-footer"><div className="avatars"><i>AK</i><i>SR</i><i>+3</i></div><Button variant="secondary" onClick={openEvent}>View details →</Button></div></div>
    </Card>)}</div>
    <div className="dashboard-bottom">
      <Card onClick={() => navigate("calendar")}><div className="section-title compact"><div><Icon>□</Icon><h3>Weekly booking calendar</h3></div><Badge tone="amber">19–25 October</Badge></div>
        <div className="week">{["Mon 19|1 event", "Tue 20|2 events", "Wed 21|1 event", "Thu 22|Open", "Fri 23|2 events", "Sat 24|Wedding", "Sun 25|Summit"].map((d, i) => { const [day, note] = d.split("|"); return <div className={i === 5 ? "selected" : ""} key={d}><span>{day}</span><b>{note}</b><i /></div>; })}</div>
      </Card>
      <Card onClick={() => navigate("tasks")}><div className="section-title compact"><div><Icon>☷</Icon><h3>Needs attention</h3></div><span className="count">6</span></div>
        <div className="task-list">{attentionTasks.map(([title, note], index) => <div className={activeTask === index ? "task-complete" : ""} key={title} onClick={event => { event.stopPropagation(); setActiveTask(index); }}><i className={`check ${activeTask === index ? "done" : index > 1 ? "warning" : ""}`}>{activeTask === index ? "✓" : index > 1 ? "!" : ""}</i><span><b>{title}</b><small>{note}</small></span></div>)}</div>
      </Card>
    </div>
  </>;
}

const moduleRows: Record<string, string[][]> = {
  customers: [["Ahmed Raza", "Wedding · 14 Nov 2026", "PKR 1,200,000", "Follow-up"], ["Nexus Pakistan", "Corporate · 25 Oct 2026", "PKR 650,000", "Booked"], ["Sana Malik", "Birthday · 06 Dec 2026", "PKR 180,000", "New"]],
  quotations: [["QT-1048", "Ayesha & Hamza", "PKR 500,000", "Approved"], ["QT-1049", "Nexus Pakistan", "PKR 650,000", "Revision 2"], ["QT-1050", "Sana Malik", "PKR 180,000", "Draft"]],
  events: [["EV-0248", "Ayesha & Hamza Wedding", "24 Oct 2026", "Confirmed"], ["EV-0249", "Nexus Corporate Summit", "25 Oct 2026", "Planning"], ["EV-0250", "Sara’s Birthday", "26 Oct 2026", "Pending"]],
  venues: [["Emerald Hall", "350 guests", "PKR 180,000", "Available"], ["Garden Marquee", "600 guests", "PKR 260,000", "Reserved"], ["Pearl Banquet", "220 guests", "PKR 145,000", "Blocked"]],
  inventory: [["Banquet chairs", "500 usable", "300 reserved", "200 available"], ["Dinner plates", "420 usable", "378 reserved", "42 available"], ["Fairy light strings", "85 usable", "40 issued", "45 available"]],
  vendors: [["Royal Florists", "Decoration", "PKR 70,000", "Payment due"], ["Al-Noor Foods", "Ingredients", "PKR 124,500", "Current"], ["Rana Transport", "Logistics", "PKR 32,000", "Advance paid"]],
  staff: [["Sarah Raza", "Event Manager", "24 Oct · 08:00–23:00", "Assigned"], ["Bilal Ahmed", "Floor Supervisor", "24 Oct · 15:00–23:00", "Confirmed"], ["Usman Ali", "Driver", "25 Oct · 07:30–19:00", "Conflict"]],
  billing: [["INV-1031", "Ayesha & Hamza", "PKR 500,000", "PKR 150,000 due"], ["INV-1032", "Nexus Pakistan", "PKR 650,000", "Paid"], ["INV-1033", "Sara Malik", "PKR 180,000", "Draft"]],
  expenses: [["EXP-2031", "Royal Florists · EV-0248", "PKR 70,000", "Payable"], ["EXP-2032", "Fuel & logistics", "PKR 18,500", "Paid"], ["EXP-2033", "Kitchen supplies", "PKR 42,000", "Approval"]],
};

const labels: Record<string, string[]> = {
  customers: ["Customer", "Requirement", "Budget", "Stage"], quotations: ["Quote", "Customer", "Total", "Status"], events: ["Event", "Title", "Date", "Operations"],
  venues: ["Venue", "Capacity", "Base price", "Availability"], inventory: ["Item", "Owned / usable", "Reservations", "Available"], vendors: ["Supplier", "Service", "Balance", "Status"],
  staff: ["Team member", "Role", "Shift", "Status"], billing: ["Invoice", "Customer", "Sales value", "Balance"], expenses: ["Reference", "Expense", "Amount", "Status"],
};

function FinanceSummary() {
  return <div className="finance-panel">
    <div><span>Event invoice</span><b>PKR 500,000</b></div><div><span>Customer received</span><b>PKR 350,000</b></div><div><span>Customer outstanding</span><b>PKR 150,000</b></div>
    <div><span>Recorded event costs</span><b>PKR 320,000</b></div><div><span>Costs paid</span><b>PKR 250,000</b></div><div><span>Costs payable</span><b>PKR 70,000</b></div>
    <div className="margin"><span>Margin before overhead</span><b>PKR 180,000</b><small>Profitability metric — not available cash</small></div>
  </div>;
}

function CashClosing() {
  return <div className="closing-grid">
    <Card><div className="card-head"><div><small>PHYSICAL DRAWER</small><h3>Expected cash</h3></div><Badge tone="amber">Open day</Badge></div>
      <div className="calculation"><p><span>Opening cash</span><b>PKR 50,000</b></p><p className="positive"><span>Cash received</span><b>+ PKR 100,000</b></p><p><span>Vendor payment</span><b>− PKR 30,000</b></p><p><span>Petty expense</span><b>− PKR 5,000</b></p><strong><span>Expected cash</span><b>PKR 115,000</b></strong></div>
      <div className="rule-note">Bank receipts are excluded from physical drawer cash. Transfers are not revenue.</div>
    </Card>
    <Card><div className="card-head"><div><small>DENOMINATION COUNT</small><h3>Reconciliation</h3></div></div><label>Actual cash counted<input value="PKR 114,500" readOnly /></label><div className="discrepancy"><span>Shortage</span><b>PKR 500</b></div><label>Reason<textarea defaultValue="Petty cash voucher pending verification" /></label><Button>Submit for approval</Button></Card>
  </div>;
}

function BookingCalendar() {
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  const eventsByDay: Record<number, { title: string; tone: string }[]> = {
    6: [{ title: "Sana · Menu tasting", tone: "navy" }],
    10: [{ title: "Corporate dinner", tone: "amber" }],
    14: [{ title: "Venue blocked", tone: "red" }],
    19: [{ title: "Ayesha · Final review", tone: "navy" }],
    23: [{ title: "Emerald Hall setup", tone: "amber" }],
    24: [{ title: "Ayesha & Hamza", tone: "green" }, { title: "Cleanup · until 02:00", tone: "navy" }],
    25: [{ title: "Nexus Summit", tone: "amber" }],
    26: [{ title: "Sara’s Birthday", tone: "red" }],
  };
  return <Card className="calendar-card">
    <div className="calendar-toolbar">
      <div className="calendar-title"><button aria-label="Previous month">‹</button><div><small>BOOKING CALENDAR</small><h3>October 2026</h3></div><button aria-label="Next month">›</button></div>
      <div className="calendar-controls"><Button variant="secondary">Today</Button><div className="view-switch"><button className="active">Month</button><button>Week</button><button>Day</button></div></div>
    </div>
    <div className="calendar-filters"><Badge tone="navy">All venues</Badge><Badge tone="green">Confirmed</Badge><Badge tone="amber">Planning</Badge><Badge tone="red">Conflict / blocked</Badge><span>Setup and cleanup windows included</span></div>
    <div className="month-grid">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <div className="weekday" key={day}>{day}</div>)}
      {Array.from({ length: 3 }, (_, index) => <div className="calendar-day muted-day" key={`blank-${index}`} />)}
      {days.map(day => <button className={`calendar-day ${day === 19 ? "today" : ""}`} key={day}>
        <span>{day}</span>
        <div>{eventsByDay[day]?.map(event => <i className={event.tone} key={event.title}>{event.title}</i>)}</div>
      </button>)}
      {Array.from({ length: 1 }, (_, index) => <div className="calendar-day muted-day" key={`end-${index}`} />)}
    </div>
  </Card>;
}

function ProfilePage({ back }: { back: () => void }) {
  const [saved, setSaved] = useState(false);
  return <>
    <button className="back" onClick={back}><span aria-hidden="true">←</span>Back to dashboard</button>
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

function CustomersPage({ module, action, back }: { module: Module; action: () => void; back: () => void }) {
  const customerData = [
    { name: "Ahmed Raza", requirement: "Wedding · 14 Nov 2026", budget: "PKR 1,200,000", stage: "Follow-up" },
    { name: "Nexus Pakistan", requirement: "Corporate · 25 Oct 2026", budget: "PKR 650,000", stage: "Booking" },
    { name: "Sana Malik", requirement: "Birthday · 06 Dec 2026", budget: "PKR 180,000", stage: "Inquiry" },
    { name: "Hassan & Maira", requirement: "Wedding · 18 Dec 2026", budget: "PKR 950,000", stage: "Quotation" },
    { name: "Vertex Textiles", requirement: "Annual dinner · 09 Jan 2027", budget: "PKR 780,000", stage: "Inquiry" },
  ];
  const stages = ["Inquiry", "Follow-up", "Quotation", "Booking"];
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("Inquiry");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [showRequirement, setShowRequirement] = useState(true);
  const [showBudget, setShowBudget] = useState(true);
  useEffect(() => {
    const closeTools = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tool-menu-wrap")) {
        setFilterOpen(false);
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeTools);
    return () => document.removeEventListener("mousedown", closeTools);
  }, []);
  const filtered = customerData.filter(customer => customer.stage === stage && `${customer.name} ${customer.requirement} ${customer.budget}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <button className="back" onClick={back}><span aria-hidden="true">←</span>Back to dashboard</button>
    <PageTitle module={module} action={action} />
    <div className="workflow customer-workflow">{stages.map((item, index) => <div key={item} className={stage === item ? "active" : ""} onClick={() => setStage(item)}><i>{index + 1}</i><span>{item}</span>{index < stages.length - 1 && <b>→</b>}</div>)}</div>
    <Card className="stage-summary"><div><small>CURRENT PIPELINE STAGE</small><h3>{stage}</h3><p>{stage === "Inquiry" ? "New customer requirements awaiting first response." : stage === "Follow-up" ? "Qualified inquiries requiring calls or meetings." : stage === "Quotation" ? "Customers with a quotation in preparation or review." : "Confirmed customers converted into active bookings."}</p></div><Badge tone={stage === "Booking" ? "green" : "amber"}>{filtered.length} records</Badge></Card>
    <div className="toolbar">
      <div className="search table-search"><Icon>⌕</Icon><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, event or budget…" /></div>
      <div className="tool-menu-wrap"><Button variant="secondary" onClick={() => { setFilterOpen(!filterOpen); setColumnsOpen(false); }}>Filters</Button>{filterOpen && <div className="tool-menu"><small>INQUIRY STAGE</small>{stages.map(item => <button className={stage === item ? "selected" : ""} key={item} onClick={() => { setStage(item); setFilterOpen(false); }}>{item}<b>{stage === item ? "✓" : ""}</b></button>)}</div>}</div>
      <div className="tool-menu-wrap"><Button variant="secondary" onClick={() => { setColumnsOpen(!columnsOpen); setFilterOpen(false); }}>Columns</Button>{columnsOpen && <div className="tool-menu"><small>VISIBLE COLUMNS</small><button onClick={() => setShowRequirement(!showRequirement)}>Requirement<b>{showRequirement ? "✓" : ""}</b></button><button onClick={() => setShowBudget(!showBudget)}>Budget<b>{showBudget ? "✓" : ""}</b></button><button>Stage<b>✓</b></button></div>}</div>
      <span className="spacer" /><Button variant="ghost">Export</Button>
    </div>
    <Card className="table-card"><div className="data-table">
      <div className={`table-row customer-row ${!showRequirement || !showBudget ? "compact-columns" : ""}`}><span>Customer</span>{showRequirement && <span>Requirement</span>}{showBudget && <span>Budget</span>}<span>Stage</span></div>
      {filtered.length ? filtered.map(customer => <div className={`table-row customer-row ${!showRequirement || !showBudget ? "compact-columns" : ""}`} key={customer.name}><span><i className="record-icon">◎</i>{customer.name}</span>{showRequirement && <span>{customer.requirement}</span>}{showBudget && <span>{customer.budget}</span>}<span className="status-cell">{customer.stage}</span></div>) : <div className="empty-state"><b>No {stage.toLowerCase()} records found</b><span>Try a different search or select another pipeline stage.</span></div>}
    </div></Card>
  </>;
}

function ModulePage({ module, action, openEvent, back }: { module: Module; action: () => void; openEvent: () => void; back: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const rows = moduleRows[module.id] || [["EV-0248", "Ayesha & Hamza Wedding", "24 Oct 2026", "In progress"], ["EV-0249", "Nexus Corporate Summit", "25 Oct 2026", "Ready"], ["EV-0250", "Sara’s Birthday", "26 Oct 2026", "Needs review"]];
  const headers = labels[module.id] || ["Reference", "Record", "Schedule", "Status"];
  if (module.id === "cash") return <><button className="back" onClick={back}><span aria-hidden="true">←</span>Back to dashboard</button><PageTitle module={module} action={action} /><CashClosing /></>;
  if (module.id === "calendar") return <><button className="back" onClick={back}><span aria-hidden="true">←</span>Back to dashboard</button><PageTitle module={module} action={action} /><BookingCalendar /></>;
  if (module.id === "profile") return <ProfilePage back={back} />;
  if (module.id === "customers") return <CustomersPage module={module} action={action} back={back} />;
  return <>
    <button className="back" onClick={back}><span aria-hidden="true">←</span>Back to dashboard</button>
    <PageTitle module={module} action={action} />
    {module.workflow.length > 0 && <div className="workflow">{module.workflow.map((step, i) => <div key={step} className={i === activeStep ? "active" : ""} onClick={() => setActiveStep(i)}><i>{i + 1}</i><span>{step}</span>{i < module.workflow.length - 1 && <b>→</b>}</div>)}</div>}
    {(module.id === "billing" || module.id === "expenses" || module.id === "reports") && <FinanceSummary />}
    <div className="toolbar"><div className="search table-search"><Icon>⌕</Icon><input placeholder={`Search ${module.label.toLowerCase()}…`} /></div><Button variant="secondary">Filters</Button><Button variant="secondary">Columns</Button><span className="spacer" /><Button variant="ghost">Export</Button></div>
    <Card className="table-card"><div className="data-table"><div className="table-row table-header">{headers.map(x => <span key={x}>{x}</span>)}</div>{rows.map((row, i) => <button className="table-row" key={i} onClick={openEvent}>{row.map((cell, j) => <span key={cell} className={j === 3 ? "status-cell" : ""}>{j === 0 && <i className="record-icon">{module.icon}</i>}{cell}</span>)}</button>)}</div></Card>
    <div className="info-grid">
      <Card><div className="card-head"><div><small>BUSINESS RULE</small><h3>{module.label} controls</h3></div><Icon>i</Icon></div><p className="muted">{ruleText[module.id] || "Changes remain traceable with user, timestamp, previous value, new value and reason."}</p></Card>
      <Card><div className="card-head"><div><small>WORK QUEUE</small><h3>Needs attention</h3></div><Badge tone="red">3 items</Badge></div><div className="mini-list"><p><span>Approval waiting</span><b>2</b></p><p><span>Due today</span><b>4</b></p><p><span>Recently updated</span><b>8</b></p></div></Card>
    </div>
  </>;
}

const ruleText: Record<string, string> = {
  quotations: "Package inclusions cannot be charged twice. Approved rates are locked; changes create a new revision.",
  events: "Operational status and payment status remain separate. Rescheduling triggers a fresh venue, staff and stock check.",
  venues: "Reservations include setup and cleanup windows. Capacity and overlapping holds are validated before confirmation.",
  inventory: "Available quantity = usable stock − overlapping reservations − issued stock. Consumables and returnable assets use separate movements.",
  rentals: "Refundable security deposits are liabilities and are displayed separately from sales revenue.",
  billing: "Receipts reduce invoice balances and update the selected account without creating duplicate sales revenue.",
  expenses: "Expense recognition is separate from payment. Settling a vendor bill does not recognize the expense twice.",
};

function PageTitle({ module, action }: { module: Module; action: () => void }) {
  return <div className="page-heading module-title"><div><small>AK / {module.label.toUpperCase()}</small><h1>{module.label}</h1><p>{module.subtitle}</p></div><Button onClick={action}>＋ {module.action}</Button></div>;
}

function EventDetail({ back }: { back: () => void }) {
  const [tab, setTab] = useState("Overview");
  return <>
    <button className="back" onClick={back}><span aria-hidden="true">←</span>Back to events</button>
    <div className="event-detail-head"><div><div className="eyebrow">EV-0248 · WEDDING</div><h1>Ayesha & Hamza</h1><p>Saturday, 24 October 2026 · Emerald Hall · 300 guests</p></div><div><Badge tone="green">Operations confirmed</Badge><Badge tone="amber">PKR 150,000 due</Badge></div></div>
    <div className="tabs">{["Overview", "Services", "Planning", "Inventory", "Finance", "Documents", "History"].map(x => <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>{x}</button>)}</div>
    <div className="detail-layout">
      <div>{tab === "Finance" ? <FinanceSummary /> : <><Card className="detail-hero"><div><small>EVENT READINESS</small><h3>Everything is on track</h3><p>7 of 9 operational areas confirmed</p></div><div className="progress-ring">78%</div></Card><Card><div className="card-head"><div><small>RUN OF SHOW</small><h3>Saturday timeline</h3></div><Button variant="secondary">Open run-sheet</Button></div><div className="timeline"><p><b>08:00</b><span>Venue handover & decoration setup</span><Badge>On track</Badge></p><p><b>15:00</b><span>Catering team arrival</span><Badge tone="amber">Pending</Badge></p><p><b>18:30</b><span>Guest doors open</span><Badge tone="navy">Scheduled</Badge></p><p><b>23:00</b><span>Event close & rental count</span><Badge tone="navy">Scheduled</Badge></p></div></Card></>}</div>
      <div><Card><div className="card-head"><div><small>ASSIGNMENTS</small><h3>Event team</h3></div><Button variant="ghost">Manage</Button></div><div className="people"><p><i>SR</i><span><b>Sarah Raza</b><small>Event manager</small></span></p><p><i>BA</i><span><b>Bilal Ahmed</b><small>Floor supervisor</small></span></p><p><i>+8</i><span><b>Service crew</b><small>Confirmed</small></span></p></div></Card><Card><div className="card-head"><div><small>CUSTOMER BALANCE</small><h3>PKR 150,000 due</h3></div></div><div className="balance-bar"><i /></div><p className="muted">PKR 350,000 received of PKR 500,000</p><Button variant="secondary">Record payment</Button></Card></div>
    </div>
  </>;
}

function ActionModal({ title, close }: { title: string; close: () => void }) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><small>QUICK ACTION</small><h2>{title}</h2></div><button onClick={close} aria-label="Close">×</button></div>
    <div className="form-grid"><label>Customer<input placeholder="Search or select customer" /></label><label>Event date<input type="date" defaultValue="2026-10-24" /></label><label>Event type<select defaultValue="Wedding"><option>Wedding</option><option>Corporate</option><option>Birthday</option><option>Catering only</option></select></label><label>Venue<select defaultValue="Emerald Hall"><option>Emerald Hall</option><option>Garden Marquee</option><option>Customer’s own venue</option></select></label><label className="full">Notes<textarea placeholder="Add details, requirements or payment reference…" /></label></div>
    <div className="modal-note">Venue is optional for catering-only, decoration-only and rental-only bookings.</div><div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={close}>Save & continue →</Button></div>
  </div></div>;
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [detail, setDetail] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const current = useMemo(() => modules.find(m => m.id === active) || modules[0], [active]);
  const chooseModule = (id: string) => { setActive(id); setDetail(false); };
  return <div className="app-shell">
    <Sidebar active={active} setActive={chooseModule} open={mobileNav} close={() => setMobileNav(false)} />
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <main><Header current={current} menu={() => setMobileNav(true)} action={() => setModal(current.action)} navigate={chooseModule} /><div className="page-content">
      {detail ? <EventDetail back={() => setDetail(false)} /> : active === "dashboard" ? <Dashboard openEvent={() => { chooseModule("events"); setDetail(true); }} openAction={setModal} navigate={chooseModule} /> : <ModulePage module={current} action={() => setModal(current.action)} openEvent={() => setDetail(true)} back={() => chooseModule("dashboard")} />}
    </div></main>
    {modal && <ActionModal title={modal} close={() => setModal(null)} />}
  </div>;
}
