const SUPABASE_URL = "https://fjxoytocgfvifavzrqhc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_t-uOjIhcpNFWBCXoFoFRJA_1sAXVG4b";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const CATEGORIES = ["Food","Travel","Shopping","Education","Entertainment","Health","Rent","Transport","Transportation","Bills","Other","Others","Accommodation","Hostel","Recharge"];
const INCOME_CATEGORIES = ["Allowance","Scholarship","Stipend","Part-time job","Gift","Refund","Other"];
const $ = (selector, root=document) => root.querySelector(selector);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const supportedCurrencies = ["INR","USD","EUR","GBP","AUD","CAD"];
const currencySymbol = () => new Intl.NumberFormat("en-IN", {
  style:"currency",
  currency:supportedCurrencies.includes(state.profile?.currency)?state.profile.currency:"INR"
}).formatToParts(0).find(part=>part.type==="currency")?.value||"₹";
const preferenceStorageKey = (name,userId=null) => `kharcha:${name}${userId?`:${userId}`:""}`;
function getStoredPreference(name,userId) {
  try {
    return window.localStorage.getItem(preferenceStorageKey(name,userId));
  } catch(error) {
    console.error(`Unable to read the saved ${name} preference.`,error);
    return null;
  }
}
function saveStoredPreference(name,value,userId) {
  try {
    window.localStorage.setItem(preferenceStorageKey(name,userId),value);
  } catch(error) {
    console.error(`Unable to save the ${name} preference.`,error);
    toast(`Could not save your ${name} preference in this browser.`,true);
  }
}
const money = value => new Intl.NumberFormat(state.lang==="hi"?"hi-IN":"en-IN", {
  style:"currency",
  currency:supportedCurrencies.includes(state.profile?.currency)?state.profile.currency:"INR",
  maximumFractionDigits:2
}).format(Number(value||0));
const categoryIcon = value => state.userCategories?.find(category=>category.name===value)?.icon||({Food:"🍕",Travel:"✈️",Shopping:"🛍️",Education:"📚",Bills:"💡",Health:"🏥",Entertainment:"🎮",Rent:"🏠",Transport:"🚗",Transportation:"🚗",Others:"📦",Other:"📦",Accommodation:"🏠",Hostel:"🏠",Recharge:"📱",Allowance:"💰",Scholarship:"🎓",Stipend:"💼","Part-time job":"💼",Gift:"🎁",Refund:"↩️"})[value]||"📦";
const todayISO = () => {
  const date=new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
};
const monthISO = () => `${todayISO().slice(0,7)}-01`;
const isValidISODate = value => {
  const match=String(value||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match)return false;
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
  return date.getFullYear()===Number(match[1])&&date.getMonth()===Number(match[2])-1&&date.getDate()===Number(match[3]);
};

const state = {
  user:null, profile:null, profileEditing:false, view:"dashboard", lang:getStoredPreference("language")==="hi"?"hi":"en", theme:getStoredPreference("theme")==="dark"?"dark":"light", loading:false, loadError:"", calendarMonth:monthISO(), calendarDate:todayISO(),
  expenses:[], incomes:[], budgets:[], goals:[], contributions:[], userCategories:[], categoriesError:"",
  notificationsEnabled:true, exportMonth:todayISO().slice(0,7), exportYear:String(new Date().getFullYear()),
  groups:[], notifications:[], transactionFilter:"", transactionCategory:"", transactionMethod:"", transactionType:"", transactionFrom:"", transactionTo:"", transactionSort:"date-desc", reportFrom:monthISO(), reportTo:todayISO(),
  chat:[{role:"assistant",text:"Ask about your actual spending, budgets, or savings."}],
  receiptFile:null, recurring:[], subscriptions:[], reminders:[], challenges:[], learning:[],
  adminProfiles:0
};
document.documentElement.dataset.theme=state.theme;
document.documentElement.lang=state.lang;

const copy = {
  en:{dashboard:"Dashboard",health:"Financial Health",transactions:"Transactions",addExpense:"Add Expense",addIncome:"Add Income",income:"Income",budgets:"Budget Management",categories:"Categories",recurring:"Recurring",subscriptions:"Subscriptions",calendar:"Calendar",insights:"Smart Insights",goals:"Savings goals",challenges:"Challenges",receipt:"Scan Receipt",assistant:"AI assistant",groups:"Group Expenses",friends:"Friends",analytics:"Spending Analytics",reports:"Reports & Analytics",exports:"Export Data",learning:"Learn Finance",tips:"Financial Tips",achievements:"Achievements",support:"Help & Support",profile:"My Profile",settings:"Settings",admin:"Admin",notifications:"Notifications",greeting:"Good to see you"},
  hi:{dashboard:"डैशबोर्ड",health:"वित्तीय स्वास्थ्य",transactions:"लेन-देन",addExpense:"खर्च जोड़ें",addIncome:"आय जोड़ें",income:"आय",budgets:"बजट प्रबंधन",categories:"श्रेणियाँ",recurring:"आवर्ती खर्च",subscriptions:"सदस्यताएँ",calendar:"कैलेंडर",insights:"समझदारी सुझाव",goals:"बचत लक्ष्य",challenges:"चुनौतियाँ",receipt:"रसीद स्कैनर",assistant:"AI सहायक",groups:"ग्रुप खर्च",friends:"दोस्त",analytics:"खर्च विश्लेषण",reports:"रिपोर्ट और विश्लेषण",exports:"डेटा निर्यात",learning:"वित्त सीखें",tips:"वित्तीय सुझाव",achievements:"उपलब्धियाँ",support:"सहायता",profile:"प्रोफाइल",settings:"सेटिंग्स",admin:"एडमिन",notifications:"सूचनाएं",greeting:"आपका स्वागत है"}
};
const tr = key => copy[state.lang]?.[key] || copy.en[key] || key;
const uiTranslations = {
  "Overview":"अवलोकन","Features":"विशेषताएँ","How it works":"यह कैसे काम करता है","Sign in to secure your data":"अपना डेटा सुरक्षित रखने के लिए साइन इन करें","Student finance, made clear":"छात्रों के वित्त का सरल प्रबंधन",
  "Financial Health":"वित्तीय स्वास्थ्य","Transactions":"लेन-देन","Add Expense":"खर्च जोड़ें","Add Income":"आय जोड़ें","Income":"आय","Expense":"खर्च","Budget Management":"बजट प्रबंधन","Categories":"श्रेणियाँ","Recurring expenses":"आवर्ती खर्च","Subscriptions":"सदस्यताएँ","Financial calendar":"वित्तीय कैलेंडर","Smart Insights":"स्मार्ट सुझाव","Savings goals":"बचत लक्ष्य","Savings challenges":"बचत चुनौतियाँ","Scan Receipt":"रसीद स्कैन करें","AI assistant":"AI सहायक","Group expenses":"समूह खर्च","Friends":"दोस्त","Spending Analytics":"खर्च विश्लेषण","Reports & Analytics":"रिपोर्ट और विश्लेषण","Export Data":"डेटा निर्यात","Learn Finance":"वित्त सीखें","Financial Tips":"वित्तीय सुझाव","Achievements":"उपलब्धियाँ","Notifications":"सूचनाएँ","My Profile":"मेरी प्रोफ़ाइल","Settings":"सेटिंग्स","Help & Support":"सहायता","Admin":"एडमिन",
  "OVERVIEW":"अवलोकन","TRANSACTIONS":"लेन-देन","REPORTING":"रिपोर्टिंग","ACCOUNT":"खाता","MORE":"अन्य","Kharcha":"खर्चा","Dashboard":"डैशबोर्ड","Log in":"लॉग इन","Log out":"लॉग आउट","Change language":"भाषा बदलें","Toggle theme":"थीम बदलें","Open navigation":"नेविगेशन खोलें","Open profile":"प्रोफ़ाइल खोलें","Search transactions":"लेन-देन खोजें",
  "All transactions":"सभी लेन-देन","Income and expenses saved to your account":"आपके खाते में सहेजी गई आय और खर्च","Search title, category or method":"शीर्षक, श्रेणी या भुगतान विधि खोजें","Income & expenses":"आय और खर्च","Expenses":"खर्च","All categories":"सभी श्रेणियाँ","All payments":"सभी भुगतान","Newest":"नवीनतम","Oldest":"सबसे पुराने","Highest amount":"सबसे अधिक राशि","Lowest amount":"सबसे कम राशि","Export CSV":"CSV निर्यात करें","Date":"तारीख","Title":"शीर्षक","Type":"प्रकार","Category":"श्रेणी","Payment":"भुगतान","Amount":"राशि","Actions":"कार्रवाई","Details":"विवरण","Edit":"बदलें","Delete":"हटाएँ","No transactions match your filters.":"आपके फ़िल्टर से कोई लेन-देन नहीं मिला।",
  "Profile":"प्रोफ़ाइल","Personal Kharcha settings":"खर्चा की व्यक्तिगत सेटिंग्स","Full name":"पूरा नाम","Email":"ईमेल","College":"कॉलेज","Monthly allowance":"मासिक भत्ता","Preferred currency":"पसंदीदा मुद्रा","Language":"भाषा","Save changes":"बदलाव सहेजें","Cancel":"रद्द करें","Edit profile":"प्रोफ़ाइल बदलें","Account security":"खाता सुरक्षा","Reset password":"पासवर्ड रीसेट करें","Send a secure password reset email to":"सुरक्षित पासवर्ड रीसेट ईमेल भेजें",
  "Preferences":"प्राथमिकताएँ","Personalize your Kharcha experience.":"अपने खर्चा अनुभव को व्यक्तिगत बनाएँ।","Appearance":"दिखावट","Light":"लाइट","Dark":"डार्क","English":"अंग्रेज़ी","Save preferences":"प्राथमिकताएँ सहेजें","Enable in-app notifications and budget alerts":"ऐप सूचनाएँ और बजट अलर्ट चालू करें","Privacy & account":"गोपनीयता और खाता",
  "No notifications":"कोई सूचना नहीं","Budget and savings alerts will appear here.":"बजट और बचत अलर्ट यहाँ दिखाई देंगे।","Notifications are off":"सूचनाएँ बंद हैं","Turn them on in Settings to receive budget alerts.":"बजट अलर्ट पाने के लिए सेटिंग्स में इन्हें चालू करें।","Mark all read":"सभी को पढ़ा हुआ चिह्नित करें","Read":"पढ़ा गया","Unread":"अपठित","Try again":"फिर से प्रयास करें","Loading your finances":"आपका वित्तीय डेटा लोड हो रहा है","Add expense":"खर्च जोड़ें","Add income":"आय जोड़ें","View all transactions":"सभी लेन-देन देखें","Set budget":"बजट तय करें","Download report":"रिपोर्ट डाउनलोड करें","Save expense":"खर्च सहेजें","Save income":"आय सहेजें","Description":"विवरण","Optional notes":"वैकल्पिक टिप्पणी","Payment method":"भुगतान विधि","Save":"सहेजें","Welcome back":"वापसी पर स्वागत है"
};
function localizeRenderedInterface() {
  if(state.lang!=="hi")return;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())) {
    const text=node.nodeValue;
    const trimmed=text.trim();
    if(uiTranslations[trimmed])node.nodeValue=text.replace(trimmed,uiTranslations[trimmed]);
  }
  document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(element=>{
    for(const attribute of ["placeholder","aria-label","title"]) {
      const value=element.getAttribute(attribute);
      if(value&&uiTranslations[value])element.setAttribute(attribute,uiTranslations[value]);
    }
  });
}
const availableCategories = type => [...new Set([
  ...(type==="income"?INCOME_CATEGORIES:CATEGORIES),
  ...state.userCategories.filter(category=>category.type===type).map(category=>category.name)
])];

function toast(message, error=false) {
  const item=document.createElement("div");
  item.className="toast"+(error?" error":"");
  item.textContent=message;
  $("#toastRegion").append(item);
  setTimeout(()=>item.remove(),4200);
}

async function safeQuery(label, promise) {
  const {data,error}=await promise;
  if(error) throw new Error(`${label}: ${error.message}`);
  return data || [];
}

async function loadProfile() {
  const user=state.user;
  if(!user) { state.profile=null; return; }
  const {data,error}=await db.from("profiles").select("*").eq("id",user.id).maybeSingle();
  if(state.user?.id!==user.id)return;
  if(error) {
    state.profile={full_name:user.user_metadata?.full_name||"",role:"student"};
    toast(`Profile: ${error.message}`,true);
  } else state.profile=data||{full_name:user.user_metadata?.full_name||"",role:"student"};
  const savedLanguage=getStoredPreference("language",user.id);
  const savedTheme=getStoredPreference("theme",user.id);
  state.lang=(savedLanguage==="hi"||savedLanguage==="en"?savedLanguage:state.profile.language)||"en";
  state.theme=(savedTheme==="dark"||savedTheme==="light"?savedTheme:state.profile.theme)||"light";
  state.notificationsEnabled=state.profile.notifications_enabled!==false;
  document.documentElement.dataset.theme=state.theme;
  document.documentElement.lang=state.lang;
}

async function loadData() {
  if(!state.user) {
    clearUserData();
    state.loading=false;
    state.loadError="";
    render();
    return;
  }
  const userId=state.user.id;
  state.loading=true;
  state.loadError="";
  clearUserData();
  render();
  try {
    const month=monthISO();
    const [expenses,incomes,budgets,goals,contributions,notifications,recurring,subscriptions,reminders,challenges,learning,groups]=await Promise.all([
      safeQuery("Expenses",db.from("expenses").select("*").eq("user_id",userId).order("created_at",{ascending:false})),
      safeQuery("Income",db.from("incomes").select("*").eq("user_id",userId).order("income_date",{ascending:false})),
      safeQuery("Budgets",db.from("budgets").select("*").eq("user_id",userId).eq("month",month)),
      safeQuery("Savings goals",db.from("savings_goals").select("*").eq("user_id",userId).order("created_at",{ascending:false})),
      safeQuery("Contributions",db.from("savings_contributions").select("*").eq("user_id",userId).order("contribution_date",{ascending:false})),
      safeQuery("Notifications",db.from("notifications").select("*").eq("user_id",userId).order("created_at",{ascending:false}).limit(30)),
      safeQuery("Recurring expenses",db.from("recurring_expenses").select("*").eq("user_id",userId).order("next_due_date")),
      safeQuery("Subscriptions",db.from("subscriptions").select("*").eq("user_id",userId).order("next_payment_date")),
      safeQuery("Calendar reminders",db.from("calendar_reminders").select("*").eq("user_id",userId).order("reminder_date")),
      safeQuery("Savings challenges",db.from("financial_challenges").select("*").eq("user_id",userId).order("end_date")),
      safeQuery("Learning progress",db.from("learning_progress").select("*").eq("user_id",userId)),
      safeQuery("Groups",db.from("groups").select("*, group_members(*), group_expenses(*, group_splits(*), settlements(*) )").order("created_at",{ascending:false}))
    ]);
    if(state.user?.id!==userId) return;
    state.expenses=expenses.map(x=>({
      id:x.id, amount:Number(x.amount||0), merchant:x.merchant||x.description||"Expense",
      category:x.category||"Other", date:x.transaction_date||x.date||x.created_at?.slice(0,10)||todayISO(),
      payment_method:x.payment_method||x.source||"UPI", description:x.description||"", created_at:x.created_at
    }));
    state.incomes=incomes.map(x=>({...x,amount:Number(x.amount||0)}));
    state.budgets=budgets.map(x=>({...x,amount:Number(x.amount||0)}));
    state.goals=goals.map(x=>({...x,target_amount:Number(x.target_amount||0)}));
    state.contributions=contributions.map(x=>({...x,amount:Number(x.amount||0)}));
    state.notifications=notifications;
    state.recurring=recurring;
    state.subscriptions=subscriptions;
    state.reminders=reminders;
    state.challenges=challenges;
    state.learning=learning;
    state.groups=groups;
    const categoriesResult=await db.from("user_categories").select("*").eq("user_id",userId).order("name");
    if(categoriesResult.error) {
      state.userCategories=[];
      state.categoriesError=categoriesResult.error.message;
    } else {
      state.userCategories=categoriesResult.data||[];
      state.categoriesError="";
    }
    if(state.user?.id!==userId)return;
  } catch(error) {
    if(state.user?.id===userId) state.loadError=error.message;
  }
  if(state.user?.id!==userId) return;
  state.loading=false;
  if(state.loadError) toast(state.loadError,true);
  if(state.profile?.role==="admin"){
    const profiles=await db.from("profiles").select("id",{count:"exact",head:false});
    if(!profiles.error) state.adminProfiles=profiles.count||profiles.data?.length||0;
  }
  render();
}

function clearUserData() {
  state.expenses=[];
  state.incomes=[];
  state.budgets=[];
  state.goals=[];
  state.contributions=[];
  state.groups=[];
  state.notifications=[];
  state.recurring=[];
  state.subscriptions=[];
  state.reminders=[];
  state.challenges=[];
  state.learning=[];
  state.userCategories=[];
  state.categoriesError="";
  state.adminProfiles=0;
  state.chat=[{role:"assistant",text:"Ask about your actual spending, budgets, or savings."}];
}

function isCurrentMonth(itemDate) {
  return String(itemDate||"").slice(0,7)===todayISO().slice(0,7);
}
function totals() {
  const monthExpenses=state.expenses.filter(x=>isCurrentMonth(x.date));
  const monthIncome=state.incomes.filter(x=>isCurrentMonth(x.income_date));
  const expense=monthExpenses.reduce((sum,x)=>sum+x.amount,0);
  const income=monthIncome.reduce((sum,x)=>sum+x.amount,0);
  const goalSaved=state.contributions.filter(x=>isCurrentMonth(x.contribution_date)).reduce((sum,x)=>sum+x.amount,0);
  const now=new Date();
  const daysPassed=Math.max(1,now.getDate());
  const remaining=income-expense-goalSaved;
  const totalIncome=state.incomes.reduce((sum,x)=>sum+x.amount,0);
  const totalExpenses=state.expenses.reduce((sum,x)=>sum+x.amount,0);
  const totalSavings=state.contributions.reduce((sum,x)=>sum+x.amount,0);
  const budget=state.budgets.reduce((sum,x)=>sum+x.amount,0);
  const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const safeLimit=Math.max(0,remaining)/Math.max(1,daysInMonth-now.getDate()+1);
  return {income,expense,remaining,savings:totalSavings,monthlySavings:goalSaved,totalIncome,totalExpenses,totalBalance:totalIncome-totalExpenses-totalSavings,budget,average:expense/daysPassed,safeLimit};
}

function navigation() {
  if(!state.user) {
    $("#navigation").innerHTML=`<button class="nav-button" data-action="landing"><span class="nav-icon">⌂</span><span>${tr("dashboard")}</span></button>
      <button class="nav-button" data-action="public-features"><span class="nav-icon">✦</span><span>${state.lang==="hi"?"विशेषताएँ":"Features"}</span></button>
      <button class="nav-button" data-action="public-how"><span class="nav-icon">↗</span><span>${state.lang==="hi"?"यह कैसे काम करता है":"How it works"}</span></button>`;
    $("#sidebarUser").textContent=state.lang==="hi"?"छात्रों के वित्त का सरल प्रबंधन":"Student finance, made clear";
    return;
  }
  const entries=[
    ["dashboard","▦","dashboard"],["health","♥","health"],
    ["transactions","⇄","transactions"],["add-expense","−","addExpense"],["add-income","＋","addIncome"],["income","₹","income"],["budgets","◫","budgets"],["categories","◉","categories"],["recurring","↻","recurring"],["subscriptions","▤","subscriptions"],
    ["assistant","✦","assistant"],["receipt","▣","receipt"],["insights","◈","insights"],["calendar","□","calendar"],
    ["goals","◎","goals"],["challenges","◆","challenges"],
    ["groups","⌘","groups"],["friends","●","friends"],
    ["analytics","↗","analytics"],["analytics","▥","reports"],["exports","⇩","exports"],["learning","◫","learning"],["tips","!","tips"],["achievements","★","achievements"],
    ["notifications","♢","notifications"],["profile","◉","profile"],["settings","⚙","settings"],["support","?","support"]
  ];
  if(state.profile?.role==="admin") entries.push(["admin","◆","admin"]);
  const groups=[
    ["OVERVIEW",[["dashboard","▦","dashboard"]]],
    ["TRANSACTIONS",[["add-income","＋","addIncome"],["add-expense","−","addExpense"],["transactions","⇄","transactions"],["budgets","◫","budgets"],["categories","◉","categories"]]],
    ["REPORTING",[["reports","▥","reports"],["receipt","▣","receipt"],["exports","⇩","exports"]]],
    ["ACCOUNT",[["profile","◉","profile"],["settings","⚙","settings"],["support","?","support"]]],
    ["MORE",[["income","₹","income"],["health","♥","health"],["assistant","✦","assistant"],["insights","◈","insights"],["calendar","□","calendar"],["goals","◎","goals"],["challenges","◆","challenges"],["groups","⌘","groups"],["friends","●","friends"],["recurring","↻","recurring"],["subscriptions","▤","subscriptions"],["learning","◫","learning"],["tips","!","tips"],["achievements","★","achievements"],["notifications","♢","notifications"]]]
  ];
  $("#navigation").innerHTML=groups.map(([label,items])=>`<div class="nav-group"><div class="nav-label">${label}</div>${items.map(([view,icon,key])=>`
    <button class="nav-button ${state.view===view?"active":""}" data-action="nav" data-view="${view}">
      <span class="nav-icon">${icon}</span><span>${tr(key)}</span>
    </button>`).join("")}</div>`).join("");
  $("#sidebarUser").textContent=state.user ? (state.profile?.full_name||state.user.email) : "Sign in to secure your data";
}

function render() {
  navigation();
  document.querySelector(".app-shell").classList.toggle("public-shell",!state.user);
  const names={dashboard:"Dashboard",health:"Financial Health",transactions:"Transactions","add-expense":"Add Expense","add-income":"Add Income",income:"Income",budgets:"Budget Management",categories:"Categories",recurring:"Recurring expenses",subscriptions:"Subscriptions",calendar:"Financial calendar",insights:"Smart Insights",goals:"Savings goals",challenges:"Savings challenges",receipt:"Scan Receipt",assistant:"AI assistant",groups:"Group expenses",friends:"Friends",analytics:"Spending Analytics",reports:"Reports & Analytics",exports:"Export Data",learning:"Learn Finance",tips:"Financial Tips",achievements:"Achievements",notifications:"Notifications",settings:"Settings",support:"Help & Support",profile:"My Profile",admin:"Admin"};
  const titleKey=state.view==="add-expense"?"addExpense":state.view==="add-income"?"addIncome":state.view;
  $("#pageTitle").textContent=copy[state.lang]?.[titleKey]||names[state.view]||state.view;
  if(state.view==="dashboard"){
    const hour=new Date().getHours();
    const greeting=hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";
    const name=state.user?(state.profile?.full_name||state.user.email||"Student").split(" ")[0]:tr("greeting");
    $("#eyebrow").textContent=`${greeting}, ${name}`;
  }else{
    $("#eyebrow").textContent="Kharcha";
  }
  $("#authButton").textContent=state.user?"Log out":"Log in";
  const profileButton=$("#profileButton");
  if(profileButton){
    profileButton.hidden=!state.user;
    if(state.user){
      const name=state.profile?.full_name||state.user.email||"Student";
      profileButton.textContent=state.profile?.profile_photo_url?"":name.trim().charAt(0).toUpperCase();
      if(state.profile?.profile_photo_url) profileButton.style.background=`url("${escapeHTML(state.profile.profile_photo_url)}") center/cover`;
      else profileButton.style.background="";
      profileButton.title=name;
    }
  }
  $("#notificationDot").hidden=!state.notificationsEnabled||!state.notifications.some(n=>!n.read_at);
  const views={dashboard:dashboardView,health:financialHealthView,"add-expense":()=>entryFormView("expense"),"add-income":()=>entryFormView("income"),transactions:transactionsView,income:incomeView,budgets:budgetsView,categories:categoriesView,recurring:recurringView,subscriptions:subscriptionsView,calendar:calendarView,insights:smartInsightsView,goals:goalsView,challenges:challengesView,receipt:receiptView,assistant:assistantView,groups:groupsView,friends:friendsView,analytics:analyticsView,reports:analyticsView,exports:exportsView,learning:learningView,tips:financialTipsView,achievements:achievementsView,notifications:notificationsView,settings:settingsView,support:supportView,profile:profileView,admin:adminView};
  if(state.user&&state.loading) {
    $("#content").innerHTML=`<section class="card loading-card" role="status"><span class="loading-spinner" aria-hidden="true"></span><h2>Loading your finances</h2><p class="muted small">Fetching your private Kharcha data…</p></section>`;
    localizeRenderedInterface();
    return;
  }
  if(state.user&&state.loadError) {
    $("#content").innerHTML=`<section class="card load-error" role="alert"><h2>We couldn’t load your account data</h2><p class="muted">${escapeHTML(state.loadError)}</p><p class="small muted">If Supabase reports missing tables or columns, apply the additive migrations in <code>supabase/migrations/</code>, including <code>20261121000200_dashboard_sections.sql</code>, then retry. Existing records are not deleted.</p><button class="button" data-action="retry-load">Try again</button></section>`;
    localizeRenderedInterface();
    return;
  }
  $("#content").innerHTML=state.user ? (views[state.view]||dashboardView)() : signedOutView();
  localizeRenderedInterface();
}

function signedOutView() {
  return `<section class="landing">
    <header class="landing-nav">
      <button class="landing-brand" data-action="landing" aria-label="Kharcha home"><span class="brand-mark">₹</span><span>kharcha</span></button>
      <button class="icon-button landing-menu-button" data-action="toggle-public-menu" aria-label="Open site navigation" aria-expanded="false" aria-controls="landingNavigation">☰</button>
      <nav id="landingNavigation" aria-label="Landing navigation">
        <button data-action="landing">Home</button>
        <button data-action="public-features">Features</button>
        <button data-action="public-about">About</button>
        <button data-action="public-contact">Contact</button>
        <button data-open-auth="login">Login</button>
      </nav>
      <div class="landing-nav-actions"><button class="button secondary" data-open-auth="login">Log in</button><button class="button" data-open-auth="signup">Get started</button></div>
    </header>
    <div class="landing-hero">
      <div class="landing-copy">
        <span class="landing-kicker">Student money, made clear</span>
        <h2>Manage Your Money,<br><span>Smarter.</span></h2>
        <p>Meet your new financial companion. Track expenses, manage budgets, split bills and build smarter saving habits – all in one place.</p>
        <div class="landing-actions"><button class="button" data-open-auth="signup">Get Started Free</button><button class="button secondary" data-action="public-features">Explore Features</button></div>
        <div class="trust-row"><span>✓ Private by default</span><span>✓ Supabase secured</span><span>✓ Hindi & English</span></div>
      </div>
      <div class="landing-preview" aria-label="Illustrative Kharcha dashboard preview">
        <span class="badge warning" style="margin-bottom:12px">DEMO DATA — not live account information</span>
        <div class="preview-top"><span><b>₹10,450</b><small>Available balance</small></span><span class="preview-month">November</span></div>
        <div class="preview-grid"><div><small>Income</small><b>₹18,000</b></div><div><small>Expenses</small><b>₹5,550</b></div><div><small>Saved</small><b>₹2,000</b></div></div>
        <div class="preview-chart"><div style="height:38%"></div><div style="height:56%"></div><div style="height:44%"></div><div style="height:72%"></div><div style="height:62%"></div><div style="height:84%"></div><div style="height:68%"></div></div>
      </div>
    </div>
    <section id="public-features" class="landing-section">
      <p class="eyebrow">Everything in one place</p><h2>Built around a student’s real money life</h2>
      <div class="feature-grid"><article><span>⇄</span><h3>Daily transactions</h3><p>Add, search and edit expenses or income in seconds.</p></article><article><span>◫</span><h3>Smart budgets</h3><p>Set monthly and category limits with clear progress.</p></article><article><span>◎</span><h3>Savings goals</h3><p>Track targets and contributions without guesswork.</p></article><article><span>⌘</span><h3>Shared expenses</h3><p>Split room and friend costs and see who owes whom.</p></article></div>
    </section>
    <section id="public-how" class="landing-section landing-how"><div><p class="eyebrow">How it works</p><h2>From first entry to monthly clarity</h2></div><div class="how-grid"><article><b>1</b><div><h3>Create an account</h3><p>Sign up with an email and secure password.</p></div></article><article><b>2</b><div><h3>Add your money</h3><p>Record allowance, income and everyday expenses.</p></div></article><article><b>3</b><div><h3>Make better choices</h3><p>Follow budgets, savings and clear spending reports.</p></div></article></div></section>
    <section id="public-about" class="landing-section landing-about"><img src="./assets/students-finance.jpg" alt="Students collaborating while planning their studies and finances" loading="lazy"><div><p class="eyebrow">About Kharcha</p><h2>Built for the way students actually manage money.</h2><p>Kharcha keeps allowance, expenses, shared costs and savings together, with simple language and practical reminders.</p></div></section>
    <section class="landing-section"><p class="eyebrow">Student-friendly by design</p><h2>Why Kharcha?</h2><div class="feature-grid"><article><h3>Simple to start</h3><p>No spreadsheet setup or complicated finance vocabulary.</p></article><article><h3>Private by default</h3><p>Personal financial records are protected by user-specific access rules.</p></article><article><h3>Real insights</h3><p>Recommendations are calculated from connected data, never fabricated.</p></article><article><h3>Built for mobile</h3><p>Capture, track and review money on the go.</p></article></div></section>
    <section id="public-faq" class="landing-section"><p class="eyebrow">Frequently asked questions</p><div class="landing-faq"><details><summary>Is the public dashboard real student data?</summary><p>No. It is clearly labelled demo data and is separate from any signed-in account.</p></details><details><summary>Can I use Kharcha without a college account?</summary><p>Yes. The public site is visible to everyone; personal features require sign-up.</p></details><details><summary>How is my financial data protected?</summary><p>Supabase authentication and row-level security ensure users access only their own records.</p></details><details><summary>Is the financial health score a credit score?</summary><p>No. It is a transparent budgeting and saving habit indicator, not an official financial rating.</p></details></div></section>
    <section id="public-contact" class="landing-section landing-contact"><div><p class="eyebrow">Contact</p><h2>Questions or feedback?</h2><p>Use the in-app help form after signing in. It will save your request securely to Supabase.</p></div><button class="button" data-open-auth="signup">Create account</button></section>
    <section class="landing-section landing-cta"><div><p class="eyebrow">Start today</p><h2>Your money. Your goals. Your future.</h2></div><button class="button" data-open-auth="signup">Get started free</button></section>
    <footer class="landing-footer"><div><strong>kharcha</strong><p class="small muted">A student-first financial companion.</p></div><nav class="footer-links" aria-label="Footer"><a href="#public-about">About</a><a href="#public-faq">Privacy & security</a><a href="#public-contact">Help & support</a></nav></footer>
  </section>`;
}

function financialHealthScore(t) {
  const budgetScore=t.budget?Math.max(0,100-Math.abs(t.expense/t.budget*100-75)*.8):40;
  const savingsScore=t.income?Math.min(100,Math.round(t.savings/t.income*100*4)):0;
  const trackingScore=Math.min(100,state.expenses.length*10);
  const goalProgress=state.goals.length?state.goals.reduce((sum,g)=>{
    const saved=state.contributions.filter(c=>c.goal_id===g.id).reduce((s,c)=>s+c.amount,0);
    return sum+(g.target_amount?Math.min(saved/g.target_amount,1)*100:0);
  },0)/state.goals.length:30;
  const score=Math.round(budgetScore*.35+savingsScore*.25+trackingScore*.2+goalProgress*.2);
  return {score:Math.min(100,score),budgetScore,savingsScore,trackingScore,goalProgress};
}

function addExpenseView() {
  return entryFormView("expense");
}

function entryFormView(type) {
  const isIncome=type==="income";
  const categories=availableCategories(type);
  const categoryOptions=categories.map(category=>`<option value="${escapeHTML(category)}">${escapeHTML(categoryIcon(category))} ${escapeHTML(category)}</option>`).join("");
  return `<section class="card entry-card"><div class="card-head"><div><p class="eyebrow">${isIncome?"Income":"Expense"} entry</p><h2>${isIncome?"Add income":"Add expense"}</h2><p class="small muted">Your entry is saved to your authenticated Kharcha account.</p></div></div>
    <form id="entryForm" class="form-grid">
      <input type="hidden" name="type" value="${type}">
      <div class="field"><label for="entryTitle">${isIncome?"Income title":"Expense title"}</label><input id="entryTitle" name="${isIncome?"source":"merchant"}" maxlength="120" placeholder="${isIncome?"Allowance, scholarship, stipend":"e.g. Lunch at campus"}" required></div>
      <div class="field"><label for="entryAmount">Amount (${escapeHTML(currencySymbol())})</label><input id="entryAmount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required></div>
      <div class="field"><label for="entryCategory">Category</label><select id="entryCategory" name="category" required>${categoryOptions}</select></div>
      <div class="field"><label for="entryDate">Date</label><input id="entryDate" name="date" type="date" value="${todayISO()}" required></div>
      <div class="field"><label for="entryPayment">Payment method</label><select id="entryPayment" name="payment_method">${["UPI","Card","Debit Card","Credit Card","Cash","Net banking","Wallet","Other"].map(method=>`<option>${method}</option>`).join("")}</select></div>
      <div class="field full"><label for="entryDescription">Description</label><textarea id="entryDescription" name="description" maxlength="500" placeholder="Optional notes"></textarea></div>
      <div class="form-actions full"><button class="button" type="submit">Save ${isIncome?"income":"expense"}</button><button class="button secondary" type="button" data-action="cancel-entry">Cancel</button></div>
    </form></section>`;
}

function financialHealthView() {
  const health=financialHealthScore(totals());
  const items=[
    ["Budget discipline",health.budgetScore,"How closely spending follows monthly budgets"],
    ["Savings consistency",health.savingsScore,"Contributions compared with monthly income"],
    ["Expense tracking",health.trackingScore,"How consistently the account records transactions"],
    ["Goal progress",health.goalProgress,"Average progress across active savings goals"]
  ];
  return `<div class="grid2"><section class="card"><div class="kpi-label">Financial health score</div><div class="kpi">${health.score}/100</div><div class="progress" style="margin:12px 0"><span style="width:${health.score}%"></span></div><p class="small muted">A transparent planning indicator based on real Kharcha activity. This is not a credit score.</p></section><section class="card"><h2>Score breakdown</h2>${items.map(([name,value,note])=>`<div style="margin-top:14px"><div class="row"><strong>${name}</strong><span class="small muted">${Math.round(value)}%</span></div><div class="progress" style="margin-top:6px"><span style="width:${Math.min(100,value)}%"></span></div><p class="small muted">${note}</p></div>`).join("")}</section></div>`;
}

function smartInsightsView() {
  const t=totals(), month=state.expenses.filter(x=>isCurrentMonth(x.date));
  const totalsByCategory=CATEGORIES.map(c=>[c,month.filter(x=>x.category===c).reduce((sum,x)=>sum+x.amount,0)]).sort((a,b)=>b[1]-a[1]);
  const top=totalsByCategory.find(x=>x[1]>0);
  const highest=month.reduce((a,x)=>!a||x.amount>a.amount?x:a,null);
  const avg=t.expense?month.length?month.length/t.expense:0:0;
  const insights=[];
  if(top)insights.push({title:`${top[0]} is your highest-spending category`,body:`You recorded ${money(top[1])} in ${top[0]} this month.`,action:"Review budget",view:"budgets"});
  if(t.budget&&t.expense/t.budget>=.75)insights.push({title:"Monthly budget needs attention",body:`You have used ${Math.round(t.expense/t.budget*100)}% of your combined category budgets.`,action:"Open budgets",view:"budgets"});
  if(highest)insights.push({title:"Largest transaction",body:`${escapeHTML(highest.merchant)} was ${money(highest.amount)} on ${escapeHTML(highest.date)}.`,action:"View transactions",view:"transactions"});
  if(!insights.length)insights.push({title:"Start tracking",body:"Add your income and expenses to generate personalized insights.",action:"Add expense","view":"transactions"});
  return `<div class="grid2">${insights.map(i=>`<section class="card"><h3>${escapeHTML(i.title)}</h3><p class="muted small" style="margin:8px 0 14px">${i.body}</p><button class="button small secondary" data-action="nav" data-view="${i.view}">${i.action}</button></section>`).join("")}</div>`;
}

function friendsView() {
  const members=new Map();
  state.groups.forEach(g=>(g.group_members||[]).forEach(m=>members.set(m.id,m)));
  const cards=[...members.values()].map(m=>`<div class="card"><div class="kpi-label">Group member</div><h3 style="margin-top:8px">${escapeHTML(m.display_name)}</h3></div>`).join("");
  return `<div class="card"><div class="card-head"><div><h2>Friends</h2><p class="small muted">People currently added to your expense groups</p></div><button class="button" data-action="nav" data-view="groups">Manage groups</button></div><div class="grid3">${cards||`<div class="empty">No friends have been added yet.</div>`}</div></div>`;
}

function financialTipsView() {
  const tips=[
    ["Needs vs wants","Write down purchases for seven days before deciding which expenses to reduce."],
    ["The 24-hour pause","Wait a day before non-essential shopping."],
    ["Save before spending","Move a fixed amount to savings when allowance or income arrives."],
    ["Review subscriptions","Cancel services that you have not used this month."],
    ["Emergency buffer","Build a small reserve for unexpected travel or medical costs."]
  ];
  return `<div class="grid2">${tips.map(([title,body])=>`<section class="card"><span class="badge">Student tip</span><h3 style="margin-top:12px">${title}</h3><p class="muted small">${body}</p></section>`).join("")}</div>`;
}

function notificationsView() {
  return `<div class="card"><div class="card-head"><div><h2>Notifications</h2><p class="small muted">Budget, savings and account updates</p></div><div><button class="button small secondary" data-action="mark-all-read">Mark all read</button></div></div>${state.notifications.map(n=>`<div class="notification-item"><div class="row"><strong>${escapeHTML(n.title)}</strong><span class="badge ${n.read_at?"":"warning"}">${n.read_at?"Read":"Unread"}</span></div><p class="small muted">${escapeHTML(n.message)}</p><button class="button small danger" data-action="delete-notification" data-id="${n.id}">Delete</button></div>`).join("")||`<div class="empty">No notifications.</div>`}</div>`;
}

function settingsView() {
  const profile=state.profile||{};
  return `<div class="grid2"><section class="card"><div class="card-head"><div><h2>Preferences</h2><p class="small muted">Personalize your Kharcha experience.</p></div></div>
    <form id="settingsForm" class="form-grid">
      <div class="field"><label for="settingsTheme">Appearance</label><select id="settingsTheme" name="theme"><option value="light" ${state.theme==="light"?"selected":""}>Light</option><option value="dark" ${state.theme==="dark"?"selected":""}>Dark</option></select></div>
      <div class="field"><label for="settingsLanguage">Language</label><select id="settingsLanguage" name="language"><option value="en" ${state.lang==="en"?"selected":""}>English</option><option value="hi" ${state.lang==="hi"?"selected":""}>हिन्दी</option></select></div>
      <div class="field"><label for="settingsCurrency">Currency</label><select id="settingsCurrency" name="currency">${supportedCurrencies.map(currency=>`<option value="${currency}" ${(profile.currency||"INR")===currency?"selected":""}>${currency}</option>`).join("")}</select></div>
      <label class="field checkbox-field"><input type="checkbox" name="notifications_enabled" ${state.notificationsEnabled?"checked":""}> Enable in-app notifications and budget alerts</label>
      <div class="form-actions full"><button class="button" type="submit">Save preferences</button><button class="button secondary" type="button" data-action="reset-password">Reset password</button><button class="button danger" type="button" data-action="logout">Log out</button></div>
    </form><p class="small muted">Currency changes update display formatting only; Kharcha does not convert saved amounts.</p></section><section class="card"><h2>Privacy & account</h2><p class="muted small">Your personal records use your authenticated Supabase account and row-level security. Preferences are saved to your profile.</p><button class="button secondary" data-action="nav" data-view="profile" style="margin-top:14px">Edit profile</button></section></div>`;
}

function dashboardView() {
  const t=totals();
  const health=financialHealthScore(t);
  const dateLabel=new Date().toLocaleDateString(state.lang==="hi"?"hi-IN":"en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const month=state.expenses.filter(x=>isCurrentMonth(x.date));
  const categoryTotals=availableCategories("expense").map(cat=>[cat,month.filter(x=>x.category===cat).reduce((s,x)=>s+x.amount,0)]).sort((a,b)=>b[1]-a[1]);
  const kpis=[
    ["Total balance",t.totalBalance,"All-time income − expenses − goal savings"],
    ["Total income",t.totalIncome,"All recorded income"],
    ["Total expenses",t.totalExpenses,"All recorded expenses"],
    ["Monthly expenses",t.expense,"Current month"],
    ["Monthly budget",t.budget,"Combined category limits"],
  ];
  const kpiCards=kpis.map(([label,value,note])=>`<div class="card"><div class="kpi-label">${label}</div><div class="kpi">${money(value)}</div><p class="small muted">${note}</p></div>`).join("");
  const budgetRows=state.budgets.map(b=>{
    const spent=month.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0);
    const pct=b.amount?Math.round(spent/b.amount*100):0;
    return `<div class="category-row"><span><span aria-hidden="true">${categoryIcon(b.category)}</span> ${escapeHTML(b.category)}</span><div class="progress ${pct>=100?"danger":pct>=75?"warning":""}"><span style="width:${Math.min(pct,100)}%"></span></div><span>${pct}% · ${money(spent)}</span></div>`;
  }).join("")||`<div class="empty">Create category budgets to track progress.</div>`;
  const recentItems=[
    ...month.map(x=>({date:x.date,title:x.merchant,category:x.category,type:"Expense",amount:-x.amount})),
    ...state.incomes.filter(x=>isCurrentMonth(x.income_date)).map(x=>({date:x.income_date,title:x.source,category:"Income",type:"Income",amount:x.amount}))
  ].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const recent=recentItems.map(x=>`<tr><td>${escapeHTML(x.title)}</td><td>${escapeHTML(x.category)}</td><td>${escapeHTML(x.date)}</td><td><strong class="${x.amount<0?"amount-expense":"amount-income"}">${x.amount<0?"−":"+"}${money(Math.abs(x.amount))}</strong></td></tr>`).join("")||`<tr><td colspan="4" class="muted">No transactions this month.</td></tr>`;
  const chart=monthlyChart();
  const topCategory=categoryTotals.find(x=>x[1]>0);
  const insights=[];
  if(topCategory)insights.push(`Your highest spending category is ${topCategory[0]} at ${money(topCategory[1])}.`);
  if(t.budget&&t.expense/t.budget>=.75)insights.push(`You have used ${Math.round(t.expense/t.budget*100)}% of the monthly budget.`);
  if(!insights.length)insights.push("Add transactions to generate spending insights from your real data.");
  return `<div class="dashboard-welcome"><div><p class="eyebrow">${dateLabel}</p><h2>Welcome back, ${escapeHTML((state.profile?.full_name||state.user?.email||"Student").split(" ")[0])} 👋</h2><p class="muted small">Here’s your money overview for today.</p></div><div class="quick-actions"><button class="button" data-action="nav" data-view="add-income">＋ Add income</button><button class="button secondary" data-action="nav" data-view="add-expense">− Add expense</button></div></div>
    <div class="quick-links"><button class="button small secondary" data-action="nav" data-view="transactions">View all transactions</button><button class="button small secondary" data-action="nav" data-view="budgets">Set budget</button><button class="button small secondary" data-action="nav" data-view="exports">Download report</button><button class="button small secondary" data-action="nav" data-view="receipt">Scan receipt</button></div>
    <div class="grid-dashboard">${kpiCards}</div>
    <section class="card" style="margin-top:16px"><div class="card-head"><div><h2>Current month overview</h2><p class="small muted">${new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</p></div></div><div class="grid4"><div><div class="kpi-label">Income</div><strong>${money(t.income)}</strong></div><div><div class="kpi-label">Expenses</div><strong>${money(t.expense)}</strong></div><div><div class="kpi-label">Remaining after savings</div><strong>${money(t.remaining)}</strong></div><div><div class="kpi-label">Goal contributions</div><strong>${money(t.monthlySavings)}</strong></div></div></section>
    <div class="grid2" style="margin-top:16px"><section class="card"><div class="card-head"><div><h2>Financial health</h2><p class="small muted">Transparent personal score — not a credit score</p></div><span class="badge ${health.score>=70?"":"warning"}">${health.score}/100</span></div><div class="progress"><span style="width:${health.score}%"></span></div><p class="small muted" style="margin-top:10px">Based on budget discipline, savings consistency, tracked expenses and goal progress.</p></section>
    <section class="card"><div class="card-head"><div><h2>Smart insights</h2><p class="small muted">Generated from this account</p></div></div>${insights.map(x=>`<p class="small">• ${escapeHTML(x)}</p>`).join("")}<div style="margin-top:12px" class="search-row"><button class="button small" data-action="add-transaction">Add expense</button><button class="button small secondary" data-action="add-income">Add income</button><button class="button small secondary" data-action="nav" data-view="analytics">View reports</button></div></section></div>
    <div class="grid2" style="margin-top:16px">
      <section class="card"><div class="card-head"><div><h2>Budget progress</h2><p class="small muted">Monthly category limits</p></div><button class="button small secondary" data-action="nav" data-view="budgets">Manage</button></div>${budgetRows}</section>
      <section class="card"><div class="card-head"><div><h2>Category spending</h2><p class="small muted">Current month</p></div></div>${categoryTotals.filter(x=>x[1]>0).map(([cat,v])=>`<div class="category-row"><span><span aria-hidden="true">${categoryIcon(cat)}</span> ${escapeHTML(cat)}</span><div class="progress"><span style="width:${t.expense?Math.round(v/t.expense*100):0}%"></span></div><span>${money(v)}</span></div>`).join("")||`<div class="empty">No expenses recorded this month.</div>`}</section>
    </div>
    <div class="grid2" style="margin-top:16px">
      <section class="card"><div class="card-head"><div><h2>Recent transactions</h2><p class="small muted">Latest activity</p></div><button class="button small secondary" data-action="nav" data-view="transactions">View all</button></div><div class="table-wrap"><table><thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead><tbody>${recent}</tbody></table></div></section>
      <section class="card"><div class="card-head"><div><h2>Income vs expenses</h2><p class="small muted">Last six months</p></div></div>${chart}</section>
    </div>`;
}

function monthlyChart() {
  const months=[];
  const now=new Date();
  for(let i=5;i>=0;i--) {
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const income=state.incomes.filter(x=>String(x.income_date||"").startsWith(key)).reduce((s,x)=>s+x.amount,0);
    const expense=state.expenses.filter(x=>String(x.date||"").startsWith(key)).reduce((s,x)=>s+x.amount,0);
    months.push({label:d.toLocaleDateString("en-IN",{month:"short"}),income,expense});
  }
  const max=Math.max(1,...months.flatMap(x=>[x.income,x.expense]));
  return `<div class="chart-legend"><span><i class="legend-income"></i>Income</span><span><i class="legend-expense"></i>Expenses</span></div><div class="chart">${months.map(m=>`<div class="chart-group" aria-label="${escapeHTML(m.label)}: income ${money(m.income)}, expenses ${money(m.expense)}"><div class="chart-bar income" style="height:${Math.round(m.income/max*180)}px" title="${escapeHTML(m.label)} income ${money(m.income)}"></div><div class="chart-bar expense" style="height:${Math.round(m.expense/max*180)}px" title="${escapeHTML(m.label)} expenses ${money(m.expense)}"></div><span class="chart-label">${escapeHTML(m.label)}</span></div>`).join("")}</div>`;
}

function transactionsView() {
  const term=state.transactionFilter.toLowerCase();
  const all=[
    ...state.expenses.map(x=>({...x,type:"expense",title:x.merchant,date:x.date})),
    ...state.incomes.map(x=>({...x,type:"income",title:x.source,date:x.income_date,category:x.category||"Other",payment_method:x.payment_method||"—"}))
  ];
  let filtered=all.filter(x=>{
    const matchesTerm=!term||[x.title,x.category,x.description,x.payment_method].join(" ").toLowerCase().includes(term);
    const matchesType=!state.transactionType||x.type===state.transactionType;
    const matchesCategory=!state.transactionCategory||x.category===state.transactionCategory;
    const matchesMethod=!state.transactionMethod||x.payment_method===state.transactionMethod;
    const matchesFrom=!state.transactionFrom||x.date>=state.transactionFrom;
    const matchesTo=!state.transactionTo||x.date<=state.transactionTo;
    return matchesTerm&&matchesType&&matchesCategory&&matchesMethod&&matchesFrom&&matchesTo;
  });
  filtered=[...filtered].sort((a,b)=>state.transactionSort==="amount-desc"?b.amount-a.amount:state.transactionSort==="amount-asc"?a.amount-b.amount:state.transactionSort==="date-asc"?String(a.date).localeCompare(String(b.date)):String(b.date).localeCompare(String(a.date)));
  const rows=filtered.map(x=>`
    <tr><td>${escapeHTML(x.date)}</td><td>${escapeHTML(x.title)}</td><td><span class="badge ${x.type==="income"?"":"warning"}">${x.type==="income"?"Income":"Expense"}</span></td><td>${escapeHTML(x.category)}</td><td>${escapeHTML(x.payment_method)}</td><td><strong class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"−"}${money(x.amount)}</strong></td>
    <td><button class="button small secondary" data-action="view-transaction" data-id="${x.id}" data-type="${x.type}">Details</button><button class="button small secondary" data-action="edit-transaction" data-id="${x.id}" data-type="${x.type}">Edit</button><button class="button small danger" data-action="delete-transaction" data-id="${x.id}" data-type="${x.type}">Delete</button></td></tr>`).join("");
  return `<div class="card">
    <div class="card-head"><div><h2>All transactions</h2><p class="small muted">Income and expenses saved to your account</p></div><div class="search-row"><button class="button small secondary" data-action="add-income">Add income</button><button class="button small" data-action="add-transaction">Add expense</button></div></div>
    <div class="search-row"><input id="transactionSearch" placeholder="Search title, category or method" value="${escapeHTML(state.transactionFilter)}"><select id="transactionType"><option value="">Income & expenses</option><option value="expense" ${state.transactionType==="expense"?"selected":""}>Expenses</option><option value="income" ${state.transactionType==="income"?"selected":""}>Income</option></select><select id="transactionCategory"><option value="">All categories</option>${[...new Set([...availableCategories("expense"),...availableCategories("income")])].map(c=>`<option ${state.transactionCategory===c?"selected":""}>${escapeHTML(c)}</option>`).join("")}</select><select id="transactionMethod"><option value="">All payments</option>${["UPI","Card","Debit Card","Credit Card","Cash","Net banking","Net Banking","Wallet","Other"].map(v=>`<option ${state.transactionMethod===v?"selected":""}>${v}</option>`).join("")}</select><input id="transactionFrom" type="date" value="${escapeHTML(state.transactionFrom)}" aria-label="From date"><input id="transactionTo" type="date" value="${escapeHTML(state.transactionTo)}" aria-label="To date"><select id="transactionSort"><option value="date-desc" ${state.transactionSort==="date-desc"?"selected":""}>Newest</option><option value="date-asc" ${state.transactionSort==="date-asc"?"selected":""}>Oldest</option><option value="amount-desc" ${state.transactionSort==="amount-desc"?"selected":""}>Highest amount</option><option value="amount-asc" ${state.transactionSort==="amount-asc"?"selected":""}>Lowest amount</option></select><button class="button small secondary" data-action="export-csv">Export CSV</button></div>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Category</th><th>Payment</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${rows||`<tr><td colspan="7" class="muted">No transactions match your filters.</td></tr>`}</tbody></table></div>
  </div>`;
}

function openTransactionModal(transaction=null,type="expense") {
  const form=$("#transactionForm");
  type=transaction?.type||type;
  $("#transactionTitle").textContent=transaction?"Edit transaction":type==="income"?"Add income":"Add expense";
  form.dataset.id=transaction?.id||"";
  form.dataset.type=type;
  form.innerHTML=`
    <div class="field full" ${transaction?"hidden":""}><label>Type</label><select id="transactionEntryType" name="type"><option value="expense">Expense</option><option value="income">Income</option></select></div>
    <div class="field full" data-income-only hidden><label>Income title</label><input name="source" value="${type==="income"?escapeHTML(transaction?.source||transaction?.merchant||""):""}" placeholder="Allowance, scholarship, stipend"></div>
    <div class="field"><label>Amount (${escapeHTML(currencySymbol())})</label><input name="amount" type="number" min="0.01" step="0.01" required value="${transaction?.amount||""}"></div>
    <div class="field"><label>Date</label><input name="date" type="date" required value="${transaction?.date||todayISO()}"></div>
    <div class="field" data-expense-only><label>Transaction title / merchant</label><input name="merchant" required value="${escapeHTML(transaction?.merchant||"")}"></div>
    <div class="field"><label data-category-label>Category</label><select name="category">${availableCategories(type).map(c=>`<option ${transaction?.category===c?"selected":""}>${escapeHTML(c)}</option>`).join("")}</select></div>
    <div class="field"><label>Payment method</label><select name="payment_method">${["UPI","Card","Debit Card","Credit Card","Cash","Net banking","Wallet","Other"].map(v=>`<option ${transaction?.payment_method===v?"selected":""}>${v}</option>`).join("")}</select></div>
    <div class="field full"><label>Description</label><textarea name="description">${escapeHTML(transaction?.description||"")}</textarea></div>
    <div class="full"><button class="button" type="submit">${transaction?"Save changes":type==="income"?"Save income":"Save expense"}</button></div>`;
  $("#transactionModal").hidden=false;
  form.elements.type.value=type;
  toggleTransactionType(type);
}

function showTransactionDetails(transaction,type) {
  const isIncome=type==="income";
  const title=isIncome?transaction.source:transaction.merchant;
  const date=isIncome?transaction.income_date:transaction.date;
  $("#detailsTitle").textContent=title||"Transaction details";
  $("#transactionDetails").innerHTML=`<dl class="transaction-details">
    <div><dt>Type</dt><dd>${isIncome?"Income":"Expense"}</dd></div>
    <div><dt>Amount</dt><dd>${isIncome?"+":"−"}${money(transaction.amount)}</dd></div>
    <div><dt>Date</dt><dd>${escapeHTML(date||"—")}</dd></div>
    <div><dt>${isIncome?"Source":"Category"}</dt><dd>${escapeHTML(isIncome?transaction.source:transaction.category||"Other")}</dd></div>
    <div><dt>Payment method</dt><dd>${escapeHTML(transaction.payment_method||"—")}</dd></div>
    <div class="full"><dt>Description</dt><dd>${escapeHTML(transaction.description||"No description provided.")}</dd></div>
  </dl>`;
  $("#transactionDetailsModal").hidden=false;
}

function toggleTransactionType(type) {
  const form=$("#transactionForm");
  form.querySelectorAll("[data-expense-only]").forEach(x=>x.hidden=type==="income");
  form.querySelectorAll("[data-income-only]").forEach(x=>x.hidden=type==="expense");
  const category=form.elements.category;
  const options=availableCategories(type);
  const previous=category.value;
  category.innerHTML=options.map(value=>`<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("");
  category.value=options.includes(previous)?previous:options[0];
  category.required=true;
  const merchant=form.elements.merchant;
  const source=form.elements.source;
  if(merchant)merchant.required=type==="expense";
  if(source)source.required=type==="income";
  const label=form.querySelector("[data-category-label]");
  if(label)label.textContent=type==="income"?"Income category":"Expense category";
  const isEditing=Boolean(form.dataset.id);
  $("#transactionTitle").textContent=isEditing?"Edit transaction":type==="income"?"Add income":"Add expense";
  const submit=form.querySelector('button[type="submit"]');
  if(submit)submit.textContent=isEditing?"Save changes":type==="income"?"Save income":"Save expense";
}

async function saveTransaction(form) {
  if(!state.user||form.dataset.saving==="true") return;
  const data=new FormData(form);
  const type=form.elements.type.value;
  const amount=Number(data.get("amount"));
  if(!(amount>0)||!Number.isFinite(amount)) {toast("Enter a valid amount",true);return;}
  const date=String(data.get("date")||"");
  if(!isValidISODate(date)) {toast("Choose a valid transaction date",true);return;}
  const id=form.dataset.id;
  const source=String(data.get("source")||"").trim();
  const merchant=String(data.get("merchant")||"").trim();
  if(type==="income"&&!source) return toast("Enter an income source",true);
  if(type==="expense"&&(!merchant||!availableCategories("expense").includes(data.get("category")))) return toast("Enter a title and choose a valid expense category",true);
  if(type==="income"&&!availableCategories("income").includes(data.get("category"))) return toast("Choose a valid income category",true);
  const submit=form.querySelector('button[type="submit"]');
  form.dataset.saving="true";
  if(submit){submit.disabled=true;submit.textContent="Saving…";}
  try {
    let result;
    if(type==="income") {
      const payload={user_id:state.user.id,amount,source,category:data.get("category"),description:String(data.get("description")||"").trim(),payment_method:data.get("payment_method"),income_date:date};
      result=id?await db.from("incomes").update(payload).eq("id",id).eq("user_id",state.user.id):await db.from("incomes").insert(payload);
    } else {
      const payload={user_id:state.user.id,amount,merchant,category:data.get("category"),payment_method:data.get("payment_method"),description:data.get("description"),transaction_date:date,day:Number(date.slice(8,10))};
      result=id?await db.from("expenses").update(payload).eq("id",id).eq("user_id",state.user.id):await db.from("expenses").insert(payload);
    }
    if(result.error){toast(result.error.message,true);return;}
    if(form.id==="transactionForm")$("#transactionModal").hidden=true;
    else state.view="transactions";
    await loadData();
    toast("Transaction saved");
  } catch(error) {
    toast(error.message||"Transaction could not be saved",true);
  } finally {
    form.dataset.saving="false";
    if(submit){submit.disabled=false;submit.textContent=id?"Save changes":type==="income"?"Save income":"Save expense";}
  }
}

function incomeView() {
  const monthIncome=state.incomes.filter(x=>isCurrentMonth(x.income_date));
  const total=monthIncome.reduce((sum,x)=>sum+x.amount,0);
  const rows=state.incomes.map(x=>`<tr><td>${escapeHTML(x.income_date)}</td><td>${escapeHTML(x.source)}</td><td>${escapeHTML(x.category||"Other")}</td><td><strong>${money(x.amount)}</strong></td><td><button class="button small secondary" data-action="edit-income" data-id="${x.id}">Edit</button><button class="button small danger" data-action="delete-income" data-id="${x.id}">Delete</button></td></tr>`).join("");
  return `<div class="grid3"><div class="card"><div class="kpi-label">Income this month</div><div class="kpi">${money(total)}</div></div><div class="card"><div class="kpi-label">Income sources</div><div class="kpi">${new Set(monthIncome.map(x=>x.source)).size}</div></div><div class="card"><div class="kpi-label">Entries this month</div><div class="kpi">${monthIncome.length}</div></div></div>
  <div class="card" style="margin-top:16px"><div class="card-head"><div><h2>Income history</h2><p class="small muted">Allowance, scholarship, stipend and other sources</p></div><button class="button" data-action="nav" data-view="add-income">Add income</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="muted">No income recorded.</td></tr>`}</tbody></table></div></div>`;
}

function categoriesView() {
  const expenseCategories=availableCategories("expense");
  const incomeCategories=availableCategories("income");
  const rows=(type,categories)=>categories.map(category=>{
    const items=type==="income"?state.incomes.filter(x=>(x.category||"Other")===category):state.expenses.filter(x=>x.category===category);
    const total=items.reduce((sum,item)=>sum+item.amount,0);
    const custom=state.userCategories.find(item=>item.type===type&&item.name===category);
    return `<section class="card category-card"><div class="card-head"><div><span class="category-emoji" aria-hidden="true">${escapeHTML(categoryIcon(category))}</span><h3>${escapeHTML(category)}</h3><span class="badge">${type==="income"?"Income":"Expense"}${custom?" · Custom":" · Default"}</span></div><span class="badge">${items.length} ${items.length===1?"entry":"entries"}</span></div><div class="kpi">${money(total)}</div><p class="small muted">Recorded ${type==="income"?"income":"spending"}</p><div class="search-row">${type==="expense"?`<button class="button small secondary" data-action="filter-category" data-category="${escapeHTML(category)}">View transactions</button>`:""}${custom?`<button class="button small secondary" data-action="edit-category" data-id="${custom.id}">Edit</button><button class="button small danger" data-action="delete-category" data-id="${custom.id}">Delete</button>`:""}</div></section>`;
  }).join("");
  return `<section class="card"><div class="card-head"><div><h2>Manage categories</h2><p class="small muted">Default and custom expense and income categories.</p></div><button class="button" data-action="add-category">Add category</button></div>${state.categoriesError?`<p class="notice warning">Custom categories need the latest Kharcha database migration. Defaults are still available. (${escapeHTML(state.categoriesError)})</p>`:""}</section>
    <h2 class="section-title">Expense categories</h2><div class="grid3">${rows("expense",expenseCategories)}</div><h2 class="section-title">Income categories</h2><div class="grid3">${rows("income",incomeCategories)}</div>`;
}

function openCategoryModal(category=null) {
  const form=$("#categoryForm");
  $("#categoryTitle").textContent=category?"Edit category":"Add category";
  form.dataset.id=category?.id||"";
  form.innerHTML=`<div class="field full"><label for="categoryName">Category name</label><input id="categoryName" name="name" maxlength="40" required value="${escapeHTML(category?.name||"")}"></div>
    <div class="field"><label for="categoryType">Type</label><select id="categoryType" name="type" ${category?"disabled":""}><option value="expense" ${category?.type==="expense"?"selected":""}>Expense</option><option value="income" ${category?.type==="income"?"selected":""}>Income</option></select></div>
    <div class="field"><label for="categoryIcon">Icon</label><input id="categoryIcon" name="icon" maxlength="8" value="${escapeHTML(category?.icon||"📦")}" required></div>
    <div class="form-actions full"><button class="button" type="submit">${category?"Save changes":"Add category"}</button></div>`;
  $("#categoryModal").hidden=false;
}

async function saveCategory(form) {
  const data=new FormData(form);
  const name=String(data.get("name")||"").trim();
  const icon=String(data.get("icon")||"").trim();
  const id=form.dataset.id;
  const current=state.userCategories.find(category=>category.id===id);
  const type=current?.type||String(data.get("type")||"");
  if(!name||name.length>40||!icon) return toast("Enter a category name and icon",true);
  if(!id&&!["expense","income"].includes(type)) return toast("Choose a valid category type",true);
  const occupied=(type==="income"?INCOME_CATEGORIES:CATEGORIES).some(category=>category.toLowerCase()===name.toLowerCase())||
    state.userCategories.some(category=>category.id!==id&&category.type===type&&category.name.toLowerCase()===name.toLowerCase());
  if(occupied) return toast("A category with that name already exists",true);
  if(current&&current.name!==name){
    const isUsed=current.type==="expense"
      ?state.expenses.some(item=>item.category===current.name)||state.budgets.some(item=>item.category===current.name)
      :state.incomes.some(item=>(item.category||"Other")===current.name);
    if(isUsed) return toast("This category is used by saved records or budgets. Keep its name to preserve their category history.",true);
  }
  const payload={user_id:state.user.id,name,type:current?.type||type,icon};
  const result=id
    ?await db.from("user_categories").update({name,icon}).eq("id",id).eq("user_id",state.user.id)
    :await db.from("user_categories").insert(payload);
  if(result.error) return toast(result.error.message,true);
  $("#categoryModal").hidden=true;
  await loadData();
  state.view="categories";
  render();
  toast(id?"Category updated":"Category added");
}

function profileView() {
  const p=state.profile||{};
  return `<div class="grid2"><section class="card"><div class="card-head"><div><h2>Profile</h2><p class="small muted">Personal Kharcha settings</p></div></div><form id="profileForm" class="form-grid">
    <div class="field"><label>Full name</label><input name="full_name" required ${state.profileEditing?"":"disabled"} value="${escapeHTML(p.full_name||state.user.user_metadata?.full_name||"")}"></div>
    <div class="field"><label>Email</label><input value="${escapeHTML(state.user.email||"")}" disabled></div>
    <div class="field"><label>College</label><input name="college_name" ${state.profileEditing?"":"disabled"} value="${escapeHTML(p.college_name||"")}"></div>
    <div class="field"><label>Monthly allowance</label><input name="monthly_allowance" type="number" min="0" step="0.01" ${state.profileEditing?"":"disabled"} value="${p.monthly_allowance||""}"></div>
    <div class="field"><label>Preferred currency</label><select name="currency" ${state.profileEditing?"":"disabled"}>${supportedCurrencies.map(currency=>`<option value="${currency}" ${p.currency===currency||(!p.currency&&currency==="INR")?"selected":""}>${currency}</option>`).join("")}</select></div>
    <div class="field"><label>Language</label><select name="language" ${state.profileEditing?"":"disabled"}><option value="en" ${state.lang==="en"?"selected":""}>English</option><option value="hi" ${state.lang==="hi"?"selected":""}>हिन्दी</option></select></div>
    <div class="form-actions full">${state.profileEditing?`<button class="button" type="submit">Save changes</button><button class="button secondary" type="button" data-action="cancel-profile">Cancel</button>`:`<button class="button" type="button" data-action="edit-profile">Edit profile</button>`}</div>
  </form></section>
  <section class="card"><h2>Account security</h2><p class="small muted" style="margin:8px 0 14px">Send a secure password reset email to ${escapeHTML(state.user.email||"your account")}.</p><button class="button secondary" data-action="reset-password">Reset password</button><button class="button danger" data-action="logout" style="margin-left:8px">Log out</button></section></div>`;
}

function budgetsView() {
  const monthExpenses=state.expenses.filter(x=>isCurrentMonth(x.date));
  const totalBudget=state.budgets.reduce((sum,budget)=>sum+budget.amount,0);
  const totalSpent=monthExpenses.reduce((sum,expense)=>sum+expense.amount,0);
  const remaining=Math.max(0,totalBudget-totalSpent);
  const cards=state.budgets.map(b=>{
    const spent=monthExpenses.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0);
    const pct=b.amount?Math.round(spent/b.amount*100):0;
    const level=pct>=100?"danger":pct>=75?"warning":"";
    return `<div class="card"><div class="card-head"><div><h3>${escapeHTML(b.category)}</h3><p class="small muted">${pct}% used</p></div><span class="badge ${pct>=100?"danger":pct>=90?"warning":""}">${pct>=100?"Limit reached":pct>=90?"Near limit":pct>=75?"Watch spending":"On track"}</span></div>
      <div class="progress ${level}" style="margin:14px 0 10px"><span style="width:${Math.min(pct,100)}%"></span></div>
      <div class="row"><strong>${money(spent)}</strong><span class="muted small">of ${money(b.amount)}</span></div>
      <div style="margin-top:14px"><button class="button small secondary" data-action="edit-budget" data-id="${b.id}" data-category="${escapeHTML(b.category)}" data-amount="${b.amount}">Edit</button><button class="button small danger" data-action="delete-budget" data-id="${b.id}">Delete</button></div></div>`;
  }).join("");
  return `<div class="grid3 budget-summary"><section class="card"><div class="kpi-label">Total budget</div><div class="kpi">${money(totalBudget)}</div></section><section class="card"><div class="kpi-label">Amount spent</div><div class="kpi">${money(totalSpent)}</div></section><section class="card"><div class="kpi-label">Remaining budget</div><div class="kpi">${money(remaining)}</div></section></div>
    <div class="card" style="margin-top:16px"><div class="card-head"><div><h2>Monthly budget</h2><p class="small muted">Calculated from real expenses for ${new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</p></div><button class="button" data-action="add-budget">Set monthly budget</button></div><div class="grid3">${cards||`<div class="empty full">No budgets yet. Add category limits to receive in-app alerts.</div>`}</div></div>`;
}

async function saveBudget(category,amount,id=null) {
  const value=Number(amount);
  if(!state.user) return;
  if(!availableCategories("expense").includes(category))return toast("Choose a valid budget category",true);
  if(!(value>0)||!Number.isFinite(value))return toast("Enter a budget amount greater than zero",true);
  const payload={user_id:state.user.id,month:monthISO(),category,amount:value};
  const result=id?await db.from("budgets").update(payload).eq("id",id).eq("user_id",state.user.id):await db.from("budgets").upsert(payload,{onConflict:"user_id,month,category"});
  if(result.error) return toast(result.error.message,true);
  await loadData();toast("Budget saved");
}

function goalsView() {
  const cards=state.goals.map(g=>{
    const contributed=state.contributions.filter(c=>c.goal_id===g.id).reduce((s,c)=>s+c.amount,0);
    const pct=g.target_amount?Math.round(contributed/g.target_amount*100):0;
    const remaining=Math.max(0,g.target_amount-contributed);
    return `<div class="card"><div class="card-head"><div><h3>${escapeHTML(g.name)}</h3><p class="small muted">Target ${g.target_date||"No date"}</p></div><span class="badge ${g.status==="completed"?"":"warning"}">${pct>=100?"Completed":g.status}</span></div>
      <div class="kpi">${money(contributed)} <span class="small muted">of ${money(g.target_amount)}</span></div>
      <div class="progress ${pct>=100?"danger":""}" style="margin:12px 0"><span style="width:${Math.min(pct,100)}%"></span></div>
      <p class="small muted">${remaining?money(remaining)+" remaining": "Target reached"}</p>
      <div style="margin-top:14px"><button class="button small" data-action="add-contribution" data-id="${g.id}">Add contribution</button><button class="button small danger" data-action="delete-goal" data-id="${g.id}">Delete</button></div></div>`;
  }).join("");
  return `<div class="card"><div class="card-head"><div><h2>Savings goals</h2><p class="small muted">Track progress and contributions</p></div><button class="button" data-action="add-goal">Create goal</button></div><div class="grid3">${cards||`<div class="empty">No savings goals yet.</div>`}</div></div>`;
}

async function saveGoal(form) {
  const data=new FormData(form);
  const name=String(data.get("name")||"").trim(),target=Number(data.get("target"));
  if(!name||!(target>0)||!Number.isFinite(target))return toast("Enter a goal name and a valid target amount",true);
  const payload={user_id:state.user.id,name,target_amount:target,target_date:data.get("date")||null,status:"active"};
  const {error}=await db.from("savings_goals").insert(payload);
  if(error) return toast(error.message,true);
  await loadData();toast("Savings goal created");
}

async function addContribution(goalId,amount,note="") {
  const value=Number(amount);
  if(!(value>0)||!Number.isFinite(value))return toast("Enter a contribution greater than zero",true);
  const payload={user_id:state.user.id,goal_id:goalId,amount:value,contribution_date:todayISO(),note};
  const {error}=await db.from("savings_contributions").insert(payload);
  if(error) return toast(error.message,true);
  await loadData();toast("Contribution added");
}

function receiptView() {
  return `<div class="grid2"><section class="card"><div class="card-head"><div><h2>Upload or capture receipt</h2><p class="small muted">OCR runs locally in your browser</p></div></div>
    <label class="receipt-drop"><input id="receiptFile" type="file" accept="image/*" capture="environment" hidden><strong>📷 Choose or capture a receipt</strong><br><span class="small muted">PNG or JPG · processing stays in this browser</span></label>
    <button class="button secondary" type="button" data-action="extract-receipt" ${state.receiptFile?"":"disabled"} style="margin-top:12px">Extract text</button>
    <div id="receiptStatus" class="muted small" style="margin-top:12px"></div></section>
    <section class="card" id="receiptReview"><div class="empty">Review extracted receipt details here before saving.</div></section></div>`;
}

async function scanReceipt(file) {
  if(!file) return;
  state.receiptFile=file;
  const extractButton=$('[data-action="extract-receipt"]');
  if(extractButton)extractButton.disabled=false;
  if(!window.Tesseract) {
    $("#receiptStatus").textContent="Receipt scanning is unavailable because the OCR library did not load.";
    return toast("Tesseract OCR could not load. Check the network connection and try again.",true);
  }
  const status=$("#receiptStatus");
  status.textContent="Reading receipt…";
  try {
    if(state.receiptPreview)URL.revokeObjectURL(state.receiptPreview);
    const preview=URL.createObjectURL(file);
    state.receiptPreview=preview;
    const {data}=await window.Tesseract.recognize(file,"eng",{logger:m=>{if(m.status==="recognizing text")status.textContent=`Reading receipt… ${Math.round(m.progress*100)}%`;}});
    const text=data.text||"";
    const amountMatch=text.match(/(?:total|amount|grand total|₹|rs\.?|inr)[^0-9]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
    const dateMatch=text.match(/\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/);
    const lines=text.split("\n").map(x=>x.trim()).filter(Boolean);
    const merchant=lines.find(x=>/^[A-Za-z0-9][A-Za-z0-9 &.-]{2,40}$/.test(x) && !/\d/.test(x))||"";
    const amount=amountMatch?Number(amountMatch[1].replace(/,/g,"")):0;
    const rawDate=dateMatch?.[0]||todayISO();
    const normalizedDate=normalizeOCRDate(rawDate);
    $("#receiptReview").innerHTML=`<div class="card-head"><div><h3>Review extracted details</h3><p class="small muted">Nothing is saved until you confirm</p></div></div>
      <img class="receipt-preview" src="${preview}" alt="Receipt preview">
      <div class="form-grid" style="margin-top:12px"><div class="field"><label for="ocrMerchant">Merchant</label><input id="ocrMerchant" maxlength="120" value="${escapeHTML(merchant)}" required></div><div class="field"><label for="ocrAmount">Amount (${escapeHTML(currencySymbol())})</label><input id="ocrAmount" type="number" min="0.01" step="0.01" value="${amount}" required></div><div class="field"><label for="ocrCategory">Category</label><select id="ocrCategory">${availableCategories("expense").map(category=>`<option value="${escapeHTML(category)}">${escapeHTML(categoryIcon(category))} ${escapeHTML(category)}</option>`).join("")}</select></div><div class="field"><label for="ocrDate">Date</label><input id="ocrDate" type="date" value="${normalizedDate}" required></div><div class="field full"><label for="ocrPaymentMethod">Payment method</label><select id="ocrPaymentMethod">${["UPI","Card","Debit Card","Credit Card","Cash","Net banking","Wallet","Other"].map(method=>`<option>${method}</option>`).join("")}</select></div><div class="field full"><label for="ocrText">Extracted text</label><textarea id="ocrText">${escapeHTML(text)}</textarea></div></div>
      <button class="button" id="saveReceipt" data-action="save-receipt" style="margin-top:12px">Add as expense</button>`;
    status.textContent="OCR complete. Review the details.";
  } catch(error) {
    status.textContent="OCR failed.";
    toast(error.message||"Could not read receipt",true);
  }
}

function normalizeOCRDate(value) {
  const iso=value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if(iso){
    const date=`${iso[1]}-${iso[2].padStart(2,"0")}-${iso[3].padStart(2,"0")}`;
    return isValidISODate(date)?date:todayISO();
  }
  const parts=value.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if(!parts) return todayISO();
  const year=parts[3].length===2?"20"+parts[3]:parts[3];
  const date=`${year}-${parts[2].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
  return isValidISODate(date)?date:todayISO();
}

async function saveReceiptExpense() {
  const amount=Number($("#ocrAmount")?.value||0);
  const merchant=$("#ocrMerchant")?.value.trim()||"Receipt expense";
  const date=$("#ocrDate")?.value||"";
  const category=$("#ocrCategory")?.value||"Other";
  const paymentMethod=$("#ocrPaymentMethod")?.value||"Other";
  if(!(amount>0)||!Number.isFinite(amount)) return toast("Enter a valid receipt amount",true);
  if(!isValidISODate(date)||!merchant) return toast("Enter a merchant and a valid receipt date",true);
  const payload={user_id:state.user.id,amount,merchant,category,payment_method:paymentMethod,description:"Scanned receipt",transaction_date:date};
  const {data,error}=await db.from("expenses").insert(payload).select().single();
  if(error) return toast(error.message,true);
  let storagePath="browser-ocr/"+data.id;
  let receiptSaved=true;
  if(state.receiptFile){
    const safeName=state.receiptFile.name.replace(/[\\/:*?"<>|]/g,"_");
    storagePath=`${state.user.id}/${Date.now()}-${safeName}`;
    const upload=await db.storage.from("receipts").upload(storagePath,state.receiptFile,{upsert:false,contentType:state.receiptFile.type||"image/jpeg"});
    if(upload.error){toast("Expense saved, but receipt upload failed: "+upload.error.message,true);receiptSaved=false;}
  }
  if(receiptSaved){
    const receipt=await db.from("receipts").insert({user_id:state.user.id,storage_path:storagePath,merchant,amount,receipt_date:date,status:"saved",expense_id:data.id,raw_ocr:$("#ocrText")?.value||""});
    if(receipt.error){toast("Expense saved, but receipt details could not be saved: "+receipt.error.message,true);receiptSaved=false;}
  }
  await loadData();
  if(receiptSaved)toast("Receipt expense saved");
  if(state.receiptPreview){URL.revokeObjectURL(state.receiptPreview);state.receiptPreview="";}
  state.receiptFile=null;
  state.view="transactions";render();
}

function assistantView() {
  return `<div class="card" style="max-width:850px;margin:auto"><div class="card-head"><div><h2>AI financial assistant</h2><p class="small muted">Secure backend analysis of your records</p></div></div>
    <div class="chat-log" id="chatLog">${state.chat.map(m=>`<div class="chat-message ${m.role==="user"?"user":""}">${escapeHTML(m.text)}</div>`).join("")}</div>
    <div class="chat-composer"><input id="chatInput" placeholder="Ask about your spending in English or Hindi"><button class="button" id="chatSend" data-action="send-chat">Send</button></div>
    <p class="small muted" style="margin-top:10px">Requires the Supabase Edge Function and OPENAI_API_KEY server secret.</p></div>`;
}

async function askAssistant(question) {
  state.chat.push({role:"user",text:question});render();
  const thinking={role:"assistant",text:"Analyzing your records…"};state.chat.push(thinking);
  render();
  const {data,error}=await db.functions.invoke("ai-financial-assistant",{body:{question}});
  state.chat.pop();
  if(error || data?.error) state.chat.push({role:"assistant",text:data?.error==="OPENAI_API_KEY is not configured"?"The AI backend is not configured yet. An administrator must set OPENAI_API_KEY in Supabase secrets.":error?.message||"The AI assistant is currently unavailable."});
  else state.chat.push({role:"assistant",text:data.answer||"No answer was generated."});
  render();
}

function groupsView() {
  const cards=state.groups.map(g=>{
    const members=g.group_members||[];
    const expenses=g.group_expenses||[];
    const total=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
    return `<div class="card"><div class="card-head"><div><h3>${escapeHTML(g.name)}</h3><p class="small muted">${members.length} members · ${money(total)} shared</p></div><button class="button small secondary" data-action="open-group" data-id="${g.id}">Open</button></div></div>`;
  }).join("");
  return `<div class="grid2"><section class="card"><div class="card-head"><div><h2>Expense groups</h2><p class="small muted">Persisted room and friend groups</p></div><button class="button" data-action="create-group">Create group</button></div>${cards||`<div class="empty">Create a group and add members.</div>`}</section>
  <section class="card"><h2>How it works</h2><p class="muted small" style="margin-top:8px">Create a group, add members, enter shared expenses, and record settlements. Supabase RLS keeps private groups visible only to their members.</p></section></div>`;
}

async function createGroup(name) {
  const {data,error}=await db.from("groups").insert({name,created_by:state.user.id}).select().single();
  if(error) return toast(error.message,true);
  const member=await db.from("group_members").insert({group_id:data.id,display_name:state.profile?.full_name||state.user.email,user_id:state.user.id});
  await loadData();
  if(member.error)return toast(`Group created, but adding you as a member failed: ${member.error.message}`,true);
  toast("Group created");
}

async function addGroupMember(groupId,name,email="") {
  const payload={group_id:groupId,display_name:name};
  const {error}=await db.from("group_members").insert(payload);
  if(error) return toast(error.message,true);
  await loadData();toast("Member added");
}

async function addGroupExpense(groupId,memberId,description,amount,splitIds) {
  const totalCents=Math.round(Number(amount)*100);
  if(!(totalCents>0)||!Number.isFinite(totalCents)||!splitIds.length)return toast("Enter a valid amount and select at least one group member",true);
  const {data,error}=await db.from("group_expenses").insert({group_id:groupId,paid_by:memberId,description,amount:totalCents/100,created_by:state.user.id,split_type:splitIds.length===1?"custom":"equal"}).select().single();
  if(error) return toast(error.message,true);
  const baseCents=Math.floor(totalCents/splitIds.length);
  const remainder=totalCents-baseCents*splitIds.length;
  const splits=splitIds.map((id,index)=>({expense_id:data.id,member_id:id,amount:(baseCents+(index<remainder?1:0))/100}));
  const splitResult=await db.from("group_splits").insert(splits);
  if(splitResult.error) return toast(splitResult.error.message,true);
  await loadData();toast("Shared expense added");
}

function recurringView() {
  const rows=state.recurring.map(r=>`<tr><td>${escapeHTML(r.name)}</td><td>${escapeHTML(r.category)}</td><td>${escapeHTML(r.recurrence)}</td><td>${escapeHTML(r.next_due_date)}</td><td><strong>${money(r.amount)}</strong></td><td><button class="button small danger" data-action="delete-recurring" data-id="${r.id}">Delete</button></td></tr>`).join("");
  return `<div class="card"><div class="card-head"><div><h2>Recurring expenses</h2><p class="small muted">Rent, passes, utilities and other repeated payments</p></div><button class="button" data-action="add-recurring">Add recurring expense</button></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Frequency</th><th>Next due</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="muted">No recurring expenses.</td></tr>`}</tbody></table></div></div>`;
}

function subscriptionsView() {
  const monthly=state.subscriptions.filter(s=>s.active&&s.billing_frequency==="monthly").reduce((sum,s)=>sum+Number(s.amount),0);
  const yearly=state.subscriptions.filter(s=>s.active&&s.billing_frequency==="yearly").reduce((sum,s)=>sum+Number(s.amount),0);
  const rows=state.subscriptions.map(s=>`<tr><td>${escapeHTML(s.name)}</td><td>${escapeHTML(s.billing_frequency)}</td><td>${escapeHTML(s.next_payment_date)}</td><td><strong>${money(s.amount)}</strong></td><td><span class="badge ${s.active?"":"danger"}">${s.active?"Active":"Paused"}</span></td><td><button class="button small danger" data-action="delete-subscription" data-id="${s.id}">Delete</button></td></tr>`).join("");
  return `<div class="grid2"><div class="card"><div class="kpi-label">Monthly cost</div><div class="kpi">${money(monthly)}</div></div><div class="card"><div class="kpi-label">Yearly cost of yearly plans</div><div class="kpi">${money(yearly)}</div></div></div><div class="card" style="margin-top:16px"><div class="card-head"><div><h2>Subscriptions</h2><p class="small muted">Streaming, software and learning services</p></div><button class="button" data-action="add-subscription">Add subscription</button></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Billing</th><th>Next payment</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="muted">No subscriptions.</td></tr>`}</tbody></table></div></div>`;
}

function calendarView() {
  const monthDate=new Date(`${state.calendarMonth}T12:00:00`);
  const year=monthDate.getFullYear(),month=monthDate.getMonth();
  const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;
  const items=[
    ...state.expenses.map(x=>({date:x.date,title:x.merchant,type:`Expense · ${x.category}`,amount:-x.amount})),
    ...state.incomes.map(x=>({date:x.income_date,title:x.source,type:"Income",amount:x.amount})),
    ...state.recurring.map(x=>({date:x.next_due_date,title:x.name,type:"Recurring",amount:-Number(x.amount)})),
    ...state.subscriptions.map(x=>({date:x.next_payment_date,title:x.name,type:"Subscription",amount:-Number(x.amount)})),
    ...state.reminders.map(x=>({date:x.reminder_date,title:x.title,type:"Reminder",amount:null}))
  ].filter(x=>String(x.date||"").startsWith(monthKey));
  const byDate=new Map();
  items.forEach(item=>byDate.set(item.date,[...(byDate.get(item.date)||[]),item]));
  const firstDay=new Date(year,month,1).getDay();
  const dayCount=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:firstDay},()=>`<div class="calendar-day-spacer" aria-hidden="true"></div>`);
  for(let day=1;day<=dayCount;day++){
    const date=`${monthKey}-${String(day).padStart(2,"0")}`;
    const dayItems=byDate.get(date)||[];
    cells.push(`<button class="calendar-day ${date===state.calendarDate?"selected":""} ${date===todayISO()?"today":""}" data-action="select-calendar-date" data-date="${date}" aria-label="${date}, ${dayItems.length} entries"><span class="calendar-date">${day}</span>${dayItems.length?`<span class="calendar-count">${dayItems.length} ${dayItems.length===1?"entry":"entries"}</span>`:""}</button>`);
  }
  const selected=(byDate.get(state.calendarDate)||[]).sort((a,b)=>a.type.localeCompare(b.type));
  return `<div class="card"><div class="card-head"><div><h2>Financial calendar</h2><p class="small muted">Your income, expenses and scheduled payments by date</p></div><button class="button" data-action="add-reminder">Add reminder</button></div>
    <div class="calendar-heading"><button class="icon-button" data-action="calendar-month" data-offset="-1" aria-label="Previous month">‹</button><h3>${monthDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</h3><button class="icon-button" data-action="calendar-month" data-offset="1" aria-label="Next month">›</button></div>
    <div class="calendar-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<span>${d}</span>`).join("")}</div><div class="calendar-grid">${cells.join("")}</div>
    <section class="calendar-details"><h3>Entries for ${escapeHTML(state.calendarDate)}</h3>${selected.length?`<div class="table-wrap"><table><thead><tr><th>Entry</th><th>Type</th><th>Amount</th></tr></thead><tbody>${selected.map(x=>`<tr><td>${escapeHTML(x.title)}</td><td>${escapeHTML(x.type)}</td><td>${x.amount===null?"—":`<strong class="${x.amount<0?"amount-expense":"amount-income"}">${x.amount<0?"−":"+"}${money(Math.abs(x.amount))}</strong>`}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No transactions or scheduled items on this date.</div>`}</section></div>`;
}

function challengesView() {
  const cards=state.challenges.map(c=>{
    const pct=c.target_amount?Math.min(100,Math.round(Number(c.progress)/Number(c.target_amount)*100)):0;
    return `<div class="card"><div class="card-head"><div><h3>${escapeHTML(c.title)}</h3><p class="small muted">${escapeHTML(c.start_date)} – ${escapeHTML(c.end_date)}</p></div><span class="badge ${c.completed?"":"warning"}">${c.completed?"Completed":"Active"}</span></div><div class="progress" style="margin:12px 0"><span style="width:${pct}%"></span></div><p class="small muted">${money(c.progress)} of ${money(c.target_amount||0)}</p></div>`;
  }).join("");
  return `<div class="card"><div class="card-head"><div><h2>Savings challenges</h2><p class="small muted">Progress is saved only from recorded contributions</p></div><button class="button" data-action="add-challenge">Create challenge</button></div><div class="grid3">${cards||`<div class="empty">No challenges yet.</div>`}</div></div>`;
}

function learningView() {
  const lessons=[
    ["budgeting","Budgeting basics","Separate needs, wants and goals before spending."],
    ["emergency","Emergency funds","Build a small reserve for unexpected costs."],
    ["upi","Understanding UPI","Verify the receiver and transaction details before confirming."],
    ["shopping","Smart shopping","Compare essentials and delay unnecessary purchases."]
  ];
  return `<div class="grid2">${lessons.map(([key,title,description])=>{
    const progress=state.learning.find(l=>l.lesson_key===key);
    return `<section class="card"><div class="card-head"><div><h3>${title}</h3><p class="small muted">${escapeHTML(description)}</p></div><span class="badge ${progress?.completed?"":"warning"}">${progress?.completed?"Completed":"Not started"}</span></div><button class="button small secondary" data-action="complete-lesson" data-key="${key}">${progress?.completed?"Review lesson":"Mark complete"}</button></section>`;
  }).join("")}</div>`;
}

function achievementsView() {
  const achievements=[
    ["first-expense","First Expense Added",state.expenses.length>0],
    ["first-budget","First Budget Created",state.budgets.length>0],
    ["tracking-ten","10 Transactions Tracked",state.expenses.length>=10],
    ["first-savings","First Savings Goal",state.goals.length>0],
    ["under-budget","Under Budget",totals().budget>0&&totals().expense<=totals().budget]
  ];
  return `<div class="grid3">${achievements.map(([key,title,earned])=>`<div class="card"><div class="kpi-label">${earned?"Unlocked":"Locked"}</div><h3 style="margin-top:8px">${earned?"★":"☆"} ${title}</h3><p class="small muted">${earned?"Achievement verified from your account activity.":"Keep using Kharcha to unlock this achievement."}</p></div>`).join("")}</div>`;
}

function supportView() {
  return `<div class="grid2"><section class="card"><h2>Help & support</h2><p class="muted small" style="margin:8px 0 16px">Submit a bug, feature idea or feedback. It is stored securely in Supabase.</p><form id="supportForm" class="form-grid">
    <div class="field full"><label>Request type</label><select name="type"><option value="help">Help</option><option value="bug">Report bug</option><option value="feature">Suggest feature</option><option value="feedback">Feedback</option></select></div>
    <div class="field full"><label>Message</label><textarea name="message" required minlength="10"></textarea></div>
    <div class="field full"><button class="button" type="submit">Submit request</button></div>
  </form></section><div class="support-stack"><section class="card"><h2>Frequently asked questions</h2><details><summary>Is my financial data private?</summary><p class="muted small">Personal records are protected by Supabase row-level security.</p></details><details><summary>Are public demo numbers real?</summary><p class="muted small">No. Public preview values are clearly demonstration data and are never loaded from another user.</p></details><details><summary>Can I export reports?</summary><p class="muted small">CSV and PDF exports are available from Reports & Analytics or Export Data.</p></details><details><summary>Does receipt scanning save automatically?</summary><p class="muted small">No. Review the extracted amount and date, then choose Add as expense to save it.</p></details></section>
  <section class="card"><h2>About Kharcha</h2><p class="muted small">Kharcha helps students track real income and expenses, set practical budgets, and understand spending in one private dashboard.</p><p class="small"><strong>Contact support:</strong> Use the form on this page to submit a help request or feedback.</p></section></div></div>`;
}

function analyticsView() {
  const now=new Date();
  const weekStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  const yearStart=new Date(now.getFullYear(),0,1);
  const periods=[["This week",weekStart],["This month",monthStart],["This year",yearStart]];
  const cards=periods.map(([label,start])=>{
    const startKey=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}-${String(start.getDate()).padStart(2,"0")}`;
    const expense=state.expenses.filter(x=>x.date>=startKey&&x.date<=todayISO()).reduce((s,x)=>s+x.amount,0);
    const income=state.incomes.filter(x=>x.income_date>=startKey&&x.income_date<=todayISO()).reduce((s,x)=>s+x.amount,0);
    return `<div class="card"><div class="kpi-label">${label}</div><div class="kpi">${money(income-expense)}</div><p class="small muted">Net: income ${money(income)} − expenses ${money(expense)}</p></div>`;
  }).join("");
  const rangeExpenses=state.expenses.filter(x=>x.date>=state.reportFrom&&x.date<=state.reportTo);
  const rangeIncome=state.incomes.filter(x=>x.income_date>=state.reportFrom&&x.income_date<=state.reportTo).reduce((sum,x)=>sum+x.amount,0);
  const rangeExpense=rangeExpenses.reduce((sum,x)=>sum+x.amount,0);
  const categoryRows=availableCategories("expense").map(cat=>{
    const value=rangeExpenses.filter(x=>x.category===cat).reduce((s,x)=>s+x.amount,0);
    return value?`<div class="category-row"><span>${categoryIcon(cat)} ${escapeHTML(cat)}</span><div class="progress"><span style="width:${rangeExpense?Math.round(value/rangeExpense*100):0}%"></span></div><span>${money(value)}</span></div>`:"";
  }).join("");
  return `<div class="grid3">${cards}</div><section class="card" style="margin-top:16px"><div class="card-head"><div><h2>Date range report</h2><p class="small muted">Review a week, month, year, or choose exact dates.</p></div></div><div class="search-row"><label class="field">From<input id="reportFrom" type="date" value="${escapeHTML(state.reportFrom)}"></label><label class="field">To<input id="reportTo" type="date" value="${escapeHTML(state.reportTo)}"></label></div><div class="grid3"><div><div class="kpi-label">Income</div><strong>${money(rangeIncome)}</strong></div><div><div class="kpi-label">Expenses</div><strong>${money(rangeExpense)}</strong></div><div><div class="kpi-label">Net</div><strong>${money(rangeIncome-rangeExpense)}</strong></div></div></section>
  <div class="grid2" style="margin-top:16px"><section class="card"><div class="card-head"><div><h2>Category-wise expenses</h2><p class="small muted">${escapeHTML(state.reportFrom)} – ${escapeHTML(state.reportTo)}</p></div></div>${categoryRows||`<div class="empty">No spending data in this date range.</div>`}</section>
  <section class="card"><div class="card-head"><div><h2>Expense trends</h2><p class="small muted">Income and spending by month</p></div></div>${monthlyChart()}</section></div>
  <section class="card" style="margin-top:16px"><div class="card-head"><div><h2>Download this report</h2><p class="small muted">The selected date range is applied to both exports.</p></div><div class="search-row"><button class="button small secondary" data-action="export-csv">Download CSV</button><button class="button small" data-action="export-pdf">Download PDF</button></div></div></section>`;
}

function exportsView() {
  const year=Number(state.exportYear);
  const months=state.expenses.filter(item=>item.date?.startsWith(state.exportMonth)).length+state.incomes.filter(item=>item.income_date?.startsWith(state.exportMonth)).length;
  const yearly=state.expenses.filter(item=>item.date?.startsWith(String(year))).length+state.incomes.filter(item=>item.income_date?.startsWith(String(year))).length;
  return `<div class="grid2"><section class="card"><div class="card-head"><div><h2>Transactions</h2><p class="small muted">Export the current account’s saved transactions.</p></div><span class="badge">${state.expenses.length+state.incomes.length} entries</span></div><div class="quick-actions"><button class="button" data-action="export-all-csv">Export transactions as CSV</button><button class="button secondary" data-action="export-all-pdf">Export transactions as PDF</button></div></section>
    <section class="card"><h2>Monthly report</h2><p class="small muted">Choose a month to export a saved-data report.</p><label class="field" for="exportMonth">Month<input id="exportMonth" type="month" value="${escapeHTML(state.exportMonth)}"></label><p class="small muted">${months} saved transactions in this month.</p><div class="quick-actions"><button class="button small secondary" data-action="export-month-csv">Download monthly CSV</button><button class="button small" data-action="export-month-pdf">Download monthly PDF</button></div></section>
    <section class="card"><h2>Yearly report</h2><p class="small muted">Choose a year to export a saved-data report.</p><label class="field" for="exportYear">Year<input id="exportYear" type="number" min="2000" max="2100" value="${escapeHTML(state.exportYear)}"></label><p class="small muted">${yearly} saved transactions in this year.</p><div class="quick-actions"><button class="button small secondary" data-action="export-year-csv">Download yearly CSV</button><button class="button small" data-action="export-year-pdf">Download yearly PDF</button></div></section>
    <section class="card"><h2>Privacy</h2><p class="small muted">Exports are generated in your browser from records loaded for your signed-in account. No sample transactions are exported.</p></section></div>`;
}

function setReportMonth(month) {
  const match=String(month||"").match(/^(\d{4})-(\d{2})$/);
  if(!match||Number(match[2])<1||Number(match[2])>12) return false;
  const lastDay=new Date(Number(match[1]),Number(match[2]),0).getDate();
  state.reportFrom=`${month}-01`;
  state.reportTo=`${month}-${String(lastDay).padStart(2,"0")}`;
  return true;
}

function setReportYear(yearValue) {
  const year=Number(yearValue);
  if(!Number.isInteger(year)||year<2000||year>2100) return false;
  state.reportFrom=`${year}-01-01`;
  state.reportTo=`${year}-12-31`;
  return true;
}

function adminView() {
  const profileCount=state.adminProfiles;
  const monthExpenses=state.expenses.filter(x=>isCurrentMonth(x.date));
  const aggregate=monthExpenses.reduce((sum,x)=>sum+x.amount,0);
  return `<div class="card"><p class="small muted">Privacy-preserving administrator view</p><div class="grid3" style="margin-top:12px">
    <div class="card"><div class="kpi-label">Registered profiles</div><div class="kpi">${profileCount}</div></div>
    <div class="card"><div class="kpi-label">Profiles with accessible data</div><div class="kpi">${profileCount}</div></div>
    <div class="card"><div class="kpi-label">Current-user monthly expense sample</div><div class="kpi">${money(aggregate)}</div></div>
  </div><p class="small muted" style="margin-top:16px">Cross-student aggregates require a secure database RPC. Individual transactions are never shown and RLS prevents profile data access unless explicitly authorized.</p></div>`;
}

function openAuthModal(tab="login") {
  $("#authModal").hidden=false;
  document.querySelectorAll("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===tab));
  renderAuthForm(tab);
}

function renderAuthForm(tab) {
  if(tab==="signup") {
    $("#authTitle").textContent="Create account";
    $("#authForm").innerHTML=`<div class="field full"><label>Full name</label><input name="name" autocomplete="name" required></div><div class="field full"><label>College</label><input name="college" autocomplete="organization"></div><div class="field full"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field full"><label>Password</label><div class="password-field"><input name="password" type="password" minlength="8" autocomplete="new-password" required><button type="button" data-toggle-password aria-label="Show password">Show</button></div></div><button class="button full" type="submit">Create account</button><button class="button secondary full" type="button" data-reset-password>Reset password</button>`;
  } else {
    $("#authTitle").textContent="Welcome back";
    $("#authForm").innerHTML=`<div class="field full"><label>Email</label><input name="email" type="email" autocomplete="email" required></div><div class="field full"><label>Password</label><div class="password-field"><input name="password" type="password" autocomplete="current-password" required><button type="button" data-toggle-password aria-label="Show password">Show</button></div></div><button class="button full" type="submit">Log in</button><button class="button secondary full" type="button" data-reset-password>Reset password</button>`;
  }
  $("#authForm").dataset.mode=tab;
}

function ensureWebAuthOrigin() {
  if(location.protocol!=="file:")return true;
  toast("Open Kharcha over http:// or https:// before using authentication. Try http://127.0.0.1:5500/Kharcha_Supabase_Connected%20(1).html.",true);
  return false;
}

async function handleAuth(form) {
  if(!ensureWebAuthOrigin())return;
  const data=new FormData(form);
  const email=data.get("email").trim();
  const password=data.get("password");
  const submit=form.querySelector('button[type="submit"]');
  if(submit){submit.disabled=true;submit.textContent=form.dataset.mode==="signup"?"Creating account…":"Logging in…";}
  try {
    if(form.dataset.mode==="signup") {
      const {data:auth,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:location.href,data:{full_name:data.get("name").trim(),college_name:data.get("college").trim(),account_type:"student"}}});
      if(error){if(submit){submit.disabled=false;submit.textContent="Create account";}return toast(error.message,true);}
      if(!auth.session) toast("Check your email to confirm your account");
    } else {
      const {error}=await db.auth.signInWithPassword({email,password});
      if(error){if(submit){submit.disabled=false;submit.textContent="Log in";}return toast(error.message,true);}
    }
  } catch(error) {
    if(submit){submit.disabled=false;submit.textContent=form.dataset.mode==="signup"?"Create account":"Log in";}
    toast(error.message||"Authentication could not be completed. Try again.",true);
    return;
  }
  $("#authModal").hidden=true;
}

function exportableTransactions(ignoreRange=false) {
  let rows=[
    ...state.expenses.map(x=>({date:x.date,title:x.merchant,category:x.category,type:"Expense",payment_method:x.payment_method,amount:x.amount,description:x.description})),
    ...state.incomes.map(x=>({date:x.income_date,title:x.source,category:x.category||"Other",type:"Income",payment_method:x.payment_method,amount:x.amount,description:x.description}))
  ];
  if(!ignoreRange&&(state.view==="analytics"||state.view==="reports"||state.view==="exports")) rows=rows.filter(x=>x.date>=state.reportFrom&&x.date<=state.reportTo);
  if(state.view==="transactions") {
    const term=state.transactionFilter.toLowerCase();
    rows=rows.filter(x=>
      (!term||[x.title,x.category,x.description,x.payment_method].join(" ").toLowerCase().includes(term))&&
      (!state.transactionType||x.type.toLowerCase()===state.transactionType)&&
      (!state.transactionCategory||x.category===state.transactionCategory)&&
      (!state.transactionMethod||x.payment_method===state.transactionMethod)&&
      (!state.transactionFrom||x.date>=state.transactionFrom)&&
      (!state.transactionTo||x.date<=state.transactionTo)
    );
  }
  return rows.sort((a,b)=>state.transactionSort==="amount-desc"?b.amount-a.amount:state.transactionSort==="amount-asc"?a.amount-b.amount:state.transactionSort==="date-asc"?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
}

function exportCSV(allTransactions=false) {
  if(!allTransactions&&(state.view==="analytics"||state.view==="reports"||state.view==="exports")&&
    (!isValidISODate(state.reportFrom)||!isValidISODate(state.reportTo)||state.reportFrom>state.reportTo)){
    return toast("Choose a valid date range before exporting",true);
  }
  const rows=[["Date","Title","Type","Category","Payment method",`Amount (${state.profile?.currency||"INR"})`,"Description"],...exportableTransactions(allTransactions).map(x=>[x.date,x.title,x.type,x.category,x.payment_method,x.amount,x.description])];
  const csv=rows.map(row=>row.map(value=>`"${String(value??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=`kharcha-transactions-${todayISO()}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportExcel() {
  const rows=[["Date","Title","Type","Category","Payment method","Amount (INR)","Description"],...exportableTransactions().map(x=>[x.date,x.title,x.type,x.category,x.payment_method,x.amount,x.description])];
  const table=rows.map(row=>`<tr>${row.map(value=>`<td>${escapeHTML(value)}</td>`).join("")}</tr>`).join("");
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table>${table}</table></body></html>`;
  const url=URL.createObjectURL(new Blob([html],{type:"application/vnd.ms-excel"}));
  const link=document.createElement("a");link.href=url;link.download=`kharcha-transactions-${todayISO()}.xls`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportPDF(allTransactions=false) {
  if(!window.jspdf) return toast("PDF library could not load",true);
  if(!allTransactions&&(state.view==="analytics"||state.view==="reports"||state.view==="exports")&&
    (!isValidISODate(state.reportFrom)||!isValidISODate(state.reportTo)||state.reportFrom>state.reportTo)){
    return toast("Choose a valid date range before exporting",true);
  }
  const entries=exportableTransactions(allTransactions);
  const income=entries.filter(x=>x.type==="Income").reduce((sum,x)=>sum+x.amount,0);
  const expense=entries.filter(x=>x.type==="Expense").reduce((sum,x)=>sum+x.amount,0);
  const doc=new window.jspdf.jsPDF();
  doc.setFontSize(18);doc.text("Kharcha Financial Report",14,18);
  doc.setFontSize(11);
  doc.text(allTransactions?"Period: All recorded transactions":`Period: ${state.reportFrom} to ${state.reportTo}`,14,30);
  doc.text(`Income: ${money(income)}  Expenses: ${money(expense)}  Net: ${money(income-expense)}`,14,40);
  doc.setFontSize(9);
  let y=52;
  entries.forEach(entry=>{
    const text=`${entry.date}  ${entry.type}  ${entry.category}  ${entry.title}  ${money(entry.amount)}`;
    const lines=doc.splitTextToSize(text,180);
    if(y+lines.length*5>280){doc.addPage();y=20;}
    doc.text(lines,14,y);
    y+=lines.length*5+2;
  });
  doc.save(`kharcha-report-${todayISO()}.pdf`);
}

function renderNotifications() {
  const panel=$("#notificationPanel");
  if(!state.notificationsEnabled){
    panel.innerHTML=`<div class="notification-item"><strong>Notifications are off</strong><p class="small muted">Turn them on in Settings to receive budget alerts.</p></div>`;
    panel.hidden=!panel.hidden;
    localizeRenderedInterface();
    return;
  }
  if(!state.notifications.length) panel.innerHTML=`<div class="notification-item"><strong>No notifications</strong><p class="small muted">Budget and savings alerts will appear here.</p></div>`;
  else panel.innerHTML=state.notifications.map(n=>`<div class="notification-item"><strong>${escapeHTML(n.title)}</strong><p class="small muted">${escapeHTML(n.message)}</p></div>`).join("");
  panel.hidden=!panel.hidden;
  localizeRenderedInterface();
  if(!panel.hidden&&state.user) markNotificationsRead();
}

function closePublicNavigation() {
  $("#landingNavigation")?.classList.remove("open");
  $(".landing-menu-button")?.setAttribute("aria-expanded","false");
}

async function markNotificationsRead() {
  const unread=state.notifications.filter(n=>!n.read_at);
  if(!unread.length)return;
  const {error}=await db.from("notifications").update({read_at:new Date().toISOString()}).in("id",unread.map(n=>n.id)).eq("user_id",state.user.id);
  if(error){toast(error.message,true);return;}
  state.notifications=state.notifications.map(n=>({...n,read_at:n.read_at||new Date().toISOString()}));
  $("#notificationDot").hidden=true;
}

async function generateBudgetAlerts() {
  if(!state.user||!state.notificationsEnabled)return;
  const monthExpenses=state.expenses.filter(x=>isCurrentMonth(x.date));
  for(const b of state.budgets){
    const spent=monthExpenses.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0);
    const pct=b.amount?spent/b.amount:0;
    if(pct<.75)continue;
    const level=pct>=1?"100%":pct>=.9?"90%":"75%";
    const exists=state.notifications.some(n=>n.type==="budget_"+level+"_"+b.category);
    if(exists)continue;
    const {data,error}=await db.from("notifications").insert({user_id:state.user.id,type:"budget_"+level+"_"+b.category,title:`${b.category} budget ${level}`,message:`You have used ${Math.round(pct*100)}% of your ${money(b.amount)} budget.`}).select().single();
    if(error){toast(`Budget alert: ${error.message}`,true);continue;}
    if(data)state.notifications.unshift(data);
  }
  render();
}

document.addEventListener("click",async event=>{
  if(!(event.target instanceof Element))return;
  const clickedElement=event.target;
  const notificationPanel=$("#notificationPanel");
  if(notificationPanel&&!notificationPanel.hidden&&!notificationPanel.contains(clickedElement)&&!$("#notificationButton").contains(clickedElement))notificationPanel.hidden=true;
  const sidebar=$("#sidebar");
  if(window.matchMedia("(max-width: 760px)").matches&&sidebar.classList.contains("open")&&!sidebar.contains(clickedElement)&&!$("#mobileMenu").contains(clickedElement))sidebar.classList.remove("open");
  const target=clickedElement.closest("[data-action],[data-open-auth],[data-close-modal],[data-auth-tab],[data-reset-password],[data-toggle-password]");
  if(!target)return;
  const action=target.dataset.action;
  if(target.hasAttribute("data-toggle-password")){
    const input=target.closest(".password-field").querySelector("input");
    input.type=input.type==="password"?"text":"password";
    target.textContent=input.type==="password"?"Show":"Hide";
    target.setAttribute("aria-label",input.type==="password"?"Show password":"Hide password");
    return;
  }
  if(target.id==="saveReceipt"){await saveReceiptExpense();return;}
  if(action==="extract-receipt"){
    if(state.receiptFile)await scanReceipt(state.receiptFile);
    else toast("Choose a receipt image first",true);
    return;
  }
  if(target.id==="chatSend"){
    const input=$("#chatInput");const question=input?.value.trim();
    if(question){input.value="";await askAssistant(question);}return;
  }
  if(target.dataset.closeModal) {$("#"+target.dataset.closeModal).hidden=true;return;}
  if(target.hasAttribute("data-open-auth")) {closePublicNavigation();openAuthModal(target.dataset.openAuth||"login");return;}
  if(action==="landing"){closePublicNavigation();window.scrollTo({top:0,behavior:"smooth"});return;}
  if(action==="toggle-public-menu"){
    const nav=$("#landingNavigation");
    const isOpen=nav.classList.toggle("open");
    target.setAttribute("aria-expanded",String(isOpen));
    return;
  }
  if(action==="public-features"){$("#public-features")?.scrollIntoView({behavior:"smooth"});closePublicNavigation();return;}
  if(action==="public-how"){$("#public-how")?.scrollIntoView({behavior:"smooth"});closePublicNavigation();return;}
  if(action==="public-faq"){$("#public-faq")?.scrollIntoView({behavior:"smooth"});closePublicNavigation();return;}
  if(action==="public-about"){$("#public-about")?.scrollIntoView({behavior:"smooth"});closePublicNavigation();return;}
  if(action==="public-contact"){$("#public-contact")?.scrollIntoView({behavior:"smooth"});closePublicNavigation();return;}
  if(target.dataset.authTab) {openAuthModal(target.dataset.authTab);return;}
  if(target.hasAttribute("data-reset-password")) {
    if(!ensureWebAuthOrigin())return;
    const email=$("#authForm").elements.email?.value.trim();
    if(!email)return toast("Enter your email first",true);
    const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.href});
    if(error)toast(error.message,true);else toast("Password reset email sent");
    return;
  }
  if(action==="nav"){state.view=target.dataset.view;render();$("#sidebar").classList.remove("open");$("#landingNavigation")?.classList.remove("open");window.scrollTo(0,0);}
  if(action==="retry-load")await loadData();
  if(action==="calendar-month"){
    const current=new Date(`${state.calendarMonth}T12:00:00`);
    const next=new Date(current.getFullYear(),current.getMonth()+Number(target.dataset.offset),1);
    state.calendarMonth=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-01`;
    state.calendarDate=state.calendarMonth;
    render();
  }
  if(action==="select-calendar-date"){state.calendarDate=target.dataset.date;render();}
  if(action==="toggle-theme"){$("#themeButton").click();}
  if(action==="toggle-language"){$("#languageButton").click();}
  if(action==="mark-all-read"){
    if(!state.user)return;
    const unread=state.notifications.filter(n=>!n.read_at);
    if(unread.length){const {error}=await db.from("notifications").update({read_at:new Date().toISOString()}).in("id",unread.map(n=>n.id)).eq("user_id",state.user.id);if(error)return toast(error.message,true);await loadData();toast("All notifications marked read");}
  }
  if(action==="delete-notification"){
    if(confirm("Delete this notification?")){const {error}=await db.from("notifications").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);if(error)toast(error.message,true);else{await loadData();toast("Notification deleted");}}
  }
  if(action==="add-transaction")openTransactionModal();
  if(action==="add-expense"){state.view="add-expense";render();}
  if(action==="add-income"){state.view="add-income";render();}
  if(action==="cancel-entry"){state.view="dashboard";render();window.scrollTo(0,0);}
  if(action==="add-category")openCategoryModal();
  if(action==="edit-profile"){state.profileEditing=true;render();}
  if(action==="cancel-profile"){state.profileEditing=false;render();}
  if(action==="edit-category"){
    const category=state.userCategories.find(item=>item.id===target.dataset.id);
    if(category)openCategoryModal(category);
  }
  if(action==="delete-category"){
    const category=state.userCategories.find(item=>item.id===target.dataset.id);
    if(!category)return;
    const isUsed=category.type==="expense"
      ?state.expenses.some(item=>item.category===category.name)||state.budgets.some(item=>item.category===category.name)
      :state.incomes.some(item=>(item.category||"Other")===category.name);
    if(isUsed)return toast("This category is used by saved records or budgets and cannot be deleted.",true);
    if(confirm(`Delete the ${category.name} category?`)){
      const {error}=await db.from("user_categories").delete().eq("id",category.id).eq("user_id",state.user.id);
      if(error)toast(error.message,true);else{await loadData();state.view="categories";render();toast("Category deleted");}
    }
  }
  if(action==="filter-category"){
    state.transactionCategory=target.dataset.category||"";
    state.transactionType="expense";
    state.view="transactions";
    render();
  }
  if(action==="view-transaction"){
    const type=target.dataset.type;
    const transaction=type==="income"?state.incomes.find(x=>x.id===target.dataset.id):state.expenses.find(x=>x.id===target.dataset.id);
    if(transaction)showTransactionDetails(transaction,type);
  }
  if(action==="edit-income"){
    const income=state.incomes.find(x=>x.id===target.dataset.id);
    if(!income)return;
    openTransactionModal({...income,type:"income",source:income.source,merchant:income.source,date:income.income_date},"income");
  }
  if(action==="delete-income"){
    if(confirm("Delete this income entry?")){
      const {error}=await db.from("incomes").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);
      if(error)toast(error.message,true);else{await loadData();toast("Income deleted");}
    }
  }
  if(action==="edit-transaction"){
    const type=target.dataset.type;
    const transaction=type==="income"?state.incomes.find(x=>x.id===target.dataset.id):state.expenses.find(x=>x.id===target.dataset.id);
    if(transaction)openTransactionModal(type==="income"?{...transaction,type,date:transaction.income_date}:transaction,type);
  }
  if(action==="delete-transaction"){
    if(confirm("Delete this transaction?")) {
      const table=target.dataset.type==="income"?"incomes":"expenses";
      const {error}=await db.from(table).delete().eq("id",target.dataset.id).eq("user_id",state.user.id);
      if(error)toast(error.message,true);else{await loadData();toast("Transaction deleted");}
    }
  }
  if(action==="export-csv")exportCSV();
  if(action==="export-excel")exportExcel();
  if(action==="export-pdf")exportPDF();
  if(action==="export-all-csv")exportCSV(true);
  if(action==="export-all-pdf")exportPDF(true);
  if(action==="export-month-csv"||action==="export-month-pdf"){
    if(!setReportMonth(state.exportMonth))return toast("Choose a valid month",true);
    if(action==="export-month-csv")exportCSV();else exportPDF();
  }
  if(action==="export-year-csv"||action==="export-year-pdf"){
    if(!setReportYear(state.exportYear))return toast("Choose a year between 2000 and 2100",true);
    if(action==="export-year-csv")exportCSV();else exportPDF();
  }
  if(action==="logout"){
    const {error}=await db.auth.signOut();
    if(error)toast(error.message,true);else toast("Signed out");
  }
  if(action==="reset-password"){
    if(!ensureWebAuthOrigin())return;
    if(!state.user?.email)return;
    const {error}=await db.auth.resetPasswordForEmail(state.user.email,{redirectTo:location.href});
    if(error)toast(error.message,true);else toast("Password reset email sent");
  }
  if(action==="add-budget"){
    const categoryOptions=availableCategories("expense");
    const category=prompt(`Category (${categoryOptions.join(", ")})`,categoryOptions[0]);if(category===null)return;
    if(!categoryOptions.includes(category))return toast("Choose a listed budget category",true);
    const amount=prompt(`Monthly budget amount in ${currencySymbol()}`,"1000");if(amount!==null)await saveBudget(category,amount);
  }
  if(action==="edit-budget"){
    const amount=prompt(`Monthly budget amount in ${currencySymbol()}`,target.dataset.amount);if(amount!==null)await saveBudget(target.dataset.category,amount,target.dataset.id);
  }
  if(action==="delete-budget"){
    if(confirm("Delete this budget?")){const {error}=await db.from("budgets").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);if(error)toast(error.message,true);else{await loadData();toast("Budget deleted");}}
  }
  if(action==="add-goal"){
    const name=prompt("Savings goal name","Laptop");if(!name)return;
    const target=prompt("Target amount in ₹","30000");if(!target)return;
    const date=prompt("Target date (YYYY-MM-DD)",todayISO());if(!date)return;
    if(!(Number(target)>0)||!Number.isFinite(Number(target)))return toast("Enter a valid goal amount",true);
    if(Number.isNaN(Date.parse(`${date}T00:00:00`)))return toast("Enter a valid target date",true);
    const {error}=await db.from("savings_goals").insert({user_id:state.user.id,name:name.trim(),target_amount:Number(target),target_date:date,status:"active"});
    if(error)toast(error.message,true);else{await loadData();toast("Savings goal created");}
  }
  if(action==="add-contribution"){
    const amount=prompt("Contribution amount in ₹","500");if(amount!==null)await addContribution(target.dataset.id,amount);
  }
  if(action==="delete-goal"){
    if(confirm("Delete this savings goal and its contributions?")){
      const {error}=await db.from("savings_goals").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);
      if(error)toast(error.message,true);else{await loadData();toast("Savings goal deleted");}
    }
  }
  if(action==="create-group"){
    const name=prompt("Group name","Roommates");if(name)await createGroup(name);
  }
  if(action==="open-group"){
    const group=state.groups.find(g=>g.id===target.dataset.id);
    if(!group)return;
    const choice=prompt("Type 1 to add member or 2 to add equal shared expense","1");
    if(choice==="1"){const memberName=prompt("Member name");if(memberName)await addGroupMember(group.id,memberName);}
    if(choice==="2"){
      const members=group.group_members||[];
      if(!members.length)return toast("Add a member first",true);
      const description=prompt("Expense description","Dinner");if(!description)return;
      const amount=prompt("Amount in ₹","500");if(!amount)return;
      await addGroupExpense(group.id,members[0].id,description,amount,members.map(m=>m.id));
    }
  }
  if(action==="add-recurring"){
    const name=prompt("Recurring expense name","Room rent");if(!name)return;
    const amount=prompt("Amount in ₹","5000");if(!amount)return;
    const category=prompt("Category","Accommodation");if(!CATEGORIES.includes(category))return toast("Use a listed category",true);
    const recurrence=prompt("Frequency: daily, weekly, monthly or yearly","monthly");if(!["daily","weekly","monthly","yearly"].includes(recurrence))return;
    const next=prompt("Next due date (YYYY-MM-DD)",todayISO());if(!next)return;
    const {error}=await db.from("recurring_expenses").insert({user_id:state.user.id,name,amount:Number(amount),category,payment_method:"UPI",recurrence,next_due_date:next,active:true});
    if(error)toast(error.message,true);else{await loadData();toast("Recurring expense added");}
  }
  if(action==="delete-recurring"){
    if(confirm("Delete this recurring expense?")){const {error}=await db.from("recurring_expenses").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);if(error)toast(error.message,true);else{await loadData();toast("Recurring expense deleted");}}
  }
  if(action==="add-subscription"){
    const name=prompt("Subscription name","Spotify");if(!name)return;
    const amount=prompt("Amount in ₹","119");if(!amount)return;
    const frequency=prompt("Billing frequency: monthly or yearly","monthly");if(!["monthly","yearly"].includes(frequency))return;
    const next=prompt("Next payment date (YYYY-MM-DD)",todayISO());if(!next)return;
    const {error}=await db.from("subscriptions").insert({user_id:state.user.id,name,amount:Number(amount),billing_frequency:frequency,next_payment_date:next,payment_method:"UPI",active:true});
    if(error)toast(error.message,true);else{await loadData();toast("Subscription added");}
  }
  if(action==="delete-subscription"){
    if(confirm("Delete this subscription?")){const {error}=await db.from("subscriptions").delete().eq("id",target.dataset.id).eq("user_id",state.user.id);if(error)toast(error.message,true);else{await loadData();toast("Subscription deleted");}}
  }
  if(action==="add-reminder"){
    const title=prompt("Reminder title","Pay mobile recharge");if(!title)return;
    const date=prompt("Reminder date (YYYY-MM-DD)",state.calendarDate);if(!date)return;
    if(Number.isNaN(Date.parse(`${date}T00:00:00`)))return toast("Enter a valid reminder date",true);
    const {error}=await db.from("calendar_reminders").insert({user_id:state.user.id,title:title.trim(),reminder_date:date,reminder_type:"payment",completed:false});
    if(error)toast(error.message,true);else{await loadData();toast("Reminder added");}
  }
  if(action==="add-challenge"){
    const title=prompt("Challenge title","30-day no unnecessary shopping");if(!title)return;
    const target=prompt("Savings target in ₹","2000");if(!target)return;
    const end=prompt("End date (YYYY-MM-DD)",todayISO());if(!end)return;
    const {error}=await db.from("financial_challenges").insert({user_id:state.user.id,title,target_amount:Number(target),start_date:todayISO(),end_date:end,progress:0,completed:false});
    if(error)toast(error.message,true);else{await loadData();toast("Challenge created");}
  }
  if(action==="complete-lesson"){
    const key=target.dataset.key;
    const {error}=await db.from("learning_progress").upsert({user_id:state.user.id,lesson_key:key,completed:true,quiz_score:100,completed_at:new Date().toISOString()},{onConflict:"user_id,lesson_key"});
    if(error)toast(error.message,true);else{await loadData();toast("Lesson marked complete");}
  }
});

document.addEventListener("submit",async event=>{
  event.preventDefault();
  if(event.target.id==="authForm")await handleAuth(event.target);
  if(event.target.id==="transactionForm")await saveTransaction(event.target);
  if(event.target.id==="entryForm")await saveTransaction(event.target);
  if(event.target.id==="categoryForm")await saveCategory(event.target);
  if(event.target.id==="profileForm"){
    const data=new FormData(event.target);
    const payload={full_name:data.get("full_name").trim(),college_name:data.get("college_name").trim(),monthly_allowance:data.get("monthly_allowance")?Number(data.get("monthly_allowance")):null,currency:data.get("currency"),language:data.get("language")};
    const {error}=await db.from("profiles").update(payload).eq("id",state.user.id);
    if(error)return toast(error.message,true);
    saveStoredPreference("language",payload.language,state.user.id);
    state.profileEditing=false;
    await loadProfile();render();toast("Profile saved");
  }
  if(event.target.id==="settingsForm"){
    const data=new FormData(event.target);
    const payload={theme:data.get("theme"),language:data.get("language"),currency:data.get("currency"),notifications_enabled:data.has("notifications_enabled")};
    const {error}=await db.from("profiles").update(payload).eq("id",state.user.id);
    if(error)return toast(error.message,true);
    state.profile={...state.profile,...payload};
    state.theme=payload.theme;
    state.lang=payload.language;
    state.notificationsEnabled=payload.notifications_enabled;
    saveStoredPreference("theme",state.theme,state.user.id);
    saveStoredPreference("language",state.lang,state.user.id);
    document.documentElement.dataset.theme=state.theme;
    document.documentElement.lang=state.lang;
    render();toast("Preferences saved");
  }
  if(event.target.id==="supportForm"){
    const data=new FormData(event.target);
    const payload={user_id:state.user?.id||null,name:state.profile?.full_name||"",email:state.user?.email||"",type:data.get("type"),message:data.get("message").trim(),status:"open"};
    const {error}=await db.from("support_requests").insert(payload);
    if(error)toast(error.message,true);else{event.target.reset();toast("Support request submitted");}
  }
});

document.addEventListener("input",event=>{
  if(event.target.id==="globalSearch"){
    state.transactionFilter=event.target.value;
    state.view="transactions";
    render();
  }
  if(event.target.id==="transactionSearch"){
    state.transactionFilter=event.target.value;
    $("#globalSearch").value=event.target.value;
    const cursor=event.target.selectionStart;
    render();
    const search=$("#transactionSearch");
    search?.focus();
    if(cursor!==null)search?.setSelectionRange(cursor,cursor);
  }
});
document.addEventListener("change",event=>{
  if(event.target.id==="transactionEntryType")toggleTransactionType(event.target.value);
  if(event.target.id==="transactionFrom"){state.transactionFrom=event.target.value;render();}
  if(event.target.id==="transactionTo"){state.transactionTo=event.target.value;render();}
  if(event.target.id==="reportFrom"){state.reportFrom=event.target.value;render();}
  if(event.target.id==="reportTo"){state.reportTo=event.target.value;render();}
  if(event.target.id==="transactionCategory"){state.transactionCategory=event.target.value;render();}
  if(event.target.id==="transactionType"){state.transactionType=event.target.value;render();}
  if(event.target.id==="transactionMethod"){state.transactionMethod=event.target.value;render();}
  if(event.target.id==="transactionSort"){state.transactionSort=event.target.value;render();}
  if(event.target.id==="receiptFile")scanReceipt(event.target.files[0]);
  if(event.target.id==="exportMonth"){state.exportMonth=event.target.value;render();}
  if(event.target.id==="exportYear"){state.exportYear=event.target.value;render();}
  if(event.target.id==="ocrAmount"||event.target.id==="ocrMerchant"||event.target.id==="ocrDate")return;
});
document.addEventListener("keydown",async event=>{
  if(event.key==="Escape"){document.querySelectorAll(".modal-backdrop").forEach(m=>m.hidden=true);$("#notificationPanel").hidden=true;$("#sidebar").classList.remove("open");}
  if(event.target.id==="chatInput"&&event.key==="Enter"){const q=event.target.value.trim();if(q){event.target.value="";await askAssistant(q);}}
});

$("#authButton").addEventListener("click",async()=>{
  if(!state.user)return openAuthModal("login");
  const {error}=await db.auth.signOut();
  if(error)toast(error.message,true);else toast("Signed out");
});
$("#themeButton").addEventListener("click",async()=>{
  state.theme=state.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=state.theme;
  saveStoredPreference("theme",state.theme,state.user?.id);
  if(state.user){
    const {error}=await db.from("profiles").update({theme:state.theme}).eq("id",state.user.id);
    if(error)toast(error.message,true);
  }
});
$("#languageButton").addEventListener("click",async()=>{
  state.lang=state.lang==="en"?"hi":"en";document.documentElement.lang=state.lang;
  saveStoredPreference("language",state.lang,state.user?.id);
  if(state.user){
    const {error}=await db.from("profiles").update({language:state.lang}).eq("id",state.user.id);
    if(error)toast(error.message,true);
  }
  render();
});
$("#notificationButton").addEventListener("click",()=>renderNotifications());
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
db.auth.onAuthStateChange(async(_event,session)=>{
  const nextUser=session?.user||null;
  const changed=state.user?.id!==nextUser?.id;
  state.user=nextUser;
  if(changed){
    state.profile=null;
    state.profileEditing=false;
    clearUserData();
    state.loading=Boolean(nextUser);
    state.loadError="";
    render();
  }
  if(state.user){await loadProfile();await loadData();await generateBudgetAlerts();}else{state.profile=null;state.notificationsEnabled=true;clearUserData();state.loading=false;state.loadError="";render();window.scrollTo(0,0);}
});
db.auth.getSession().then(async({data})=>{
  const nextUser=data.session?.user||null;
  if(state.user?.id&&state.user.id!==nextUser?.id)return;
  const changed=state.user?.id!==nextUser?.id;
  state.user=nextUser;
  if(changed){state.profile=null;state.profileEditing=false;clearUserData();state.loading=Boolean(nextUser);state.loadError="";render();}
  if(state.user){await loadProfile();await loadData();await generateBudgetAlerts();}
  else {state.notificationsEnabled=true;render();window.scrollTo(0,0);}
});
