
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Send, ShoppingCart, User, MapPin, Calendar, FileText, CheckCircle2, 
  ClipboardList, ArrowRight, History, ArrowLeft, Package, AlertCircle, LogOut, 
  ShieldCheck, Truck, XCircle, Check, Users, Navigation, Wheat, Pencil, Lock, X, 
  KeyRound, ChevronDown, Hash, Phone, PauseCircle, AlertTriangle, Save, Mail, 
  Search, FileSpreadsheet, Download, Eye, EyeOff, Languages, Siren, Clock, 
  RefreshCw, Upload, Filter, CircleCheck, Sparkles, ShieldAlert, Camera, Image as LucideImage, Maximize2
} from 'lucide-react';
import { PRODUCT_CATALOG, CUSTOMER_LIST, WAREHOUSES, DRIVERS_FLEET, DELIVERY_SHIFTS } from './constants.ts';
import { OrderItem, SalesOrder, OrderStatus, HistoryItem, Role, Shipment, EmergencyReport, UserProfile } from './types.ts';
import { getUserByPin } from './users.ts';
import { TRANSLATIONS } from './translations.ts';
import { MagicParser } from './components/MagicParser.tsx';

// --- TYPES & INTERFACES ---

interface ActionWidgetProps {
    onPrimary: (note: string) => void;
    primaryLabel: string;
    primaryColor?: 'indigo' | 'green' | 'orange' | 'teal';
    onSecondary?: (note: string) => void;
    secondaryLabel?: string;
    placeholder?: string;
    t: any;
    onAdjust?: () => void; 
}

interface RoleButtonProps {
    icon: React.ReactNode;
    label: string;
    color: 'blue' | 'indigo' | 'green' | 'orange' | 'teal' | 'red';
    onClick: () => void;
    count?: number;
}

interface SearchFilterBarProps {
    searchTerm: string;
    onSearch: (term: string) => void;
    onExport: () => void;
    onBackup: () => void;
    count: number;
    t: any;
    dateFrom: string;
    setDateFrom: (v: string) => void;
    dateTo: string;
    setDateTo: (v: string) => void;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
}

interface RoleHeaderProps {
    user: UserProfile;
    onLogout: () => void;
    t: any;
    lang: 'ar' | 'en';
    setLang: (lang: 'ar' | 'en') => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateSerialNumber = () => `SO-${Math.floor(100000 + Math.random() * 900000)}`;
const INPUT_CLASS = "w-full px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-500 text-white bg-gray-800 font-medium shadow-sm font-['Alexandria']";

const calculateDuration = (startISO: string, endISO: string) => {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return "0m";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const SearchableSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    className,
    strict 
}: { 
    options: any[], 
    value: string, 
    onChange: (val: string) => void, 
    placeholder?: string,
    className?: string,
    strict?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedOptions = (options || []).map(o => typeof o === 'string' ? o : (o?.name || String(o)));
    const filtered = normalizedOptions.filter(o => (o || '').toLowerCase().includes((value || '').toLowerCase()));
  
    return (
      <div className="relative group">
        <div className="relative">
          <input
              className={`${className || INPUT_CLASS} ltr:pr-10 rtl:pl-10 rtl:pr-4`}
              value={value}
              onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                setTimeout(() => {
                    setIsOpen(false);
                    if (strict && value) {
                        const exactMatch = normalizedOptions.find(opt => opt.toLowerCase() === value.toLowerCase());
                        if (!exactMatch) {
                            onChange('');
                        } else {
                            onChange(exactMatch);
                        }
                    }
                }, 200);
              }}
              placeholder={placeholder}
          />
          <button 
              type="button"
              className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-blue-600 transition-colors focus:outline-none"
              onMouseDown={(e) => {
                 e.preventDefault();
                 setIsOpen(!isOpen);
              }}
              tabIndex={-1}
          >
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-50 w-full bg-gray-800 mt-1 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 left-0">
              {filtered.map((opt, i) => (
                  <div 
                      key={i} 
                      className="px-4 py-3 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 border-b border-gray-700 last:border-0 font-medium transition-colors"
                      onMouseDown={(e) => {
                          e.preventDefault();
                          onChange(opt);
                          setIsOpen(false);
                      }}
                  >
                      {opt}
                  </div>
              ))}
          </div>
        )}
      </div>
    );
};

const StatusBadge = ({ status, t }: { status?: OrderStatus, t: any }) => {
  const styles = {
    'Pending Assistant': 'bg-indigo-900/30 text-indigo-300 border-indigo-800',
    'Pending Finance': 'bg-purple-900/30 text-purple-300 border-purple-800',
    'Approved': 'bg-green-900/30 text-green-300 border-green-800', 
    'Ready for Driver': 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
    'Partially Shipped': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'In Transit': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'Completed': 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
    'Rejected': 'bg-red-900/30 text-red-300 border-red-800',
    'On Hold': 'bg-orange-900/30 text-orange-300 border-orange-800',
    'Emergency': 'bg-red-600 text-white border-red-500 animate-pulse',
    'Canceled': 'bg-gray-700 text-gray-400 border-gray-600',
  };
  
  const statusKeyMap: Record<string, string> = {
      'Pending Assistant': 'status_pendingAssistant',
      'Pending Finance': 'status_pendingFinance',
      'Approved': 'status_approved',
      'Rejected': 'status_rejected',
      'Ready for Driver': 'status_readyDriver',
      'Partially Shipped': 'status_partiallyShipped',
      'In Transit': 'status_inTransit',
      'Completed': 'status_completed',
      'On Hold': 'status_onHold',
      'Emergency': 'status_emergency',
      'Canceled': 'status_canceled'
  };

  const style = status ? styles[status] : 'bg-gray-700 text-gray-300';
  const label = status ? t[statusKeyMap[status]] || status : status;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style} whitespace-nowrap font-['Alexandria']`}>
      {label}
    </span>
  );
};

const CompanyLogo: React.FC<{large?: boolean, theme?: 'light' | 'dark'}> = ({ large, theme }) => (
  <div className={`flex flex-col items-center justify-center ${large ? 'scale-100' : 'scale-90'}`}>
    {large ? (
      <img 
        src="https://iili.io/fcc8Wut.png" 
        alt="IFCG Logo" 
        className="h-24 object-contain" 
      />
    ) : (
      <span className={`font-black tracking-tighter text-blue-500 leading-none text-2xl`}>
        IFCG
      </span>
    )}
  </div>
);

const RoleButton: React.FC<RoleButtonProps> = ({ icon, label, color, onClick, count }) => { const colorClasses: Record<string, string> = { blue: 'text-blue-400 bg-blue-900/20 border-blue-900 hover:bg-blue-900/40 group-hover:text-blue-300', indigo: 'text-indigo-400 bg-indigo-900/20 border-indigo-900 hover:bg-indigo-900/40 group-hover:text-indigo-300', green: 'text-green-400 bg-green-900/20 border-green-900 hover:bg-green-900/40 group-hover:text-green-300', orange: 'text-orange-400 bg-orange-900/20 border-orange-900 hover:bg-orange-900/40 group-hover:text-orange-300', teal: 'text-teal-400 bg-teal-900/20 border-teal-900 hover:bg-teal-900/40 group-hover:text-teal-300', red: 'text-red-400 bg-red-900/20 border-red-900 hover:bg-red-900/40 group-hover:text-red-300' }; return (<button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-700 hover:border-gray-600 bg-gray-800 shadow-sm hover:shadow-md transition-all group relative"><div className="flex items-center gap-4"><div className={`p-2 rounded-lg border ${colorClasses[color]}`}>{icon}</div><span className="font-bold text-white text-lg font-['Alexandria']">{label}</span></div><div className="flex items-center gap-2">{count !== undefined && count > 0 && (<span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse shadow-red-900/50 shadow-lg">{count}</span>)}<Lock className="w-4 h-4 text-gray-600" /><ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-500 rtl:rotate-180" /></div></button>); };
const LoginModal: React.FC<{ role: Role; onClose: () => void; onSuccess: (user: UserProfile) => void; t: any }> = ({ role, onClose, onSuccess, t }) => { const [code, setCode] = useState(''); const [error, setError] = useState(false); const [showPin, setShowPin] = useState(false); const inputRef = useRef<HTMLInputElement>(null); useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []); const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const user = getUserByPin(code); if (user && user.role === role) { onSuccess(user); } else { setError(true); setCode(''); } }; const roleTitles: Record<string, string> = { sales: t.role_sales, assistant: t.role_assistant, finance: t.role_finance, warehouse: t.role_warehouse, driver_supervisor: t.role_driver_supervisor, truck_driver: t.role_truck_driver }; return (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"><div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-700"><div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center"><h3 className="font-bold text-lg text-white font-['Alexandria']">{role ? roleTitles[role] : ''}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-600 transition-colors"><X className="w-5 h-5"/></button></div><form onSubmit={handleSubmit} className="p-6"><div className="mb-6"><label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t.accessCode}</label><div className="relative"><KeyRound className="absolute right-3 top-3 w-5 h-5 text-gray-400" /><input ref={inputRef} type={showPin ? "text" : "password"} value={code} onChange={e => { setCode(e.target.value); setError(false); }} className={`${INPUT_CLASS} pr-10 pl-10 text-center tracking-widest text-lg`} placeholder={t.enterPin} /><button type="button" onClick={() => setShowPin(!showPin)} className="absolute left-3 top-3 text-gray-400 hover:text-gray-200 transition-colors z-10">{showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>{error && <p className="text-red-500 text-xs mt-2 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {t.invalidCode}</p>}</div><button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">{t.accessDashboard}</button></form></div></div>); };

const RoleHeader = ({ user, onLogout, t, lang, setLang }: RoleHeaderProps) => (
  <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 backdrop-blur-md bg-gray-900/80">
      <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
              <div className="hidden sm:block">
                <CompanyLogo />
              </div>
              <div className="hidden sm:block h-8 w-px bg-gray-800 mx-2" />
              <div className="flex flex-col min-w-0">
                  <div className="text-[10px] sm:text-xs font-black text-blue-500 uppercase tracking-widest truncate">
                    {user.isAdmin ? 'System Admin' : t[`role_${user.role}`]}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-gray-200 truncate">
                    {user.name}
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
                className="w-10 h-10 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 transition-all active:scale-95 flex items-center justify-center shadow-lg group"
                title={lang === 'ar' ? 'Change to English' : 'تغيير للغة العربية'}
              >
                  <Languages className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
              <button onClick={onLogout} className="p-2.5 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 transition-all active:scale-95 group" title={t.logout}>
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
      </div>
  </header>
);

const NotificationBanner = ({ count, t, adminAlerts }: { count: number, t: any, adminAlerts: SalesOrder[] }) => {
    const recentAlerts = adminAlerts.filter(alert => {
        if (!alert.adminEmergencyTimestamp) return false;
        const alertTime = new Date(alert.adminEmergencyTimestamp).getTime();
        const now = new Date().getTime();
        return (now - alertTime) < (24 * 60 * 60 * 1000); 
    });

    return (
        <div className="space-y-0.5">
            {recentAlerts.length > 0 && recentAlerts.map(alert => (
                <div key={alert.id} className="bg-red-600/20 border-b border-red-500/30 py-3 px-4 animate-in slide-in-from-top duration-500">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-red-400">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        <p className="text-sm font-bold">{t.admin_notification.replace('{id}', alert.serialNumber).replace('{name}', alert.history?.find(h => h.role === 'System Admin')?.user || 'Admin')}</p>
                    </div>
                </div>
            ))}
            {count > 0 && (
                <div className="bg-blue-600/10 border-b border-blue-500/20 py-3 px-4 animate-in slide-in-from-top duration-500">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 text-blue-400">
                        <Siren className="w-5 h-5 animate-pulse" />
                        <p className="text-sm font-bold">{t.notificationMsg} ({count})</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-800">
    <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

const EmergencyModal = ({ onClose, onSubmit, t, isAdminOverride }: { onClose: () => void, onSubmit: (report: EmergencyReport) => void, t: any, isAdminOverride?: boolean }) => {
    const [details, setDetails] = useState('');
    return (
        <div className="fixed inset-0 z-[110] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className={`bg-gray-800 border-2 ${isAdminOverride ? 'border-purple-600' : 'border-red-600'} p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95`}>
                <div className="text-center mb-6">
                    <div className={`${isAdminOverride ? 'bg-purple-900/30' : 'bg-red-900/30'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
                        {isAdminOverride ? <ShieldAlert className="w-10 h-10 text-purple-500" /> : <AlertTriangle className="w-10 h-10 text-red-500" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{isAdminOverride ? t.admin_action_emergency : t.reportEmergency}</h2>
                    <p className="text-gray-400 text-sm mt-2">{isAdminOverride ? t.admin_emergency_desc : t.emergencyDetails}</p>
                </div>
                <textarea 
                  autoFocus 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  placeholder={isAdminOverride ? t.admin_reason_placeholder : t.reasonChange} 
                  className={`${INPUT_CLASS} min-h-[120px] mb-6 ${isAdminOverride ? 'border-purple-900/50 focus:border-purple-600' : 'border-red-900/50 focus:border-red-600'}`} 
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white font-bold">{t.cancel}</button>
                    <button 
                      onClick={() => details.trim() && onSubmit({date: new Date().toLocaleString(), details, hasImage: false, resolved: false})} 
                      className={`flex-[2] ${isAdminOverride ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/40' : 'bg-red-600 hover:bg-red-700 shadow-red-900/40'} text-white py-3 rounded-xl font-bold shadow-lg`}
                    >
                      {t.submitOrder}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminTransferModal = ({ onClose, onTransfer, t }: { onClose: () => void, onTransfer: (customerName: string, reason: string) => void, t: any }) => {
    const [reason, setReason] = useState('');
    const [newCustomer, setNewCustomer] = useState('');

    return (
        <div className="fixed inset-0 z-[110] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gray-800 border-2 border-blue-600 p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><RefreshCw className="w-10 h-10 text-blue-500" /></div>
                    <h2 className="text-2xl font-bold text-white">{t.admin_transfer_to}</h2>
                </div>
                <div className="mb-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 block mb-2">{t.admin_select_new_client}</label>
                    <SearchableSelect 
                        options={CUSTOMER_LIST} 
                        placeholder={t.selectClient} 
                        value={newCustomer} 
                        onChange={setNewCustomer} 
                    />
                </div>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  placeholder={t.admin_reason_placeholder} 
                  className={`${INPUT_CLASS} min-h-[100px] mb-6 border-blue-900/50 focus:border-blue-600`} 
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-400 hover:text-white font-bold">{t.cancel}</button>
                    <button 
                      disabled={!reason.trim() || !newCustomer.trim()}
                      onClick={() => onTransfer(newCustomer, reason)} 
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40 disabled:opacity-50"
                    >
                      {t.confirmed}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SearchFilterBar = ({ 
    searchTerm, onSearch, onExport, onBackup, count, t, 
    dateFrom, setDateFrom, dateTo, setDateTo, statusFilter, setStatusFilter 
}: SearchFilterBarProps) => {
    const statuses = [
        'All', 'Pending Assistant', 'Pending Finance', 'Approved', 
        'Rejected', 'Ready for Driver', 'Partially Shipped', 'In Transit', 
        'Completed', 'On Hold', 'Canceled'
    ];

    return (
        <div className="space-y-3 mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute ltr:left-3 rtl:right-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input value={searchTerm} onChange={(e) => onSearch(e.target.value)} placeholder={t.searchPlaceholder} className={`${INPUT_CLASS} ltr:pl-10 rtl:pr-10 bg-gray-800/50`} />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={onBackup} className="flex-1 md:flex-none p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors" title="Backup Database"><Save className="w-5 h-5 mx-auto" /></button>
                    <button onClick={onExport} className="flex-[2] md:flex-none px-4 py-3 bg-green-600/10 text-green-400 border border-green-600/20 rounded-xl font-bold text-sm hover:bg-green-600/20 transition-all flex items-center justify-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" /> {t.exportExcel}
                    </button>
                    <div className="bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl px-4 flex items-center justify-center font-bold text-sm min-w-[3rem]">
                        {count}
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-800/50 p-2.5 rounded-2xl border border-gray-700/50 grid grid-cols-3 gap-2 sm:gap-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 truncate block">From Date</label>
                    <div className="relative">
                        <Calendar className="absolute ltr:left-2 rtl:right-2 top-2 w-3.5 h-3.5 text-gray-500 pointer-events-none hidden xs:block" />
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl py-1.5 ltr:pl-2 xs:ltr:pl-8 rtl:pr-2 xs:rtl:pr-8 text-[10px] text-white outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 truncate block">To Date</label>
                    <div className="relative">
                        <Calendar className="absolute ltr:left-2 rtl:right-2 top-2 w-3.5 h-3.5 text-gray-500 pointer-events-none hidden xs:block" />
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl py-1.5 ltr:pl-2 xs:ltr:pl-8 rtl:pr-2 xs:rtl:pr-8 text-[10px] text-white outline-none focus:border-blue-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 truncate block">Status</label>
                    <div className="relative">
                        <Filter className="absolute ltr:left-2 rtl:right-2 top-2 w-3.5 h-3.5 text-gray-500 pointer-events-none hidden xs:block" />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl py-1.5 ltr:pl-2 xs:ltr:pl-8 rtl:pr-2 xs:rtl:pr-8 text-[10px] text-white outline-none focus:border-blue-500 appearance-none">
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute ltr:right-2 rtl:left-2 top-2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}

const OrderAdjustmentForm: React.FC<{ order: SalesOrder, onSave: (items: OrderItem[]) => void, onCancel: () => void, t: any, borderColor?: string }> = ({ order, onSave, onCancel, t, borderColor = "border-orange-500" }) => {
    const [items, setItems] = useState<OrderItem[]>(() => {
        return order.items.map(item => ({
            ...item,
            originalQuantity: item.originalQuantity ?? item.quantity
        }));
    });

    return (
        <div className={`bg-gray-800 p-6 rounded-2xl border-2 ${borderColor} shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2`}>
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Pencil className="w-5 h-5" /> {t.adjustQuantities}</h3>
            </div>
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={item.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-gray-200 font-bold text-sm leading-tight flex-1">{item.itemName}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-24 shrink-0">
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">{t.qty} (Max: {item.originalQuantity})</label>
                                <input 
                                    type="number" 
                                    value={item.quantity} 
                                    min="0"
                                    max={item.originalQuantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const ceiling = item.originalQuantity ?? item.quantity;
                                        const newVal = Math.min(Math.max(0, val), ceiling);
                                        const n = [...items]; 
                                        n[idx].quantity = newVal; 
                                        setItems(n);
                                    }} 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg h-10 px-2 text-center text-white font-bold focus:border-blue-500 outline-none" 
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">{t.reasonChange}</label>
                                <input value={item.notes || ''} onChange={(e) => {const n = [...items]; n[idx].notes = e.target.value; setItems(n);}} className="w-full bg-gray-800 border border-gray-700 rounded-lg h-10 px-3 text-xs text-gray-300" placeholder="..." />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onCancel} className="flex-1 py-3 text-gray-500 hover:text-gray-300 font-bold">{t.cancel}</button>
              <button onClick={() => onSave(items)} className={`flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg`}>{t.saveChanges}</button>
            </div>
        </div>
    );
};

const OrderCard: React.FC<{ order: SalesOrder, t: any, actions?: React.ReactNode, onViewImage?: (url: string) => void }> = ({ order, t, actions, onViewImage }) => {
    const [showHistory, setShowHistory] = useState(false);
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className={`bg-gray-800 rounded-2xl border ${order.adminEmergencyActive ? 'border-red-500 ring-2 ring-red-500 ring-opacity-20' : 'border-gray-700'} shadow-sm overflow-hidden group hover:border-gray-600 transition-all`}>
            {order.adminEmergencyActive && (
              <div className="bg-red-500/10 border-b border-red-500/30 p-2.5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t.admin_emergency_title}</span>
              </div>
            )}
            <div className="p-4 sm:p-5">
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <StatusBadge status={order.status} t={t} />
                           <span className="text-xs font-mono text-gray-500 font-bold">{order.serialNumber}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">{order.customerName}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                           <MapPin className="w-3 h-3 text-blue-500" />
                           <span className="font-medium">{order.areaLocation}</span>
                           <span className="mx-1">•</span>
                           <Calendar className="w-3 h-3 text-indigo-500" />
                           <span className="font-medium">{order.receivingDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase mt-1">
                            <Truck className="w-3 h-3" />
                            <span>{order.deliveryType === 'Outsource' ? t.outsource : t.ownCars}</span>
                        </div>
                    </div>
                    <div className="ltr:text-right rtl:text-left bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-700/50">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.totalQty}</div>
                        <div className="text-xl font-black text-blue-500 leading-none">{totalQty} <span className="text-[10px] text-gray-500 font-bold uppercase">{t.qty}</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ShoppingCart className="w-3 h-3" /> {t.itemsList}
                        </div>
                        <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/30 space-y-3">
                           {order.items.map((item, idx) => {
                               const isAdjusted = item.originalQuantity !== undefined && item.originalQuantity !== item.quantity;
                               return (
                                   <div key={idx} className="flex flex-col border-b border-gray-800/50 pb-3 last:border-0 last:pb-0">
                                       <div className="flex justify-between items-start mb-1 gap-4">
                                           <span className="text-gray-300 font-bold text-sm leading-relaxed">{item.itemName}</span>
                                           {isAdjusted && (
                                               <span className="bg-orange-600/10 text-orange-400 border border-orange-600/20 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter shrink-0">{t.qtyAdjusted}</span>
                                           )}
                                       </div>
                                       <div className="flex items-center gap-3">
                                           <span className="bg-gray-800 text-white font-black px-3 py-1 rounded text-base border border-gray-700 shadow-sm">x{item.quantity}</span>
                                           {isAdjusted && (
                                               <div className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                                   <span>{t.oldQty}: <span className="line-through">{item.originalQuantity}</span></span>
                                                   <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                                   <span className="text-orange-400">{t.newQty}: {item.quantity}</span>
                                               </div>
                                           )}
                                       </div>
                                       {item.notes && <p className="text-[10px] text-yellow-500/80 mt-1.5 italic font-medium bg-yellow-900/10 px-2 py-1 rounded border border-yellow-900/20">"{item.notes}"</p>}
                                   </div>
                               );
                           })}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {order.overallNotes && (
                             <div className="bg-indigo-900/10 border border-indigo-900/30 rounded-xl p-3">
                                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.overallNotes}</div>
                                 <p className="text-xs text-gray-300 italic">"{order.overallNotes}"</p>
                             </div>
                         )}
                         {order.warehouseNote && (
                             <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 ring-1 ring-orange-500/20 animate-in fade-in zoom-in-95">
                                 <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Package className="w-3 h-3" /> {t.noteWarehouse}
                                 </div>
                                 <p className="text-xs text-gray-100 font-bold italic">"{order.warehouseNote}"</p>
                             </div>
                         )}
                         {order.adminEmergencyNote && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 animate-in fade-in zoom-in-95">
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                   <ShieldAlert className="w-3 h-3" /> ADMIN EMERGENCY REASON
                                </div>
                                <p className="text-xs text-gray-100 font-bold italic">"{order.adminEmergencyNote}"</p>
                            </div>
                         )}
                         {order.shipments && order.shipments.length > 0 && (
                             <div className="bg-teal-900/10 border border-teal-900/30 rounded-xl p-3">
                                 <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2">{t.noteDriver}</div>
                                 <div className="space-y-2">
                                     {order.shipments.map(s => (
                                         <div key={s.id} className="flex flex-col border-b border-teal-900/30 last:border-0 pb-2 last:pb-0">
                                             <div className="flex justify-between items-center mb-1">
                                                 <span className="text-gray-200 font-bold text-xs">{s.driverName}</span>
                                                 <div className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${s.status === 'Delivered' ? 'bg-green-900 text-green-400' : 'bg-teal-900 text-teal-400'}`}>
                                                     {s.status}
                                                 </div>
                                             </div>
                                             <span className="text-[10px] text-gray-500">{s.warehouseLocation} @ {s.dispatchTime}</span>
                                             {s.deliveryPhoto && (
                                                <div className="mt-1 relative group inline-block">
                                                   <img 
                                                     src={s.deliveryPhoto} 
                                                     alt="Proof" 
                                                     onClick={() => onViewImage?.(s.deliveryPhoto!)}
                                                     className="w-16 h-10 object-cover rounded border border-gray-700 cursor-zoom-in hover:brightness-110 transition-all" 
                                                   />
                                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                                   </div>
                                                </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-bold text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
                        <History className="w-3 h-3" /> {showHistory ? 'Hide History' : 'Show History'}
                    </button>
                    {showHistory && (
                        <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                            {order.history?.map((h, i) => (
                                <div key={i} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{h.role}</div>
                                        <p className="text-xs text-gray-200 font-medium">{h.action}</p>
                                        <div className="text-[10px] text-gray-500 font-bold">{t.by} {h.user}</div>
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-mono whitespace-nowrap">{h.date}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {actions}
            </div>
        </div>
    );
};

const ActionWidget = ({ onPrimary, primaryLabel, primaryColor = 'indigo', onSecondary, secondaryLabel, placeholder, t, onAdjust }: ActionWidgetProps) => {
    const [note, setNote] = useState('');
    const btnColors = {
        indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40',
        green: 'bg-green-600 hover:bg-green-700 shadow-green-900/40',
        orange: 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/40',
        teal: 'bg-teal-600 hover:bg-teal-700 shadow-teal-900/40',
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <div className="relative">
                <FileText className="absolute ltr:left-3 rtl:right-3 top-3 w-4 h-4 text-gray-500" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder || t.addNote} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 ltr:pl-9 rtl:pr-9 text-xs font-medium text-gray-200 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="flex gap-2">
                <button onClick={() => { onPrimary(note); setNote(''); }} className={`flex-[2] py-2.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${btnColors[primaryColor]}`}>
                    <CheckCircle2 className="w-4 h-4" /> {primaryLabel}
                </button>
                {onAdjust && (
                  <button onClick={onAdjust} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white border border-gray-600 font-bold text-sm hover:bg-gray-600 transition-all flex items-center justify-center gap-2">
                      <Pencil className="w-4 h-4" /> {t.adjust}
                  </button>
                )}
                {onSecondary && (
                    <button onClick={() => { onSecondary(note); setNote(''); }} className="flex-1 py-2.5 rounded-xl bg-red-900/20 text-red-400 border border-red-900/30 font-bold text-sm hover:bg-red-900/40 transition-all flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" /> {secondaryLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

const WarehouseActions = ({ onReady, onHold, onReject, onEdit, t, deliveryType }: { onReady: (n: string) => void, onHold: (n: string) => void, onReject: (n: string) => void, onEdit: () => void, t: any, deliveryType?: string }) => {
    const [note, setNote] = useState('');
    const isOutsource = deliveryType === 'Outsource';
    
    return (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.warehouseNote} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-xs font-medium text-gray-200" />
            <div className="grid grid-cols-2 gap-2">
                <button onClick={onEdit} className="py-2.5 rounded-xl bg-gray-700 text-white font-bold text-xs hover:bg-gray-600 flex items-center justify-center gap-2"><Pencil className="w-3 h-3" /> {t.adjust}</button>
                <button onClick={() => onHold(note)} className="py-2.5 rounded-xl border border-orange-900/50 text-orange-400 font-bold text-xs hover:bg-orange-900/20 flex items-center justify-center gap-2"><PauseCircle className="w-3 h-3" /> {t.hold}</button>
                <button onClick={() => onReject(note)} className="py-2.5 rounded-xl border border-red-900/50 text-red-400 font-bold text-xs hover:bg-red-900/20 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> {t.reject}</button>
                <button onClick={() => onReady(note)} className={`py-2.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isOutsource ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/40'}`}>
                    <Check className="w-3 h-3" /> {isOutsource ? t.markDelivered : t.markReady}
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = TRANSLATIONS[lang];

  useEffect(() => {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.documentElement.classList.add('dark');
  }, [lang]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [globalOrders, setGlobalOrders] = useState<SalesOrder[]>([]);
  const [loginTargetRole, setLoginTargetRole] = useState<Role | null>(null);
  const [salesView, setSalesView] = useState<'entry' | 'history'>('entry');
  const [assistantView, setAssistantView] = useState<'pending' | 'history'>('pending');
  const [financeView, setFinanceView] = useState<'pending' | 'history'>('pending');
  const [warehouseView, setWarehouseView] = useState<'pending' | 'history'>('pending');
  const [driverView, setDriverView] = useState<'ready' | 'history'>('ready');
  const [truckDriverView, setTruckDriverView] = useState<'trips' | 'history'>('trips');
  const [counts, setCounts] = useState({ assistant: 0, finance: 0, warehouse: 0, driverSupervisor: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseEditingId, setWarehouseEditingId] = useState<string | null>(null);
  const [financeEditingId, setFinanceEditingId] = useState<string | null>(null);
  const [driverAdjustingId, setDriverAdjustingId] = useState<string | null>(null);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const [reassignShipment, setReassignShipment] = useState<{orderId: string, shipment: Shipment} | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<{open: boolean, shipmentId?: string, orderId?: string}>({open: false});
  const [adminEmergencyModalOpen, setAdminEmergencyModalOpen] = useState<{open: boolean, orderId?: string, action?: 'cancel' | 'transfer'}>({open: false});
  const [adminTransferModalOpen, setAdminTransferModalOpen] = useState<{open: boolean, orderId?: string}>({open: false});
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);
  const [pendingDeliveryPhoto, setPendingDeliveryPhoto] = useState<{orderId: string, shipmentId: string} | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  const [order, setOrder] = useState<SalesOrder>({
    customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber(), adminEmergencyNote: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  const initiateLogin = (role: Role) => setLoginTargetRole(role);
  const handleLoginSuccess = (user: UserProfile) => { setCurrentUser(user); setLoginTargetRole(null); };

  const handleAdjustItems = (orderId: string, newItems: OrderItem[], roleName: string) => {
    setGlobalOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const trackedItems = newItems.map(item => {
            const prevItem = o.items.find(pi => pi.id === item.id);
            return { ...item, originalQuantity: prevItem?.originalQuantity ?? prevItem?.quantity ?? item.quantity };
        });
        return {
            ...o, items: trackedItems,
            history: [...(o.history || []), { role: roleName, action: 'Adjusted Quantities only and added notes', date: new Date().toLocaleString(), user: currentUser?.name || 'Unknown' }]
        };
    }));
    setWarehouseEditingId(null);
    setFinanceEditingId(null);
    setDriverAdjustingId(null);
  };

  const handleAdminEmergencyAction = (orderId: string, action: 'cancel' | 'transfer', reason: string, newCustomerName?: string) => {
    setGlobalOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const history = [...(o.history || [])];
        const nowStr = new Date().toISOString();
        let newStatus: OrderStatus = 'Completed'; 
        let updatedCustomerName = o.customerName;
        let updatedAreaLocation = o.areaLocation;
        
        if (action === 'cancel') {
            newStatus = 'Canceled';
            history.push({ role: 'System Admin', action: `EMERGENCY CANCEL: ${reason}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
        } else if (action === 'transfer' && newCustomerName) {
            newStatus = 'Completed';
            updatedCustomerName = newCustomerName;
            const foundCust = CUSTOMER_LIST.find(c => c.name === newCustomerName);
            if (foundCust) updatedAreaLocation = foundCust.location;
            history.push({ role: 'System Admin', action: `EMERGENCY TRANSFER to client ${newCustomerName}: ${reason}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
        }

        return {
            ...o,
            status: newStatus,
            customerName: updatedCustomerName,
            areaLocation: updatedAreaLocation,
            adminEmergencyNote: reason,
            adminEmergencyActive: true,
            adminEmergencyTimestamp: nowStr,
            history: history
        };
    }));
    setAdminEmergencyModalOpen({ open: false });
    setAdminTransferModalOpen({ open: false });
  };

  useEffect(() => {
    const saved = localStorage.getItem('ifcg_global_orders_v15');
    if (saved) { try { setGlobalOrders(JSON.parse(saved)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    localStorage.setItem('ifcg_global_orders_v15', JSON.stringify(globalOrders));
    setCounts({
        assistant: globalOrders.filter(o => o.status === 'Pending Assistant').length,
        finance: globalOrders.filter(o => o.status === 'Pending Finance').length,
        warehouse: globalOrders.filter(o => o.status === 'Approved' || o.status === 'On Hold').length,
        driverSupervisor: globalOrders.filter(o => o.status === 'Ready for Driver' || o.status === 'Partially Shipped' || (o.status === 'On Hold' && !!o.shipments?.some(s => s.status === 'Emergency'))).length,
    });
  }, [globalOrders]);

  useEffect(() => {
      setSearchTerm(''); setDateFrom(''); setDateTo(''); setStatusFilter('All');
  }, [salesView, assistantView, financeView, warehouseView, driverView, currentUser]);

  const handleBackup = () => {
    const dataStr = JSON.stringify(globalOrders, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IFCG_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportToCSV = (orders: SalesOrder[]) => {
      if (!orders || orders.length === 0) return;
      const headers = ['Serial No', 'Order Date', 'Receiving Date', 'Shift', 'Delivery Type', 'Customer', 'Location', 'Status', 'Created By', 'Total Qty', 'Items Details', 'Shipment Details', 'Warehouse Note', 'Admin Emergency Note', 'Full History Log'];
      const rows = orders.map(o => {
          const historyLog = (o.history || []).map(h => `[${h.date}] ${h.role} (${h.user}): ${h.action}`).join(' | ');
          const itemsDetail = (o.items || []).map(i => `${i.itemName} (x${i.quantity})${i.notes ? ` [Note: ${i.notes}]` : ''}`).join('; ');
          const shipmentDetail = (o.shipments || []).map(s => `${s.driverName} (${s.carNumber}) - ${s.status} [At: ${s.warehouseLocation} ${s.dispatchTime}]`).join('; ');
          const totalQty = (o.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
          return [o.serialNumber || 'N/A', o.orderDate || 'N/A', o.receivingDate || 'N/A', o.deliveryShift || 'N/A', o.deliveryType || 'Own Cars', o.customerName || 'N/A', o.areaLocation || 'N/A', o.status || 'N/A', o.creatorName || 'N/A', totalQty, itemsDetail || 'None', shipmentDetail || 'None', o.warehouseNote || '', o.adminEmergencyNote || '', historyLog || 'No History'].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',');
      });
      const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `IFCG_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const filterOrders = (orders: SalesOrder[]) => {
      let result = orders;
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          result = result.filter(o => (o.customerName?.toLowerCase() || '').includes(lowerTerm) || (o.serialNumber?.toLowerCase() || '').includes(lowerTerm));
      }
      if (dateFrom) result = result.filter(o => o.orderDate >= dateFrom);
      if (dateTo) result = result.filter(o => o.orderDate <= dateTo);
      if (statusFilter && statusFilter !== 'All') result = result.filter(o => o.status === statusFilter);
      return result;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, roleName: string, actionNote: string) => {
    setGlobalOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const isWarehouse = roleName === 'Warehouse';
        let finalStatus = newStatus;
        if (isWarehouse && newStatus === 'Ready for Driver' && o.deliveryType === 'Outsource') finalStatus = 'Completed';
        return {
            ...o, status: finalStatus, warehouseNote: isWarehouse ? actionNote : o.warehouseNote,
            history: [...(o.history || []), { role: roleName, action: (isWarehouse && finalStatus === 'Completed') ? 'Marked Delivered (Outsource)' : actionNote, date: new Date().toLocaleString(), user: currentUser?.name || 'Unknown' }]
        };
    }));
  };

  const createShipment = (orderId: string, shipmentData: Shipment) => {
      setGlobalOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          const newShipments = [...(o.shipments || []), shipmentData];
          const totalOrdered = o.items.reduce((sum, i) => sum + i.quantity, 0);
          const totalShipped = newShipments.reduce((sum, s) => s.status === 'Emergency' ? sum : sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);
          const status: OrderStatus = totalShipped >= totalOrdered ? 'In Transit' : 'Partially Shipped';
          return {
              ...o, status: status, shipments: newShipments,
              history: [...(o.history || []), { role: 'Driver Supervisor', action: `Dispatched Shipment to ${shipmentData.driverName}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Logistics' }]
          };
      }));
      setDispatchingOrderId(null);
  };

  const handleReassignDriver = (newDriver: Shipment) => {
      if(!reassignShipment) return;
      setGlobalOrders(prev => prev.map(o => {
          if (o.id !== reassignShipment.orderId) return o;
          const updatedShipments = o.shipments?.map(s => {
              if (s.id !== reassignShipment.shipment.id) return s;
              return { ...s, driverName: newDriver.driverName, driverPhone: newDriver.driverPhone, carNumber: newDriver.carNumber, dispatchTime: newDriver.dispatchTime, status: 'Assigned', emergency: undefined } as Shipment;
          });
          return {
              ...o, status: 'In Transit', shipments: updatedShipments,
              history: [...(o.history || []), { role: 'Driver Supervisor', action: `RE-ASSIGNED: Trip transferred from ${reassignShipment.shipment.driverName} to ${newDriver.driverName}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Logistics' }]
          };
      }));
      setReassignShipment(null);
  }

  const handleDriverAction = (orderId: string, shipmentId: string, action: 'Picked Up' | 'Delivered', photo?: string) => {
      const now = new Date().toISOString();
      setGlobalOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          let newStatus = o.status;
          let historyMessage = `Shipment ${action}`;
          const updatedShipments = o.shipments?.map(s => {
              if (s.id !== shipmentId) return s;
              if (action === 'Picked Up') return { ...s, status: action, actualPickupTime: now };
              if (action === 'Delivered') {
                  if (s.actualPickupTime) {
                      const duration = calculateDuration(s.actualPickupTime, now);
                      historyMessage += ` (Trip Duration: ${duration})`;
                  }
                  return { ...s, status: action, deliveryPhoto: photo };
              }
              return s;
          });
          if (action === 'Delivered') {
              const allDelivered = updatedShipments?.every(s => s.status === 'Delivered');
              const totalOrdered = o.items.reduce((sum, i) => sum + i.quantity, 0);
              const totalShipped = updatedShipments?.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0) || 0;
              if (allDelivered && totalShipped >= totalOrdered) newStatus = 'Completed';
          }
          return {
              ...o, status: newStatus, shipments: updatedShipments as Shipment[],
              history: [...(o.history || []), { role: 'Truck Driver', action: historyMessage, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
          };
      }));
      setPendingDeliveryPhoto(null);
  };

  const handleDeliveryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && pendingDeliveryPhoto) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            handleDriverAction(pendingDeliveryPhoto.orderId, pendingDeliveryPhoto.shipmentId, 'Delivered', base64String);
            if (e.target) e.target.value = '';
        };
        reader.readAsDataURL(file);
    } else setPendingDeliveryPhoto(null);
  };

  const handleEmergency = (orderId: string, shipmentId: string, report: EmergencyReport) => {
    setGlobalOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedShipments = o.shipments?.map(s => {
            if (s.id !== shipmentId) return s;
            return { ...s, status: 'Emergency' as const, emergency: report };
        });
        return {
            ...o, status: 'On Hold', shipments: updatedShipments,
            history: [...(o.history || []), { role: 'Truck Driver', action: `EMERGENCY/ACCIDENT: ${report.details}. Requesting Re-Assignment.`, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
        }
    }));
    setEmergencyModalOpen({open: false});
  };

  const handleResolveEmergency = (orderId: string, shipmentId: string) => {
    setGlobalOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedShipments = o.shipments?.map(s => {
            if (s.id !== shipmentId) return s;
            return { ...s, status: 'Picked Up' as const, emergency: undefined };
        });
        return {
            ...o, status: 'In Transit', shipments: updatedShipments,
            history: [...(o.history || []), { role: 'Truck Driver', action: `Emergency Resolved - Resuming Delivery`, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
        }
    }));
  };

  const handleEditOrder = (orderToEdit: SalesOrder) => {
    setOrder({ ...orderToEdit, serialNumber: orderToEdit.serialNumber || generateSerialNumber(), adminEmergencyNote: orderToEdit.adminEmergencyNote || '' });
    setEditingId(orderToEdit.id || null);
    if (currentUser?.role === 'sales') setSalesView('entry');
  };

  const handleGenericSubmit = async () => {
    setValidationError(null);
    if (!order.customerName || !order.areaLocation) { setValidationError(t.validationClient); return; }
    if (!order.receivingDate) { setValidationError(t.validationReceivingDate); return; }
    if (order.items.length === 0) { setValidationError(t.validationItems); return; }
    const invalidItems = order.items.filter(item => !item.itemName.trim() || item.quantity <= 0);
    if (invalidItems.length > 0) { setValidationError(t.validationItemDetails); return; }

    const isAdminEdit = currentUser?.isAdmin && editingId;
    if (isAdminEdit && !order.adminEmergencyNote?.trim()) { setValidationError(t.admin_reason_placeholder); return; }

    setSubmissionStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 800));

    setGlobalOrders(prev => {
        if (editingId) {
            return prev.map(o => {
                if (o.id !== editingId) return o;
                const history = [...(o.history || [])];
                const nowStr = new Date().toISOString();
                const newStatus: OrderStatus = isAdminEdit ? 'Completed' : (currentUser?.role === 'assistant' ? (o.status || 'Pending Assistant') : 'Pending Assistant');
                if (isAdminEdit) history.push({ role: 'System Admin', action: `EMERGENCY EDIT OVERRIDE: ${order.adminEmergencyNote}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
                else if (currentUser?.role === 'assistant') history.push({ role: 'Sales Assistant', action: `Modified Details Snapshot`, date: new Date().toLocaleString(), user: currentUser?.name || 'Assistant' });
                else history.push({ role: 'Sales Supervisor', action: 'Order Updated', date: new Date().toLocaleString(), user: currentUser?.name || 'Sales User' });
                return { ...order, id: editingId, status: newStatus, history, adminEmergencyActive: isAdminEdit ? true : o.adminEmergencyActive, adminEmergencyNote: isAdminEdit ? order.adminEmergencyNote : o.adminEmergencyNote, adminEmergencyTimestamp: isAdminEdit ? nowStr : o.adminEmergencyTimestamp, items: order.items.map(ni => { const oldItem = o.items.find(oi => oi.id === ni.id); return { ...ni, originalQuantity: oldItem?.originalQuantity ?? ni.quantity }; }) };
            });
        } else {
            const newOrder: SalesOrder = { ...order, id: generateId(), serialNumber: order.serialNumber || generateSerialNumber(), status: 'Pending Assistant', createdBy: currentUser?.email, creatorName: currentUser?.name, items: order.items.map(i => ({ ...i, originalQuantity: i.quantity })), history: [{ role: 'Sales Supervisor', action: 'Order Created', date: new Date().toLocaleString(), user: currentUser?.name || 'Sales User' }] };
            return [newOrder, ...prev];
        }
    });

    setSubmissionStatus('success');
    setTimeout(() => {
        setSubmissionStatus('idle');
        setOrder({ customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber(), adminEmergencyNote: '' });
        setEditingId(null);
        if (currentUser?.role !== 'assistant') setSalesView('history'); 
    }, 1500);
  };

  if (!currentUser) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-['Alexandria'] transition-colors duration-300 relative">
              <button onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')} className="absolute top-6 left-6 z-50 p-3 rounded-full bg-gray-800/80 backdrop-blur-md text-white hover:bg-gray-700 border border-gray-600 shadow-xl transition-all hover:scale-105 active:scale-95 group"><Languages className="w-5 h-5 group-hover:rotate-12 transition-transform" /></button>
              <div className="bg-gray-800 p-6 rounded-3xl shadow-xl max-w-md w-full border border-gray-700 relative overflow-hidden">
                  <div className="text-center mb-4"><CompanyLogo large /><h1 className="text-xl font-bold text-white mt-4">{t.loginTitle}</h1><p className="text-sm text-gray-400 mt-1">{t.loginSubtitle}</p></div>
                  <div className="space-y-2">
                      <RoleButton icon={<User className="w-5 h-5" />} label={t.role_sales} color="blue" onClick={() => initiateLogin('sales')} />
                      <RoleButton icon={<Users className="w-5 h-5" />} label={t.role_assistant} color="indigo" onClick={() => initiateLogin('assistant')} count={counts.assistant} />
                      <RoleButton icon={<ShieldCheck className="w-5 h-5" />} label={t.role_finance} color="green" onClick={() => initiateLogin('finance')} count={counts.finance} />
                      <RoleButton icon={<Package className="w-5 h-5" />} label={t.role_warehouse} color="orange" onClick={() => initiateLogin('warehouse')} count={counts.warehouse} />
                      <RoleButton icon={<Truck className="w-5 h-5" />} label={t.role_driver_supervisor} color="teal" onClick={() => initiateLogin('driver_supervisor')} count={counts.driverSupervisor} />
                      <RoleButton icon={<Navigation className="w-5 h-5" />} label={t.role_truck_driver} color="red" onClick={() => initiateLogin('truck_driver')} />
                  </div>
                  <div className="mt-6 text-center text-xs text-gray-500"><p>{t.useCodeMsg}</p></div>
              </div>
              {loginTargetRole && (<LoginModal role={loginTargetRole} onClose={() => setLoginTargetRole(null)} onSuccess={handleLoginSuccess} t={t} />)}
          </div>
      );
  }

  if (currentUser.role === 'truck_driver') {
      const myTrips = globalOrders.filter(o => o.shipments?.some(s => s.driverName === currentUser.name && (s.status === 'Assigned' || s.status === 'Picked Up' || s.status === 'Emergency')));
      const history = globalOrders.filter(o => o.shipments?.some(s => s.driverName === currentUser.name && s.status === 'Delivered'));
      const displayedOrders = (truckDriverView === 'trips' ? myTrips : history).map(o => ({ ...o, shipments: o.shipments?.filter(s => s.driverName === currentUser.name && (truckDriverView === 'trips' ? s.status !== 'Delivered' : s.status === 'Delivered')) })).filter(o => o.shipments && o.shipments.length > 0);
      return (
          <div className="min-h-screen bg-gray-950 pb-20 font-['Alexandria']">
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleDeliveryPhotoUpload} />
              <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleDeliveryPhotoUpload} />
              <RoleHeader user={currentUser} onLogout={() => setCurrentUser(null)} t={t} lang={lang} setLang={setLang} />
              <NotificationBanner count={myTrips.length} t={t} adminAlerts={globalOrders.filter(o => o.adminEmergencyActive)} />
              <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-700">
                    <button onClick={() => setTruckDriverView('trips')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${truckDriverView === 'trips' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_myTrips} ({myTrips.length})</button>
                    <button onClick={() => setTruckDriverView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${truckDriverView === 'history' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_history}</button>
                </div>
              </div>
              <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                  {displayedOrders.length === 0 && <EmptyState message={truckDriverView === 'trips' ? t.emptyTrips : t.emptyHistory} />}
                  {displayedOrders.map(order => (
                      <div key={order.id} className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                          <div className="p-5 border-b border-gray-700 bg-gray-900/40">
                              <div className="flex justify-between items-start">
                                  <div className="space-y-1"><h3 className="text-white font-black text-xl leading-relaxed">{order.customerName}</h3><p className="text-gray-400 text-sm flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-blue-500"/> {order.areaLocation}</p></div>
                                  <div className="text-right"><span className="text-[10px] font-mono text-gray-500 font-bold bg-gray-950 px-2 py-1 rounded border border-gray-800">{order.serialNumber}</span></div>
                              </div>
                              {order.warehouseNote && (<div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-xl"><div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> {t.noteWarehouse}</div><p className="text-xs text-gray-100 font-bold italic">"{order.warehouseNote}"</p></div>)}
                          </div>
                          {order.shipments?.map(shipment => (
                              <div key={shipment.id} className="p-5 space-y-6">
                                  <div className="flex justify-between items-start bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                      <div><div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.warehouse}</div><div className="text-white font-bold">{shipment.warehouseLocation}</div></div>
                                      <div className="text-right"><div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t.dispatchTime}</div><div className="text-white font-bold">{shipment.dispatchTime}</div></div>
                                  </div>
                                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-700"><div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t.shipment}</div><div className="space-y-4">{shipment.items.map((item, idx) => (<div key={idx} className="flex flex-col border-b border-gray-800 pb-3 last:border-0 last:pb-0"><span className="font-bold text-gray-200 mb-2 leading-relaxed">{item.itemName}</span><span className="font-black text-white bg-gray-800 px-4 py-1.5 rounded-lg w-fit text-base border border-gray-700">x{item.quantity}</span></div>))}</div></div>
                                  {truckDriverView === 'history' && shipment.deliveryPhoto && (<div className="bg-gray-900 rounded-xl p-4 border border-gray-700"><div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Delivery Proof</div><img src={shipment.deliveryPhoto} alt="Full Proof" onClick={() => setFullSizeImage(shipment.deliveryPhoto!)} className="w-full h-40 object-cover rounded-xl border border-gray-700 cursor-zoom-in hover:brightness-110 transition-all" /></div>)}
                                  {truckDriverView === 'trips' && (<div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-2xl border border-gray-800"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${shipment.status !== 'Assigned' ? 'bg-green-900/30 text-green-500' : 'bg-blue-900/30 text-blue-400 animate-pulse'}`}>{shipment.status !== 'Assigned' ? <CircleCheck className="w-6 h-6" /> : <Package className="w-6 h-6" />}</div><span className={`font-bold ${shipment.status !== 'Assigned' ? 'text-green-500' : 'text-gray-300'}`}>{t.stepPickup}</span></div><button disabled={shipment.status !== 'Assigned'} onClick={() => handleDriverAction(order.id!, shipment.id, 'Picked Up')} className={`px-6 py-2.5 rounded-xl font-black text-sm shadow-lg ${shipment.status === 'Assigned' ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'}`}>{shipment.status === 'Assigned' ? t.confirmPickup : t.confirmed}</button></div>
                                        <div className={`flex flex-col p-4 rounded-2xl border ${shipment.status === 'Picked Up' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-950 border-gray-900/50 opacity-50 cursor-not-allowed'}`}><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${shipment.status === 'Delivered' ? 'bg-green-900/30 text-green-500' : shipment.status === 'Picked Up' ? 'bg-emerald-900/30 text-emerald-400 animate-pulse' : 'bg-gray-800 text-gray-700'}`}>{shipment.status === 'Delivered' ? <CircleCheck className="w-6 h-6" /> : <Navigation className="w-6 h-6" />}</div><span className={`font-bold ${shipment.status === 'Delivered' ? 'text-green-500' : shipment.status === 'Picked Up' ? 'text-gray-200' : 'text-gray-700'}`}>{t.stepDelivery}</span></div>{shipment.status === 'Picked Up' ? (<div className="flex flex-col gap-2"><button onClick={() => { setPendingDeliveryPhoto({orderId: order.id!, shipmentId: shipment.id}); cameraInputRef.current?.click(); }} className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 w-full sm:w-auto"><Camera className="w-4 h-4" /> {t.takePhoto}</button><button onClick={() => { setPendingDeliveryPhoto({orderId: order.id!, shipmentId: shipment.id}); galleryInputRef.current?.click(); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 w-full sm:w-auto"><LucideImage className="w-4 h-4" /> {t.uploadGallery}</button></div>) : (<button disabled className={`px-6 py-2.5 rounded-xl font-black text-sm shadow-lg ${shipment.status === 'Delivered' ? 'bg-green-800 text-green-400 border border-green-900' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>{shipment.status === 'Delivered' ? t.confirmed : t.actionLocked}</button>)}</div>{shipment.status === 'Picked Up' && (<div className="text-[10px] text-gray-500 font-bold bg-gray-950/50 p-2 rounded-lg border border-gray-800 text-center uppercase tracking-widest"><Lock className="w-3 h-3 inline-block mr-1 mb-0.5" /> {t.photoRequired}</div>)}</div>
                                        {shipment.status === 'Emergency' ? (<button onClick={() => handleResolveEmergency(order.id!, shipment.id)} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 mt-4"><CheckCircle2 className="w-6 h-6" /> {t.emergencyResolved}</button>) : (<button onClick={() => setEmergencyModalOpen({open: true, shipmentId: shipment.id, orderId: order.id!})} className="w-full bg-red-900/20 text-red-500 border border-red-900/30 rounded-2xl font-bold text-sm hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 mt-2"><AlertTriangle className="w-4 h-4" /> {t.reportEmergency}</button>)}
                                    </div>)}
                              </div>
                          ))}
                      </div>
                  ))}
              </main>
              {emergencyModalOpen.open && (<EmergencyModal onClose={() => setEmergencyModalOpen({open: false})} onSubmit={(report) => handleEmergency(emergencyModalOpen.orderId!, emergencyModalOpen.shipmentId!, report)} t={t} />)}
              {fullSizeImage && <FullscreenImage image={fullSizeImage} onClose={() => setFullSizeImage(null)} />}
          </div>
      );
  }

  const getBaseOrders = () => {
    if (!currentUser) return [];
    const all = globalOrders;
    if (currentUser.role === 'sales') return all.filter(o => o.createdBy === currentUser.email);
    if (currentUser.role === 'assistant') return currentUser.isAdmin ? all : (assistantView === 'pending' ? all.filter(o => o.status === 'Pending Assistant') : all.filter(o => o.status !== 'Pending Assistant'));
    if (currentUser.role === 'finance') return financeView === 'pending' ? all.filter(o => o.status === 'Pending Finance') : all.filter(o => o.status !== 'Pending Finance');
    if (currentUser.role === 'warehouse') return warehouseView === 'pending' ? all.filter(o => o.status === 'Approved' || o.status === 'On Hold') : all.filter(o => o.status !== 'Approved' && o.status !== 'On Hold');
    if (currentUser.role === 'driver_supervisor') return driverView === 'ready' ? all.filter(o => o.status === 'Ready for Driver' || o.status === 'Partially Shipped' || (o.status === 'On Hold' && !!o.shipments?.some(s => s.status === 'Emergency'))) : all.filter(o => o.status === 'In Transit' || o.status === 'Completed' || o.status === 'Canceled');
    return all;
  };

  const filteredOrders = filterOrders(getBaseOrders());

  return (
      <div className="min-h-screen bg-gray-950 pb-20 font-['Alexandria']">
        <RoleHeader user={currentUser} onLogout={() => setCurrentUser(null)} t={t} lang={lang} setLang={setLang} />
        {editingId ? (
            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex items-center gap-4 mb-6"><button onClick={() => { setEditingId(null); setSubmissionStatus('idle'); }} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></button><h2 className="text-2xl font-black text-white">{t.editingOrder} - {order.serialNumber}</h2></div>
                {submissionStatus === 'success' ? (<div className="text-center py-20 animate-in fade-in zoom-in"><CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white">{t.successUpdateTitle}</h2><p className="text-gray-400">{t.successMsg}</p></div>) : (<SalesEntryForm order={order} setOrder={setOrder} onSubmit={handleGenericSubmit} t={t} submissionStatus={submissionStatus} validationError={validationError} isEdit currentUser={currentUser} />)}
            </main>
        ) : (
            <>
                <NotificationBanner count={currentUser.role === 'assistant' ? counts.assistant : currentUser.role === 'finance' ? counts.finance : currentUser.role === 'warehouse' ? counts.warehouse : counts.driverSupervisor} t={t} adminAlerts={globalOrders.filter(o => o.adminEmergencyActive)} />
                <div className="max-w-4xl mx-auto px-4 mt-6">
                    <div className="flex bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-700">
                        {currentUser.role === 'sales' && (<><button onClick={() => setSalesView('entry')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${salesView === 'entry' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.newOrder}</button><button onClick={() => setSalesView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${salesView === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.myHistory} ({globalOrders.filter(o => o.createdBy === currentUser.email).length})</button></>)}
                        {currentUser.role === 'assistant' && (<><button onClick={() => setAssistantView('pending')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${assistantView === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_reviewPending} ({counts.assistant})</button><button onClick={() => setAssistantView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${assistantView === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_fullHistory}</button></>)}
                        {currentUser.role === 'finance' && (<><button onClick={() => setFinanceView('pending')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${financeView === 'pending' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_pendingApproval} ({counts.finance})</button><button onClick={() => setFinanceView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${financeView === 'history' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_fullHistory}</button></>)}
                        {currentUser.role === 'warehouse' && (<><button onClick={() => setWarehouseView('pending')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${warehouseView === 'pending' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_toPrepare} ({counts.warehouse})</button><button onClick={() => setWarehouseView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${warehouseView === 'history' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_history}</button></>)}
                        {currentUser.role === 'driver_supervisor' && (<><button onClick={() => setDriverView('ready')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${driverView === 'ready' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_toDispatch} ({counts.driverSupervisor})</button><button onClick={() => setDriverView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${driverView === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_activeDelivered}</button></>)}
                    </div>
                    {currentUser.role === 'sales' && salesView === 'entry' && (<div className="mt-4 flex justify-end"><button onClick={() => setIsMagicImportOpen(true)} className="bg-purple-600/20 text-purple-400 border border-purple-600/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-600/30 transition-all active:scale-95"><Sparkles size={14} /> {lang === 'ar' ? 'استيراد سحري' : 'Magic Import'}</button></div>)}
                </div>
                <main className="max-w-4xl mx-auto px-4 py-6">
                    {currentUser.role === 'sales' && salesView === 'entry' ? (<SalesEntryForm order={order} setOrder={setOrder} onSubmit={handleGenericSubmit} t={t} submissionStatus={submissionStatus} validationError={validationError} currentUser={currentUser} />) : (
                        <div className="space-y-4">
                            <SearchFilterBar searchTerm={searchTerm} onSearch={setSearchTerm} onExport={() => exportToCSV(filteredOrders)} onBackup={handleBackup} count={filteredOrders.length} t={t} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                            {filteredOrders.length === 0 && <EmptyState message={searchTerm ? t.emptySearch : t.emptySubmit} />}
                            {filteredOrders.map((o, idx) => {
                                const orderKey = o.id || `order-${idx}`;
                                if (warehouseEditingId === o.id) return <OrderAdjustmentForm key={orderKey} order={o} onSave={(newItems) => handleAdjustItems(o.id!, newItems, 'Warehouse')} onCancel={() => setWarehouseEditingId(null)} t={t} borderColor="border-orange-500" />;
                                if (financeEditingId === o.id) return <OrderAdjustmentForm key={orderKey} order={o} onSave={(newItems) => handleAdjustItems(o.id!, newItems, 'Finance')} onCancel={() => setFinanceEditingId(null)} t={t} borderColor="border-green-500" />;
                                if (driverAdjustingId === o.id) return <OrderAdjustmentForm key={orderKey} order={o} onSave={(newItems) => handleAdjustItems(o.id!, newItems, 'Driver Supervisor')} onCancel={() => setDriverAdjustingId(null)} t={t} borderColor="border-teal-500" />;
                                return (<OrderCard key={orderKey} order={o} t={t} onViewImage={setFullSizeImage} actions={currentUser.role === 'sales' && o.createdBy === currentUser.email ? (<div className="mt-4 pt-4 border-t border-gray-700 flex flex-col gap-2">{(o.status === 'Pending Assistant' || o.status === 'Rejected') && (<button onClick={() => handleEditOrder(o)} className="flex-1 py-2 bg-blue-900/20 text-blue-400 rounded-lg font-bold text-sm hover:bg-blue-900/40 flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> {t.editOrder}</button>)}{(o.status === 'Pending Assistant' || o.status === 'Rejected') && (<button onClick={() => updateOrderStatus(o.id!, 'Canceled', 'Sales Supervisor', 'Order canceled by supervisor')} className="flex-1 py-2 bg-red-900/20 text-red-400 rounded-lg font-bold text-sm hover:bg-blue-900/40 flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> {t.cancelOrder}</button>)}</div>) : currentUser.role === 'assistant' ? (<div className="mt-4 pt-4 border-t border-gray-700 space-y-4">{currentUser.isAdmin && (<div className="bg-purple-900/10 border border-purple-900/30 p-4 rounded-xl space-y-3"><div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest"><ShieldAlert className="w-4 h-4" /> {t.admin_action_emergency}</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onClick={() => handleEditOrder(o)} className="py-2 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> {t.editOrder}</button>{(o.status === 'In Transit' || o.status === 'Partially Shipped' || (o.shipments && o.shipments.length > 0)) && (<button onClick={() => setAdminTransferModalOpen({ open: true, orderId: o.id })} className="py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 flex items-center justify-center gap-1"><RefreshCw className="w-3 h-3" /> {lang === 'ar' ? 'تحويل' : 'Transfer'}</button>)}<button onClick={() => setAdminEmergencyModalOpen({ open: true, orderId: o.id, action: 'cancel' })} className="py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Cancel</button></div></div>)}{assistantView === 'pending' && !currentUser.isAdmin && (<><button onClick={() => handleEditOrder(o)} className="w-full py-2.5 bg-indigo-900/20 text-indigo-400 border border-indigo-900/50 rounded-xl font-bold text-sm hover:bg-indigo-900/40 flex items-center justify-center gap-2 transition-all"><Pencil className="w-4 h-4" /> {t.editOrder}</button><ActionWidget placeholder={t.approveQty + "..."} primaryLabel={t.approveQty} secondaryLabel={t.reject} onPrimary={(note) => updateOrderStatus(o.id!, 'Pending Finance', 'Sales Assistant', note || 'Qty Approved')} onSecondary={(note) => updateOrderStatus(o.id!, 'Rejected', 'Sales Assistant', note || 'Qty Rejected')} t={t} /></>)}</div>) : currentUser.role === 'finance' && financeView === 'pending' ? (<ActionWidget placeholder={t.approveOrder + "..."} primaryLabel={t.approveOrder} secondaryLabel={t.reject} primaryColor="green" onPrimary={(note) => updateOrderStatus(o.id!, 'Approved', 'Finance', note || 'Credit Approved')} onSecondary={(note) => updateOrderStatus(o.id!, 'Rejected', 'Finance', note || 'Credit Issues')} onAdjust={() => setFinanceEditingId(o.id!)} t={t} />) : currentUser.role === 'warehouse' && warehouseView === 'pending' ? (<WarehouseActions onReady={(note) => updateOrderStatus(o.id!, 'Ready for Driver', 'Warehouse', note || t.action_approved)} onHold={(note) => updateOrderStatus(o.id!, 'On Hold', 'Warehouse', note || 'Order Held for Review')} onReject={(note) => updateOrderStatus(o.id!, 'Rejected', 'Warehouse', note || 'Order Rejected')} onEdit={() => setWarehouseEditingId(o.id!)} t={t} deliveryType={o.deliveryType} />) : currentUser.role === 'driver_supervisor' && driverView === 'ready' ? (<div className="mt-4 pt-4 border-t border-gray-700">{dispatchingOrderId === o.id ? (<DispatchSplitForm order={o} onDispatch={(shipment) => createShipment(o.id!, shipment)} onCancel={() => setDispatchingOrderId(null)} t={t} />) : reassignShipment?.orderId === o.id ? (<DispatchSplitForm order={o} isReassign={true} initialShipment={reassignShipment.shipment} onDispatch={(shipment) => handleReassignDriver(shipment)} onCancel={() => setReassignShipment(null)} t={t} />) : (<div className="space-y-4">{o.shipments?.filter(s => s.status === 'Emergency').map(s => (<div key={s.id} className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl animate-pulse"><div className="flex items-center gap-3 mb-3"><div className="bg-red-600 p-2 rounded-lg text-white"><AlertTriangle className="w-5 h-5" /></div><div><h4 className="text-red-400 font-black text-sm uppercase tracking-widest">Emergency Alert</h4><p className="text-white font-bold text-xs">Driver: {s.driverName}</p></div></div><div className="bg-black/20 p-3 rounded-lg border border-red-900/30 text-red-200 text-xs italic mb-4">"{s.emergency?.details}"</div><button onClick={() => setReassignShipment({orderId: o.id!, shipment: s})} className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-black text-sm shadow-lg flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Transfer Trip to New Driver</button></div>))}{o.status !== 'On Hold' && (<div className="space-y-2"><div className="flex gap-2"><button onClick={() => updateOrderStatus(o.id!, 'On Hold', 'Driver Supervisor', 'Held by Logistics')} className="flex-1 border border-orange-800 text-orange-400 py-3 rounded-lg font-bold text-sm hover:bg-orange-900/20 flex items-center justify-center gap-2"><PauseCircle className="w-4 h-4" /> {t.hold}</button><button onClick={() => setDriverAdjustingId(o.id!)} className="flex-1 border border-teal-800 text-teal-400 py-3 rounded-lg font-bold text-sm hover:bg-teal-900/20 flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> {t.adjust}</button></div><button onClick={() => setDispatchingOrderId(o.id!)} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-teal-700 transition-colors flex items-center justify-center gap-2">{t.dispatchOrder} <ArrowRight className="w-4 h-4 rtl:rotate-180" /></button></div>)}</div>)}</div>) : null} />);
                            })}
                        </div>
                    )}
                </main>
                {fullSizeImage && <FullscreenImage image={fullSizeImage} onClose={() => setFullSizeImage(null)} />}
            </>
        )}
        {adminEmergencyModalOpen.open && (<EmergencyModal isAdminOverride onClose={() => setAdminEmergencyModalOpen({ open: false })} onSubmit={(report) => handleAdminEmergencyAction(adminEmergencyModalOpen.orderId!, adminEmergencyModalOpen.action!, report.details)} t={t} />)}
        {adminTransferModalOpen.open && (<AdminTransferModal onClose={() => setAdminTransferModalOpen({ open: false })} onTransfer={(customerName, reason) => handleAdminEmergencyAction(adminTransferModalOpen.orderId!, 'transfer', reason, customerName)} t={t} />)}
        <MagicParser isOpen={isMagicImportOpen} onClose={() => setIsMagicImportOpen(false)} onParsed={(data) => { setOrder(prev => ({ ...prev, ...data, receivingDate: data.orderDate || prev.receivingDate, items: data.items ? data.items.map(item => ({ ...item, id: generateId(), originalQuantity: item.quantity })) : prev.items } as SalesOrder)); }} />
      </div>
  );
}

const FullscreenImage = ({ image, onClose }: { image: string, onClose: () => void }) => (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300" onClick={onClose}><button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[210]" onClick={onClose}><X className="w-8 h-8" /></button><div className="relative w-full h-full flex items-center justify-center"><img src={image} alt="Original" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} /></div><p className="text-gray-400 mt-4 text-sm font-medium animate-pulse">Click anywhere to close</p></div>
);

const SalesEntryForm = ({ order, setOrder, onSubmit, t, submissionStatus, validationError, isEdit, currentUser }: { order: SalesOrder, setOrder: any, onSubmit: any, t: any, submissionStatus: string, validationError: string | null, isEdit?: boolean, currentUser?: UserProfile | null }) => (
    <div className="space-y-6">
        {isEdit && currentUser?.isAdmin && (<div className="bg-purple-900/20 p-6 rounded-2xl border-2 border-purple-600 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2"><div className="flex items-center gap-2 text-purple-400 font-black text-sm uppercase tracking-widest"><ShieldAlert className="w-5 h-5" /> {t.admin_action_emergency}</div><textarea value={order.adminEmergencyNote || ''} onChange={e => setOrder({...order, adminEmergencyNote: e.target.value})} placeholder={t.admin_reason_placeholder} className={`${INPUT_CLASS} min-h-[80px] border-purple-500/50 focus:border-purple-500`} /></div>)}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm space-y-5"><h3 className="font-bold text-gray-100 flex items-center gap-2"><User className="w-4 h-4 text-blue-500"/> {t.clientInfo}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.clientName}</label><SearchableSelect options={CUSTOMER_LIST} placeholder={t.selectClient} value={order.customerName} onChange={val => { const found = CUSTOMER_LIST.find(c => (typeof c === 'string' ? c : c.name) === val); if (found && typeof found !== 'string') setOrder({...order, customerName: val, areaLocation: found.location}); else setOrder({...order, customerName: val}); }} /></div><div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.location}</label><div className="relative"><MapPin className="absolute ltr:left-3 rtl:right-3 top-3.5 w-5 h-5 text-gray-400" /><input placeholder={t.areaAddress} className={`${INPUT_CLASS} ltr:pl-10 rtl:pr-10`} value={order.areaLocation} onChange={e => setOrder({...order, areaLocation: e.target.value})} /></div></div><div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.orderDate}</label><div className="relative"><Calendar className="absolute ltr:left-3 rtl:right-3 top-3.5 w-5 h-5 text-gray-400" /><input readOnly className={`${INPUT_CLASS} ltr:pl-10 rtl:pr-10 bg-gray-900 text-gray-500`} value={order.orderDate} /></div></div><div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.receivingDate}</label><div className="relative"><Calendar className="absolute ltr:left-3 rtl:right-3 top-3.5 w-5 h-5 text-gray-400" /><input type="date" min={new Date().toISOString().split('T')[0]} className={`${INPUT_CLASS} ltr:pl-10 rtl:pr-10 cursor-pointer`} value={order.receivingDate} onChange={e => setOrder({...order, receivingDate: e.target.value})} /></div></div><div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.deliveryShift}</label><SearchableSelect options={DELIVERY_SHIFTS} placeholder="Select Shift" value={order.deliveryShift} onChange={val => setOrder({...order, deliveryShift: val as any})} /></div><div><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.deliveryType}</label><SearchableSelect options={['Own Cars', 'Outsource']} placeholder="Select Delivery Type" value={order.deliveryType || ''} onChange={val => setOrder({...order, deliveryType: val as any})} strict /></div><div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-gray-400 uppercase mb-1 block">{t.serialNo}</label><div className="relative"><Hash className="absolute ltr:left-3 rtl:right-3 top-3.5 w-5 h-5 text-gray-400" /><input readOnly className={`${INPUT_CLASS} ltr:pl-10 rtl:pr-10 bg-gray-900 text-gray-500 cursor-not-allowed`} value={order.serialNumber} /></div></div></div></div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-gray-100 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-500"/> {t.orderItems}</h3><button onClick={() => setOrder({ ...order, items: [...order.items, { id: generateId(), itemName: '', quantity: 0 }] })} className="text-sm bg-blue-900/20 text-blue-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-900/40 transition-colors"><Plus className="w-4 h-4"/> {t.addItem}</button></div>{order.items.map((item, idx) => (<div key={item.id} className="bg-gray-900 p-4 rounded-xl relative border border-gray-700 hover:border-blue-700 transition-colors"><button onClick={() => setOrder({ ...order, items: order.items.filter(i => i.id !== item.id) })} className="absolute top-3 ltr:right-3 rtl:left-3 text-gray-400 hover:text-red-500 hover:bg-gray-800 p-1 rounded-md transition-all"><Trash2 className="w-4 h-4"/></button><div className="space-y-4"><div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.item} #{idx + 1}</div><div className="flex flex-col gap-3"><SearchableSelect options={PRODUCT_CATALOG} placeholder={t.searchProduct} className={`${INPUT_CLASS} text-sm`} value={item.itemName} onChange={val => {const newItems = [...order.items]; newItems[idx].itemName = val; setOrder({...order, items: newItems});}} /><div className="w-32"><label className="text-[10px] font-black text-gray-500 uppercase block mb-1">{t.qty}</label><input type="number" className={`${INPUT_CLASS} font-black text-center text-lg`} value={item.quantity === 0 ? '' : item.quantity} onChange={e => {const val = e.target.value === '' ? 0 : parseInt(e.target.value); const newItems = [...order.items]; newItems[idx].quantity = isNaN(val) ? 0 : val; setOrder({...order, items: newItems});}} /></div></div></div></div>))}{order.items.length === 0 && <div className="text-center text-gray-400 py-8 italic border-2 border-dashed border-gray-700 rounded-xl">{t.noItems}</div>}</div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm"><h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-500"/> {t.overallNotes}</h3><textarea placeholder={t.overallNotesPlaceholder} className={`${INPUT_CLASS} min-h-[100px] resize-none`} value={order.overallNotes} onChange={e => setOrder({...order, overallNotes: e.target.value})} /></div>
        {validationError && <div className="bg-red-900/20 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-800"><AlertCircle className="w-5 h-5"/> {validationError}</div>}<button disabled={submissionStatus === 'submitting'} onClick={onSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-lg">{submissionStatus === 'submitting' ? t.processing : <><Send className="w-5 h-5" /> {isEdit ? t.updateOrder : t.submitOrder}</>}</button>
    </div>
);

const DispatchSplitForm: React.FC<{ order: SalesOrder, onDispatch: (shipment: Shipment) => void, onCancel: () => void, isReassign?: boolean, initialShipment?: Shipment, t: any }> = ({ order, onDispatch, onCancel, isReassign, initialShipment, t }) => {
    const [warehouse, setWarehouse] = useState(initialShipment?.warehouseLocation || '');
    const [time, setTime] = useState(initialShipment?.dispatchTime || '');
    const [selectedDriver, setSelectedDriver] = useState(initialShipment?.driverName || '');
    const [driverPhone, setDriverPhone] = useState(initialShipment?.driverPhone || '');
    const [carNumber, setCarNumber] = useState(initialShipment?.carNumber || '');
    const [shipmentItems, setShipmentItems] = useState<{itemName: string, quantity: number, max: number}[]>(() => {
        if (isReassign && initialShipment) return initialShipment.items.map(i => ({ itemName: i.itemName, quantity: i.quantity, max: i.quantity }));
        return order.items.map(i => {
             const alreadyShipped = order.shipments?.reduce((acc, s) => {
                 const itemInShipment = s.items.find(si => si.itemName === i.itemName);
                 return acc + (itemInShipment ? itemInShipment.quantity : 0);
             }, 0) || 0;
             const remaining = Math.max(0, i.quantity - alreadyShipped);
             return { itemName: i.itemName, quantity: remaining, max: remaining };
        });
    });
    const [error, setError] = useState<string | null>(null);
    const handleDriverSelect = (name: string) => {
        setSelectedDriver(name);
        const driver = DRIVERS_FLEET.find(d => d.name === name);
        if (driver) { setDriverPhone(driver.phone); setCarNumber(driver.carNumber); }
        else { setDriverPhone(''); setCarNumber(''); }
    };
    const handleDispatch = () => {
        const itemsToShip = shipmentItems.filter(i => i.quantity > 0);
        if (itemsToShip.length === 0) { setError("Please select items to ship"); return; }
        if (!warehouse) { setError(t.selectWarehouse); return; }
        const validDriver = DRIVERS_FLEET.find(d => d.name === selectedDriver);
        if (!validDriver) { setError("Invalid Driver selected."); return; }
        const shipment: Shipment = { id: initialShipment?.id || generateId(), driverName: selectedDriver, driverPhone, carNumber, warehouseLocation: warehouse, dispatchTime: time, items: itemsToShip.map(i => ({ itemName: i.itemName, quantity: i.quantity })), status: 'Assigned' };
        onDispatch(shipment);
    };
    return (
        <div className="bg-gray-800 rounded-xl border-2 border-teal-600 overflow-hidden animate-in fade-in zoom-in-95"><div className="bg-teal-900/30 px-4 py-3 border-b border-teal-900 flex justify-between items-center"><h3 className="font-bold text-teal-300 flex items-center gap-2"><Truck className="w-4 h-4"/> {isReassign ? "Trip Re-Assignment" : t.dispatchOrder}</h3></div><div className="p-4 space-y-5"><div className="grid grid-cols-1 gap-4"><div><label className="text-[10px] font-black text-gray-500 uppercase mb-1 block ltr:ml-1 rtl:mr-1">{t.selectWarehouse}</label><SearchableSelect options={WAREHOUSES} value={warehouse} onChange={setWarehouse} placeholder={t.selectWarehouse} className={INPUT_CLASS} strict={true} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-gray-500 uppercase mb-1 block ltr:ml-1 rtl:mr-1">{t.dispatchTime}</label><input type="time" className={INPUT_CLASS} value={time} onChange={e => setTime(e.target.value)} /></div><div><label className="text-[10px] font-black text-gray-500 uppercase mb-1 block ltr:ml-1 rtl:mr-1">{t.selectDriver}</label><SearchableSelect options={DRIVERS_FLEET.map(d => d.name)} value={selectedDriver} onChange={handleDriverSelect} placeholder={t.selectDriver} className={INPUT_CLASS} strict={true} /></div></div></div>{error && <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-2 rounded text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4"/>{error}</div>}<div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"><div className="flex justify-between items-center text-xs font-bold text-teal-400 uppercase mb-3 border-b border-gray-700 pb-2"><span>{t.item}</span><span>{isReassign ? "Qty" : t.remainingQty}</span></div><div className="space-y-4">{shipmentItems.map((item, idx) => (<div key={idx} className="flex flex-col border-b border-gray-800 last:border-0 pb-3 last:pb-0"><span className="text-sm text-gray-300 font-bold leading-tight mb-2">{item.itemName}</span><div className="flex items-center gap-3"><span className="text-[10px] text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded border border-gray-700">Max: {item.max}</span><input type="number" min="0" max={item.max} className="w-24 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-center text-white text-base font-black focus:border-teal-500 outline-none" value={item.quantity} onChange={(e) => { const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.max); const newItems = [...shipmentItems]; newItems[idx].quantity = val; setShipmentItems(newItems); }} /></div></div>))}</div></div><div className="flex gap-3"><button onClick={onCancel} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">{t.cancel}</button><button onClick={handleDispatch} className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg shadow-lg font-bold text-sm transition-colors">{isReassign ? "Confirm New Driver" : t.dispatchOrder}</button></div></div></div>
    );
};
