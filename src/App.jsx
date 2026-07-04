import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Cell,
  PieChart, Pie, Scatter, ScatterChart, ZAxis
} from 'recharts';
import { 
  LayoutDashboard, FileText, Activity, TrendingUp, TrendingDown, Calendar, 
  Sun, BatteryCharging, AlertCircle, Search, Filter, BarChart3,
  ChevronDown, ChevronRight, Wrench, Droplets, Scissors, ClipboardList, Zap,
  Users, BookOpen, Clock, HardHat, ListTodo, FileInput, Bell, User, Menu as MenuIcon,
  Trophy, Medal, Package, ShoppingCart, PenTool, History, CircleDollarSign,
  FileCheck, ShieldAlert, ArrowLeft, Trash2, Plus, CheckCircle, XCircle, AlertTriangle,
  CheckSquare, Square, MoreHorizontal, ArrowUpRight, ArrowDownRight, Percent, Target
} from 'lucide-react';

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------

const SHEET_ID = '1V31ijZ1lFhgwLjQZzclaerpTSxWa1y_xM2M2Q65BQ7E'; 
const PLANTS_DEFAULT = ['Selarong Solar', 'Bikam Energy', 'PLBGS', 'AMS Kamunting'];

const TABS = {
  SPECS: 'Plant_Specification',
  PR: 'PR_Data',
  IOD_COD: 'IOD_COD',
  GEN: 'Generation_Trend'
};

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

// Robust CSV Parser
const parseCSV = (text) => {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  // Find the header row (look for key columns in first 15 lines)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const lineLower = lines[i].toLowerCase();
      if (lineLower.includes('plant') || lineLower.includes('month') || lineLower.includes('year') || lineLower.includes('date')) {
          headerIndex = i;
          break;
      }
  }

  const rawHeaders = lines[headerIndex].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(headerIndex + 1).map(line => {
    const values = [];
    let inQuote = false;
    let val = '';
    for (let char of line) {
      if (char === '"') { inQuote = !inQuote; }
      else if (char === ',' && !inQuote) { values.push(val); val = ''; }
      else { val += char; }
    }
    values.push(val);
    
    return rawHeaders.reduce((obj, header, index) => {
      let cleanVal = values[index]?.replace(/"/g, '').trim();
      if (cleanVal && /^-?[\d,]+(\.\d+)?$/.test(cleanVal)) {
          cleanVal = cleanVal.replace(/,/g, '');
      }
      if (cleanVal !== '' && !isNaN(Number(cleanVal))) {
          cleanVal = parseFloat(cleanVal);
      }
      obj[header] = cleanVal;
      return obj;
    }, {});
  });
};

const getVal = (item, keys) => {
  if (!item) return '';
  const itemKeys = Object.keys(item);
  for (let k of keys) {
      if (item[k] !== undefined) return item[k];
      const foundKey = itemKeys.find(ik => ik.toLowerCase() === k.toLowerCase());
      if (foundKey) return item[foundKey];
  }
  return '';
};

const normalizeMonth = (m) => {
    if (!m) return 'Unknown';
    const str = String(m).trim();
    const map = {
        '1': 'January', '01': 'January', 'Jan': 'January', 'jan': 'January', 'JAN': 'January',
        '2': 'February', '02': 'February', 'Feb': 'February', 'feb': 'February', 'FEB': 'February',
        '3': 'March', '03': 'March', 'Mar': 'March', 'mar': 'March', 'MAR': 'March',
        '4': 'April', '04': 'April', 'Apr': 'April', 'apr': 'April', 'APR': 'April',
        '5': 'May', '05': 'May', 'May': 'May', 'may': 'May', 'MAY': 'May',
        '6': 'June', '06': 'June', 'Jun': 'June', 'jun': 'June', 'JUN': 'June',
        '7': 'July', '07': 'July', 'Jul': 'July', 'jul': 'July', 'JUL': 'July',
        '8': 'August', '08': 'August', 'Aug': 'August', 'aug': 'August', 'AUG': 'August',
        '9': 'September', '09': 'September', 'Sep': 'September', 'sep': 'September', 'SEP': 'September',
        '10': 'October', 'Oct': 'October', 'oct': 'October', 'OCT': 'October',
        '11': 'November', 'Nov': 'November', 'nov': 'November', 'NOV': 'November',
        '12': 'December', 'Dec': 'December', 'dec': 'December', 'DEC': 'December',
    };
    return map[str] || str;
};

const checkIsOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const taskDate = new Date(dateString);
    return taskDate <= today;
};

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        border: 'none', 
        padding: '16px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        minWidth: '200px',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px', color: '#334155', borderBottom:'1px solid #e2e8f0', paddingBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</p>
        {payload.map((p, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '6px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.color, boxShadow:`0 0 0 2px rgba(255,255,255,1), 0 0 0 3px ${p.color}` }}></div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight:'500' }}>{p.name}</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>
              {typeof p.value === 'number' ? p.value.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1}) : p.value} <span style={{fontSize:'0.75rem', color:'#94a3b8', fontWeight:'400'}}>{unit}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center', 
      gap: '12px', 
      marginTop: '24px', 
      padding: '12px', 
      background: '#f8fafc', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0' 
    }}>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'white', 
          padding: '6px 14px', 
          borderRadius: '999px', 
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
          border: '1px solid #f1f5f9', 
          cursor: 'default', 
          transition: 'transform 0.1s', 
          fontSize: '0.8rem', 
          color: '#334155', 
          fontWeight: '600' 
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, boxShadow: `0 0 0 2px ${entry.color}40` }}></div>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const getMockData = (type) => {
  if (type === TABS.SPECS) {
    let specs = [];
    PLANTS_DEFAULT.forEach(plant => {
      specs.push(
        { 'Plant Name': plant, Category: 'Modules', Item: 'Manufacturer', 'Specification/Value': 'Jinko Solar' },
        { 'Plant Name': plant, Category: 'Modules', Item: 'Model', 'Specification/Value': 'JKM-540' },
        { 'Plant Name': plant, Category: 'Inverters', Item: 'Type', 'Specification/Value': 'Central Inverter' },
        { 'Plant Name': plant, Category: 'Grid', Item: 'Voltage', 'Specification/Value': '33kV' }
      );
    });
    return specs;
  }
  return [];
};

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------

const styles = {
  app: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', color: '#1e293b', background: '#f8fafc', minHeight: '100vh', display: 'flex' },
  sidebar: { width: '280px', background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100%', zIndex: 20, overflowY: 'auto', boxShadow: '4px 0 12px rgba(0,0,0,0.1)' },
  sidebarHeader: { padding: '24px', borderBottom: '1px solid #1e293b', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', color: '#ffffff', letterSpacing: '0.3px' },
  logoIcon: { width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  navItem: { padding: '12px 20px', margin: '4px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease', fontSize: '0.9rem', borderRadius: '8px', color: '#94a3b8' },
  navItemActive: { background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontWeight: '600', borderLeft: '3px solid #3b82f6' },
  navItemHover: { background: 'rgba(255,255,255,0.03)', color: '#f1f5f9' },
  subNavItem: { padding: '8px 20px 8px 56px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#64748b', transition: 'all 0.2s', opacity: 0.9 },
  subNavItemActive: { color: '#ffffff', fontWeight: '600', opacity: 1 },
  main: { marginLeft: '280px', width: '100%', display: 'flex', flexDirection: 'column' },
  topBar: { height: '70px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' },
  contentContainer: { padding: '40px', overflowY: 'auto', flex: 1 },
  header: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)', padding: '24px', marginBottom: '24px', border: '1px solid #f1f5f9', position: 'relative' },
  clickableCard: { cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  gridDynamic: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '0.9rem' },
  th: { textAlign: 'left', padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', textTransform:'uppercase', fontSize:'0.75rem', letterSpacing:'0.05em' },
  td: { padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#334155', verticalAlign:'middle' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', minWidth: '180px', color: '#334155', fontSize: '0.9rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight:'500' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#334155', fontSize: '0.9rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', width: '100%' },
  buttonPrimary: { padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' },
  buttonDanger: { padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' },
  badge: { padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }
};

// -----------------------------------------------------------------------------
// COMPONENTS
// -----------------------------------------------------------------------------

const StatCard = ({ title, value, subtext, icon: Icon, trend, onClick, isAlert }) => (
  <div 
    style={{
        ...styles.card, 
        ...(onClick ? styles.clickableCard : {}),
        border: isAlert ? '1px solid #fecaca' : styles.card.border
    }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
      <div style={{ padding: '12px', background: isAlert ? '#fef2f2' : '#eff6ff', borderRadius: '12px', color: isAlert ? '#ef4444' : '#3b82f6' }}>
        <Icon size={22} />
      </div>
      {trend && (
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: trend === 'up' ? '#10b981' : '#f43f5e', background: trend === 'up' ? '#ecfdf5' : '#fff1f2', padding: '6px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {trend === 'up' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {trend === 'up' ? 'Good' : 'Attn'}
        </span>
      )}
    </div>
    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: isAlert ? '#ef4444' : '#0f172a', letterSpacing:'-0.5px' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: isAlert ? '#b91c1c' : '#94a3b8', marginTop: '6px', fontWeight:'500' }}>{subtext}</div>
  </div>
);

const DashboardPieSection = () => {
  const COLORS = { good: '#10b981', warn: '#fbbf24', poor: '#ef4444', empty: '#e2e8f0' };
  const pieData = {
    overtime: [{ name: 'Good', value: 2, color: COLORS.good }, { name: 'Warning', value: 1, color: COLORS.warn }, { name: 'Poor', value: 1, color: COLORS.poor }],
    generation: [{ name: 'Good', value: 1, color: COLORS.good }, { name: 'Warning', value: 2, color: COLORS.warn }, { name: 'Poor', value: 1, color: COLORS.poor }],
    availability: [{ name: 'Good', value: 3, color: COLORS.good }, { name: 'Warning', value: 1, color: COLORS.warn }, { name: 'Poor', value: 0, color: COLORS.poor }],
    pr: [{ name: 'Good', value: 2, color: COLORS.good }, { name: 'Warning', value: 2, color: COLORS.warn }, { name: 'Poor', value: 0, color: COLORS.poor }],
    workforce: [{ name: 'Good', value: 3, color: COLORS.good }, { name: 'Warning', value: 1, color: COLORS.warn }, { name: 'Poor', value: 0, color: COLORS.poor }]
  };

  const PieItem = ({ title, data }) => (
    <div style={styles.card}>
      <div style={{textAlign:'center', marginBottom:'10px'}}>
        <h4 style={{fontWeight:'700', fontSize:'0.9rem', color:'#334155'}}>{title}</h4>
      </div>
      <div style={{height: 220, position: 'relative'}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" cy="50%" stroke="none">
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{borderRadius:8, border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', fontSize:'0.8rem'}} itemStyle={{padding:0}} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none'}}>
          <div style={{fontSize: '1.8rem', fontWeight: '800', color: '#1e293b'}}>4</div>
          <div style={{fontSize: '0.7rem', color: '#64748b', textTransform:'uppercase', fontWeight:'600'}}>Total</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '24px'}}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Plant KPI Summary</h2>
        <div style={{display:'flex', gap:'16px', fontSize:'0.8rem', color:'#64748b'}}>
           <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:8, height:8, borderRadius:'50%', background: COLORS.good}}></div> Good</div>
           <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:8, height:8, borderRadius:'50%', background: COLORS.warn}}></div> Warning</div>
           <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:8, height:8, borderRadius:'50%', background: COLORS.poor}}></div> Poor</div>
        </div>
      </div>
      <div style={styles.gridDynamic}>
        <PieItem title="Overtime" data={pieData.overtime} />
        <PieItem title="Generation" data={pieData.generation} />
        <PieItem title="Availability" data={pieData.availability} />
        <PieItem title="Performance Ratio" data={pieData.pr} />
        <PieItem title="Workforce" data={pieData.workforce} />
      </div>
    </div>
  );
};

const PerformanceSummaryTable = () => {
  const leaderboard = [
    { rank: 1, plant: 'Selarong Solar', ot: '98%', ot_status: 'good', gen: '102%', gen_status: 'good', avail: '99.5%', avail_status: 'good', pr: '82.4%', pr_status: 'good', wf: '100%', wf_status: 'good', score: 98 },
    { rank: 2, plant: 'AMS Kamunting', ot: '105%', ot_status: 'warn', gen: '99%', gen_status: 'warn', avail: '98.9%', avail_status: 'warn', pr: '80.1%', pr_status: 'good', wf: '95%', wf_status: 'good', score: 88 },
    { rank: 3, plant: 'Bikam Energy', ot: '112%', ot_status: 'warn', gen: '96%', gen_status: 'warn', avail: '98.2%', avail_status: 'warn', pr: '78.5%', pr_status: 'warn', wf: '90%', wf_status: 'warn', score: 82 },
    { rank: 4, plant: 'PLBGS', ot: '125%', ot_status: 'poor', gen: '92%', gen_status: 'poor', avail: '96.5%', avail_status: 'poor', pr: '74.2%', pr_status: 'poor', wf: '85%', wf_status: 'poor', score: 70 },
  ];

  const getStatusColor = (status) => status === 'good' ? '#10b981' : (status === 'warn' ? '#f59e0b' : '#ef4444');
  const getStatusBg = (status) => status === 'good' ? '#ecfdf5' : (status === 'warn' ? '#fffbeb' : '#fef2f2');

  const Badge = ({ val, status }) => (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', color: getStatusColor(status), background: getStatusBg(status), fontWeight: '700', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', minWidth: '60px' }}>
      {val}
    </div>
  );

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>Plant Performance Leaderboard</h2>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Plant Name</th>
              <th style={{...styles.th, textAlign:'center'}}>Overtime</th>
              <th style={{...styles.th, textAlign:'center'}}>Generation</th>
              <th style={{...styles.th, textAlign:'center'}}>System Avail.</th>
              <th style={{...styles.th, textAlign:'center'}}>Perf. Ratio</th>
              <th style={{...styles.th, textAlign:'center'}}>Workforce Avail.</th>
              <th style={styles.th}>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, i) => (
              <tr key={i}>
                <td style={styles.td}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background: i===0 ? '#fbbf24' : (i===1 ? '#94a3b8' : '#e2e8f0'), color: i===0||i===1 ? '#fff' : '#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'0.9rem' }}>
                        {i===0 ? <Trophy size={16}/> : (i===1 ? <Medal size={16}/> : row.rank)}
                    </div>
                </td>
                <td style={{...styles.td, fontWeight:'700', fontSize:'0.95rem'}}>{row.plant}</td>
                <td style={{...styles.td, textAlign:'center'}}><Badge val={row.ot} status={row.ot_status} /></td>
                <td style={{...styles.td, textAlign:'center'}}><Badge val={row.gen} status={row.gen_status} /></td>
                <td style={{...styles.td, textAlign:'center'}}><Badge val={row.avail} status={row.avail_status} /></td>
                <td style={{...styles.td, textAlign:'center'}}><Badge val={row.pr} status={row.pr_status} /></td>
                <td style={{...styles.td, textAlign:'center'}}><Badge val={row.wf} status={row.wf_status} /></td>
                <td style={styles.td}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{height:8, width:'100%', background:'#f1f5f9', borderRadius:4, overflow:'hidden', minWidth:80}}>
                            <div style={{height:'100%', width:`${row.score}%`, background: row.score > 90 ? '#10b981' : (row.score > 80 ? '#3b82f6' : '#f59e0b'), borderRadius:4}}></div>
                        </div>
                        <span style={{fontWeight:'700', fontSize:'0.9rem', color:'#334155'}}>{row.score}%</span>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardView = ({ data, onNavigate, pendingCount, overdueCount }) => {
  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>Dashboard Overview</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Executive Summary & Real-time Operational Insights</p>
        </div>
      </div>
      
      <div style={styles.grid4}>
        <StatCard 
            title="Pending Task" 
            value={pendingCount} 
            subtext={overdueCount > 0 ? `${overdueCount} Overdue / Due Today` : "Click to Manage"} 
            icon={ListTodo} 
            trend={overdueCount > 0 ? "down" : "up"} 
            isAlert={overdueCount > 0}
            onClick={() => onNavigate('pending-tasks')}
        />
        <StatCard title="Financial Impact" value="RM 45.2k" subtext="Revenue Risk (YTD)" icon={CircleDollarSign} trend="down" onClick={() => onNavigate('financial')} />
        <StatCard title="Compliance & Audit" value="92%" subtext="Ready for Audit" icon={FileCheck} trend="up" onClick={() => onNavigate('compliance')} />
        <StatCard title="O&M Guidelines" value="Ver 2.1" subtext="Updated: Jan 2026" icon={BookOpen} trend="up" onClick={() => {}} />
      </div>

      <DashboardPieSection />
      <PerformanceSummaryTable />
    </div>
  );
};

const PendingTasksView = ({ tasks, setTasks, onBack }) => {
    const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'Medium', due: '' });

    const handleAddTask = () => {
        if (!newTask.title) return;
        const task = { id: Date.now(), ...newTask, status: 'Pending' };
        setTasks([...tasks, task]);
        setNewTask({ title: '', assignee: '', priority: 'Medium', due: '' });
    };

    const handleDelete = (id) => setTasks(tasks.filter(t => t.id !== id));
    const toggleStatus = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' } : t));
    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const overdueCount = tasks.filter(t => t.status === 'Pending' && checkIsOverdue(t.due)).length;

    return (
        <div>
             <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <button onClick={onBack} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}><ArrowLeft/></button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Task Management</h1>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    {overdueCount > 0 && <div style={{padding:'6px 12px', background:'#fef2f2', color:'#ef4444', borderRadius:'8px', fontWeight:'700', display:'flex', alignItems:'center', gap:'6px'}}><AlertTriangle size={16}/> {overdueCount} Overdue</div>}
                    <div style={{padding:'6px 12px', background:'#f0f9ff', color:'#0ea5e9', borderRadius:'8px', fontWeight:'700'}}>{pendingCount} Total Pending</div>
                </div>
            </div>
            <div style={styles.grid2}>
                <div style={styles.card}>
                    <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Task List</h3>
                    <table style={styles.table}>
                        <thead><tr><th style={styles.th}>Status</th><th style={styles.th}>Task</th><th style={styles.th}>Assignee</th><th style={styles.th}>Due</th><th style={styles.th}>Action</th></tr></thead>
                        <tbody>
                            {tasks.length === 0 ? <tr><td colSpan="5" style={{...styles.td, textAlign:'center', color:'#94a3b8'}}>No tasks available. Add one below.</td></tr> : tasks.map((task) => {
                                const isDue = checkIsOverdue(task.due);
                                return (
                                    <tr key={task.id} style={{background: task.status === 'Completed' ? '#f8fafc' : (isDue && task.status === 'Pending' ? '#fff1f2' : 'white')}}>
                                        <td style={styles.td}><button onClick={() => toggleStatus(task.id)} style={{background:'none', border:'none', cursor:'pointer', color: task.status === 'Completed' ? '#10b981' : (isDue ? '#ef4444' : '#cbd5e0')}}>{task.status === 'Completed' ? <CheckCircle size={20}/> : <div style={{width:18, height:18, borderRadius:'50%', border: isDue ? '2px solid #ef4444' : '2px solid #cbd5e0'}}></div>}</button></td>
                                        <td style={{...styles.td, textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? '#94a3b8' : '#334155', fontWeight: '500'}}>{task.title}<div style={{fontSize:'0.75rem', color: task.priority === 'High' ? '#ef4444' : '#64748b'}}>{task.priority} Priority</div></td>
                                        <td style={styles.td}>{task.assignee || '-'}</td>
                                        <td style={{...styles.td, color: isDue && task.status === 'Pending' ? '#ef4444' : 'inherit', fontWeight: isDue ? '700' : 'normal'}}>{task.due || '-'}{isDue && task.status === 'Pending' && <span style={{fontSize:'0.7rem', display:'block', color:'#ef4444'}}>● Due / Overdue</span>}</td>
                                        <td style={styles.td}><button onClick={() => handleDelete(task.id)} style={styles.buttonDanger}><Trash2 size={14}/> </button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div style={{...styles.card, height: 'fit-content'}}>
                    <h3 style={{ marginBottom: '20px', fontWeight: '700' }}>Add New Task</h3>
                    <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                        <div><label style={{display:'block', marginBottom:'6px', fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>Task Description</label><input type="text" placeholder="e.g. Inspect Inverter A" style={styles.input} value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}/></div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                            <div><label style={{display:'block', marginBottom:'6px', fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>Assignee</label><input type="text" placeholder="Name" style={styles.input} value={newTask.assignee} onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}/></div>
                            <div><label style={{display:'block', marginBottom:'6px', fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>Priority</label><select style={styles.select} value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                        </div>
                        <div><label style={{display:'block', marginBottom:'6px', fontSize:'0.85rem', fontWeight:'600', color:'#475569'}}>Due Date</label><input type="date" style={styles.input} value={newTask.due} onChange={(e) => setNewTask({...newTask, due: e.target.value})}/></div>
                        <button style={{...styles.buttonPrimary, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'8px'}} onClick={handleAddTask}><Plus size={18} /> Add Task</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancialImpactView = ({ onBack }) => {
  const metrics = [
    { title: 'Estimated Energy Loss', val: '450 MWh', sub: 'RM 135,000 Equiv.' },
    { title: 'Revenue at Risk (YTD)', val: 'RM 45,200', sub: 'Due to Inverter Downtime' },
    { title: 'Cost of Downtime', val: 'RM 12,500', sub: 'Corrective Maintenance' },
    { title: 'O&M Cost vs Budget', val: '85%', sub: 'Under Budget' },
  ];
  return (
    <div>
      <div style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <button onClick={onBack} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}><ArrowLeft/></button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Financial Impact</h1>
        </div>
      </div>
      <div style={styles.grid4}>{metrics.map((m, i) => (<div key={i} style={styles.card}><h4 style={{color:'#64748b', fontSize:'0.85rem', fontWeight:'600', marginBottom:'8px'}}>{m.title}</h4><div style={{fontSize:'1.5rem', fontWeight:'800', color:'#0f172a', marginBottom:'4px'}}>{m.val}</div><div style={{fontSize:'0.85rem', color:'#ef4444'}}>{m.sub}</div></div>))}</div>
      <div style={styles.card}><h3 style={{marginBottom:'16px'}}>Detailed Financial Report</h3><div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Chart visualization for financial losses would appear here.</div></div>
    </div>
  );
};

const ComplianceView = ({ onBack }) => {
  return (
    <div>
      <div style={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <button onClick={onBack} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}><ArrowLeft/></button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Compliance & Audit Readiness</h1>
        </div>
      </div>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h3 style={{fontSize:'1.1rem', fontWeight:'700'}}>Outstanding Non-Compliance</h3><div style={{padding:'6px 12px', background:'#fef2f2', color:'#ef4444', borderRadius:'8px', fontWeight:'700'}}>3 Critical</div></div>
          <table style={styles.table}><thead><tr><th style={styles.th}>Item</th><th style={styles.th}>Plant</th><th style={styles.th}>Due Date</th></tr></thead><tbody><tr><td style={styles.td}>Safety Signage Faded</td><td style={styles.td}>Selarong</td><td style={{...styles.td, color:'#ef4444'}}>Overdue</td></tr><tr><td style={styles.td}>PPE Inventory Low</td><td style={styles.td}>Bikam</td><td style={styles.td}>25 Jan</td></tr><tr><td style={styles.td}>Logbook Gaps</td><td style={styles.td}>PLBGS</td><td style={styles.td}>28 Jan</td></tr></tbody></table>
        </div>
        <div style={styles.card}>
          <h3 style={{fontSize:'1.1rem', fontWeight:'700', marginBottom:'20px'}}>Documentation Completeness</h3>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'180px'}}><div style={{position:'relative', width:160, height:160, borderRadius:'50%', border:'12px solid #ecfdf5', display:'flex', alignItems:'center', justifyContent:'center'}}><div style={{textAlign:'center'}}><div style={{fontSize:'2.5rem', fontWeight:'800', color:'#10b981'}}>92%</div><div style={{fontSize:'0.8rem', color:'#64748b'}}>Overall</div></div></div></div>
        </div>
      </div>
    </div>
  );
};

const SpecsView = ({ data }) => {
  const [selectedPlant, setSelectedPlant] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const plants = ['All', ...new Set(data.specs.map(item => item['Plant Name']).filter(Boolean))];
  const categories = ['All', ...new Set(data.specs.map(item => item['Category']).filter(Boolean))];
  const filteredSpecs = data.specs.filter(item => {
    const matchPlant = selectedPlant === 'All' || item['Plant Name'] === selectedPlant;
    const matchCategory = selectedCategory === 'All' || item['Category'] === selectedCategory;
    return matchPlant && matchCategory;
  });
  const sortedSpecs = useMemo(() => {
      return [...filteredSpecs].sort((a, b) => {
        const pA = a['Plant Name'] || ''; const pB = b['Plant Name'] || ''; if (pA !== pB) return pA.localeCompare(pB);
        const cA = a['Category'] || ''; const cB = b['Category'] || ''; return cA.localeCompare(cB);
      });
  }, [filteredSpecs]);

  return (
    <div>
      <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Technical Specifications</h1></div>
      <div style={styles.card}>
        <div style={{display:'flex', gap:'16px', marginBottom:'24px', flexWrap:'wrap', alignItems:'flex-end'}}>
            <div style={{flex: 1, minWidth:'200px'}}><label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Filter by Plant</label><select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={{...styles.select, width: '100%'}}>{plants.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div style={{flex: 1, minWidth:'200px'}}><label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Filter by Category</label><select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} style={{...styles.select, width: '100%'}}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <table style={styles.table}><thead><tr><th style={styles.th}>Plant</th><th style={styles.th}>Category</th><th style={styles.th}>Item</th><th style={styles.th}>Specification/Value</th></tr></thead><tbody>{sortedSpecs.length > 0 ? (sortedSpecs.map((row, i) => { const prevRow = i > 0 ? sortedSpecs[i - 1] : null; const showPlant = !prevRow || row['Plant Name'] !== prevRow['Plant Name']; const showCategory = showPlant || (row['Category'] !== prevRow['Category']); return (<tr key={i}><td style={styles.td}>{showPlant && <b>{row['Plant Name']}</b>}</td><td style={styles.td}>{showCategory && (<span style={{background:'#f1f5f9', padding:'4px 10px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'700', color:'#475569', letterSpacing:'0.5px', textTransform:'uppercase'}}>{row['Category']}</span>)}</td><td style={styles.td}>{row.Item || row['Item / Model']}</td><td style={styles.td}>{row['Specification/Value'] || row['Specification / Value']}</td></tr>); })) : (<tr><td colSpan="4" style={{...styles.td, textAlign:'center', color:'#94a3b8', padding:'40px'}}>No matching records found.</td></tr>)}</tbody></table>
      </div>
    </div>
  );
};

const IODView = ({ data }) => {
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>IOD & COD Reference</h1></div>
            <div style={styles.card}>
                <table style={styles.table}><thead><tr><th style={styles.th}>Plant Name</th><th style={styles.th}>IOD</th><th style={styles.th}>Anti Islanding test</th><th style={styles.th}>GCT</th><th style={styles.th}>COD</th></tr></thead><tbody>{data.iod.map((row, i) => (<tr key={i}><td style={styles.td}><b>{row['Plant Name'] || row['Plant'] || '-'}</b></td><td style={styles.td}>{row['IOD'] || ''}</td><td style={styles.td}>{row['Anti Islanding test'] || row['Anti-islanding test'] || ''}</td><td style={styles.td}>{row['GCT'] || ''}</td><td style={styles.td}>{row['COD'] || ''}</td></tr>))}</tbody></table>
            </div>
        </div>
    );
};

const PlantPerformanceView = ({ data }) => {
  const [plant, setPlant] = useState(PLANTS_DEFAULT[0]);
  return (
    <div>
      <div style={styles.header}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Plant Performance Overview</h1>
        <select value={plant} onChange={(e) => setPlant(e.target.value)} style={styles.select}>{PLANTS_DEFAULT.map(p => <option key={p} value={p}>{p}</option>)}</select>
      </div>
      <div style={styles.grid4}>
        <StatCard title="Last Month Gen." value="120.5 MWh" subtext="Monthly Output" icon={Sun} trend="up" />
        <StatCard title="YTD Generation" value="3400.2 MWh" subtext="Total 2024" icon={TrendingUp} trend="up" />
        <StatCard title="Last Month PR" value="82.1%" subtext="Plant Level" icon={Activity} trend="down" />
        <StatCard title="Availability" value="99.8%" subtext="Operational" icon={BatteryCharging} trend="up" />
      </div>
    </div>
  );
};

// UPDATED: Generation Overview - Dropdown Plant Selection & P50/P75/P90 Dash Lines
const GenerationOverview = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedPlant, setSelectedPlant] = useState(''); // Changed from array to string
  const [showTargets, setShowTargets] = useState(true);

  // Extract Filters
  const { years, months, plants } = useMemo(() => {
      const y = new Set();
      const m = new Set();
      const p = new Set();
      const sourceData = data.gen || [];

      sourceData.forEach(item => {
          let plantName = getVal(item, ['Plant Name', 'Plant name', 'Plant', 'Project']);
          if (plantName) { plantName = String(plantName).trim(); if (plantName.length > 0) p.add(plantName); }
          
          const yearCol = getVal(item, ['Year', 'year', 'Tahun']);
          const monthCol = getVal(item, ['Month', 'month', 'Bulan']);
          
          if (yearCol) y.add(String(yearCol).trim());
          if (monthCol) m.add(String(monthCol).trim());
      });

      const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12, 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec':12 };
      
      return { years: Array.from(y).sort(), months: Array.from(m).sort((a,b) => (monthOrder[a] || 0) - (monthOrder[b] || 0)), plants: Array.from(p) };
  }, [data]);

  // Set default plant
  useEffect(() => {
      if (plants.length > 0 && !selectedPlant) setSelectedPlant(plants[0]);
      if (years.length > 0 && !years.includes(selectedYear)) setSelectedYear(years[years.length - 1]);
  }, [plants, years, selectedPlant, selectedYear]); 

  const chartData = useMemo(() => {
    // 1. Process Generation Data
    const genSource = data.gen || [];
    const groupedByMonth = {};

    // Helper to get monthly object
    const getMonthObj = (mName) => {
        if (!groupedByMonth[mName]) {
            groupedByMonth[mName] = { name: mName, actual: 0, p50: null, p75: null, p90: null };
        }
        return groupedByMonth[mName];
    };

    genSource.forEach(d => {
        const criteria = getVal(d, ['criteria', 'Criteria']);
        let plant = getVal(d, ['Plant Name', 'Plant name', 'Plant', 'Project']);
        if (plant) plant = String(plant).trim();

        const yearCol = getVal(d, ['Year', 'year', 'Tahun']);
        const monthCol = getVal(d, ['Month', 'month', 'Bulan']);

        let year = yearCol ? String(yearCol).trim() : '';
        let monthStr = monthCol ? String(monthCol).trim() : '';
        const normalizedMonth = normalizeMonth(monthStr);

        const isActualGen = !criteria || criteria.toLowerCase().includes('gen') || criteria.toLowerCase().includes('export');
        
        // Filter Logic
        const matchesYear = year === selectedYear;
        const matchesPlant = plant === selectedPlant; // Single plant matching
        const matchesMonth = selectedMonth === 'All Months' || normalizedMonth === normalizeMonth(selectedMonth);
        
        if (matchesYear && matchesPlant && matchesMonth && isActualGen) {
             const val = getVal(d, ['value', 'Value']);
             const obj = getMonthObj(normalizedMonth);
             obj.actual = parseFloat(val);
        }
    });

    // 2. Process Forecast Data (P50, P75, P90)
    const forecastSource = data.forecast || [];
    forecastSource.forEach(item => {
         let plant = getVal(item, ['Plant Name', 'Plant name', 'Plant']);
         if (plant) plant = String(plant).trim();
         
         const yearCol = getVal(item, ['Year', 'year']);
         const monthCol = getVal(item, ['Month', 'month']);
         const normalizedMonth = normalizeMonth(monthCol);

         // Relaxed year matching for forecast
         const matchesYear = !yearCol || String(yearCol).trim() === selectedYear;
         const matchesPlant = plant === selectedPlant;
         const matchesMonth = selectedMonth === 'All Months' || normalizedMonth === normalizeMonth(selectedMonth);

         if (matchesYear && matchesPlant && matchesMonth) {
              const obj = getMonthObj(normalizedMonth);
              
              // Extract P50 Value
              const criteria = getVal(item, ['Criteria', 'criteria']);
              let val = parseFloat(getVal(item, ['Value', 'value']));

              if (criteria) {
                  if (criteria.includes('P50')) obj.p50 = val;
                  if (criteria.includes('P75')) obj.p75 = val;
                  if (criteria.includes('P90')) obj.p90 = val;
              } else {
                  // Fallback for wide format
                  const p50 = parseFloat(getVal(item, ['P50', 'P50 (MWh)']));
                  const p75 = parseFloat(getVal(item, ['P75', 'P75 (MWh)']));
                  const p90 = parseFloat(getVal(item, ['P90', 'P90 (MWh)']));
                  if (!isNaN(p50)) obj.p50 = p50;
                  if (!isNaN(p75)) obj.p75 = p75;
                  if (!isNaN(p90)) obj.p90 = p90;
              }
         }
    });

    const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12 };
    return Object.values(groupedByMonth).sort((a,b) => (monthOrder[a.name] || 0) - (monthOrder[b.name] || 0));
  }, [data, selectedPlant, selectedYear, selectedMonth]);

  // Logic Warna Bar
  const getBarColor = (actual, p50, p75, p90) => {
    if (actual === undefined || actual === null || actual === 0) return '#cbd5e1'; // Grey for empty
    
    // Jika data target tak wujud, default blue
    if (!p90) return '#3b82f6';

    // 1. Bawah P90 -> Merah (Bahaya)
    if (actual < p90) return '#ef4444';
    
    // 2. Atas P90 tapi Bawah P75 -> Kuning (Amaran)
    if (p75 && actual < p75) return '#eab308';

    // 3. Atas P75 tapi Bawah P50 -> Jingga (Sederhana)
    if (p50 && actual < p50) return '#f97316';
    
    // 4. Atas P50 -> Hijau (Bagus)
    return '#10b981';
  };

  return (
    <div>
      <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: '800', color:'#0f172a' }}>Actual Gen. vs P50, P75, P90</h1></div>
      <div style={{...styles.card, padding: '24px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'24px', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap'}}>
            {/* Year Dropdown */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b'}}>Year</label>
                <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={styles.select}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            
            {/* Month Dropdown */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b'}}>Month</label>
                <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={styles.select}>
                    <option value="All Months">All Months</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Plant Dropdown (Modified per request) */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b'}}>Select Plant</label>
                 <select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={{...styles.select, minWidth:'220px', border:'2px solid #3b82f6'}}>
                     {plants.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
            </div>
            
            {/* Toggle View Options */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                 <label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b'}}>Chart Options</label>
                 <div onClick={() => setShowTargets(!showTargets)} style={{
                     display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', 
                     padding:'10px 14px', borderRadius:'8px', border: showTargets ? '1px solid #10b981' : '1px solid #e2e8f0',
                     background: showTargets ? '#ecfdf5' : 'white', color: showTargets ? '#10b981' : '#64748b', fontWeight:'600', fontSize:'0.9rem',
                     transition: 'all 0.2s'
                 }}>
                     {showTargets ? <CheckCircle size={18} /> : <div style={{width:18, height:18, borderRadius:'50%', border:'2px solid #cbd5e0'}}></div>}
                     Show P-Values
                 </div>
            </div>
        </div>

        {/* Legend Custom */}
        <div style={{display:'flex', gap:'16px', flexWrap:'wrap', marginTop:'12px', fontSize:'0.8rem', color:'#64748b'}}>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, background:'#10b981', borderRadius:2}}></div>{'>'} P50 (Excellent)</div>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, background:'#f97316', borderRadius:2}}></div>P50 - P75 (Good)</div>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, background:'#eab308', borderRadius:2}}></div>P75 - P90 (Fair)</div>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, background:'#ef4444', borderRadius:2}}></div>{'<'} P90 (Poor)</div>
        </div>

      </div>

      <div style={styles.card}>
        <ResponsiveContainer width="100%" height={450}>
            {chartData.length > 0 ? (
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize:12, fill:'#64748b'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis label={{ value: 'MWh', angle: -90, position: 'insideLeft', fill:'#64748b' }} tick={{fontSize:12, fill:'#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="MWh" />} cursor={{fill: '#f8fafc'}} />
                    <Legend wrapperStyle={{paddingTop:24}} />
                    
                    {/* Bar Actual Generation */}
                    <Bar dataKey="actual" name="Actual Generation" radius={[4, 4, 0, 0]} barSize={50}>
                        {chartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={getBarColor(entry.actual, entry.p50, entry.p75, entry.p90)} />
                        ))}
                    </Bar>

                    {/* P50 Line (Green, Long Dash) */}
                    {showTargets && (
                        <Line 
                            type="monotone" 
                            dataKey="p50" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            strokeDasharray="10 5" 
                            dot={false}
                            activeDot={{r: 6}}
                            name="P50 Target"
                            connectNulls
                        />
                    )}

                    {/* P75 Line (Orange, Medium Dash) */}
                    {showTargets && (
                        <Line 
                            type="monotone" 
                            dataKey="p75" 
                            stroke="#f97316" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={false}
                            activeDot={{r: 5}}
                            name="P75 Target"
                            connectNulls
                        />
                    )}

                    {/* P90 Line (Red/Yellow, Short Dash) */}
                    {showTargets && (
                        <Line 
                            type="monotone" 
                            dataKey="p90" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            strokeDasharray="3 3" 
                            dot={false}
                            activeDot={{r: 4}}
                            name="P90 Target"
                            connectNulls
                        />
                    )}
                </ComposedChart>
            ) : (
                <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', flexDirection:'column', gap:'12px'}}>
                    <AlertCircle size={32} />
                    <span>No data available for the selected filters.</span>
                </div>
            )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const IrradianceOverview = ({ data }) => {
  const [availablePlants, setAvailablePlants] = useState(PLANTS_DEFAULT);
  const [availableYears, setAvailableYears] = useState(['2024']);
  
  const [selectedPlants, setSelectedPlants] = useState([]); // Multi-select Plant
  const [selectedYears, setSelectedYears] = useState([]);   // Multi-select Year

  useEffect(() => {
      const sourceData = data.irr || [];
      const pSet = new Set();
      const ySet = new Set();
      
      sourceData.forEach(d => {
          const p = getVal(d, ['Plant Name', 'Plant name', 'Plant', 'Project']);
          const y = getVal(d, ['Year', 'year']);
          if(p) pSet.add(String(p).trim());
          if(y) ySet.add(String(y).trim());
      });

      const pArr = Array.from(pSet).sort();
      const yArr = Array.from(ySet).sort();

      if (pArr.length > 0) {
          setAvailablePlants(pArr);
          if (selectedPlants.length === 0) setSelectedPlants(pArr);
      } else {
          // Fallback if no data detected
          if(selectedPlants.length === 0) setSelectedPlants(PLANTS_DEFAULT);
      }

      if (yArr.length > 0) {
          setAvailableYears(yArr);
          // Default select the latest year if none selected
          if (selectedYears.length === 0) setSelectedYears([yArr[yArr.length - 1]]);
      }
  }, [data.irr, selectedPlants, selectedYears]); 

  const togglePlant = (plant) => {
    if (selectedPlants.includes(plant)) {
        setSelectedPlants(selectedPlants.filter(p => p !== plant));
    } else {
        setSelectedPlants([...selectedPlants, plant]);
    }
  };

  const toggleYear = (year) => {
    if (selectedYears.includes(year)) {
        // Prevent deselecting the last year (keep at least one)
        if (selectedYears.length > 1) {
            setSelectedYears(selectedYears.filter(y => y !== year));
        }
    } else {
        setSelectedYears([...selectedYears, year].sort());
    }
  };
  
  const chartData = useMemo(() => {
    const sourceData = data.irr || [];
    
    // Create a composite key for each line: "PlantName (Year)"
    // We group by Month
    const grouped = {};

    sourceData.forEach(d => {
        const pName = String(getVal(d, ['Plant Name', 'Plant name', 'Plant', 'Project'])).trim();
        const year = String(getVal(d, ['Year', 'year'])).trim();
        const month = getVal(d, ['Month', 'month']);
        
        // Filter Check
        if (selectedPlants.includes(pName) && selectedYears.includes(year)) {
             const actVal = getVal(d, ['POA Irr Act. (kWh/m2)', 'POA Irr Act.', 'POA Irr Act', 'Act', 'Actual']);
             
             if (month && actVal) {
                 if (!grouped[month]) grouped[month] = { name: month };
                 // Create a unique key for this specific line series
                 const seriesKey = `${pName} (${year})`;
                 grouped[month][seriesKey] = parseFloat(actVal);
             }
        }
    });
    
    // Fixed Duplicate Key 'May'
    const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12, 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec':12 };
    
    return Object.values(grouped).sort((a,b) => (monthOrder[a.name] || 0) - (monthOrder[b.name] || 0));
  }, [data, selectedPlants, selectedYears]);

  // Generate dynamic line configurations
  const lineConfigs = useMemo(() => {
      const configs = [];
      const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      let colorIdx = 0;

      selectedPlants.forEach(p => {
          selectedYears.forEach(y => {
              configs.push({
                  key: `${p} (${y})`,
                  color: COLORS[colorIdx % COLORS.length]
              });
              colorIdx++;
          });
      });
      return configs;
  }, [selectedPlants, selectedYears]);

  // --- NEW FEATURE: PERCENTAGE DIFFERENCE CALCULATION ---
  const percentageDiff = useMemo(() => {
    // Only calculate if exactly 2 years are selected
    if (selectedYears.length !== 2) return null;
    
    const [y1, y2] = [...selectedYears].sort(); // Compare earlier year to later year
    
    // We want to calculate the total diff per plant
    const diffs = selectedPlants.map(plant => {
        let sumY1 = 0;
        let sumY2 = 0;
        let countY1 = 0;
        let countY2 = 0;

        chartData.forEach(item => {
            const k1 = `${plant} (${y1})`;
            const k2 = `${plant} (${y2})`;
            
            if (item[k1] !== undefined) { sumY1 += item[k1]; countY1++; }
            if (item[k2] !== undefined) { sumY2 += item[k2]; countY2++; }
        });

        if (sumY1 === 0 || countY1 === 0 || countY2 === 0) return { plant, diff: null };

        // Difference Formula: ((New - Old) / Old) * 100
        const percentChange = ((sumY2 - sumY1) / sumY1) * 100;
        
        return {
            plant,
            diff: percentChange,
            y1Total: sumY1,
            y2Total: sumY2
        };
    });

    return { y1, y2, diffs };
  }, [chartData, selectedYears, selectedPlants]);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color:'#0f172a' }}>Irradiance Data</h1>
      </div>
      
      <div style={{...styles.card, padding: '20px', marginBottom:'24px'}}>
        {/* Plant Selector */}
        <div style={{marginBottom:'16px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <label style={{fontSize:'0.9rem', fontWeight:'700', color:'#334155'}}>Select Plants</label>
                <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => setSelectedPlants(availablePlants)} style={{fontSize:'0.8rem', color:'#0ea5e9', background:'none', border:'none', cursor:'pointer', fontWeight:'600'}}>Select All</button>
                    <button onClick={() => setSelectedPlants([])} style={{fontSize:'0.8rem', color:'#64748b', background:'none', border:'none', cursor:'pointer', fontWeight:'600'}}>Clear</button>
                </div>
            </div>
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                {availablePlants.map((plant) => {
                    const isSelected = selectedPlants.includes(plant);
                    return (
                        <div key={plant} onClick={() => togglePlant(plant)} style={{
                                padding:'6px 12px', borderRadius:'8px', border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                background: isSelected ? '#eff6ff' : 'white', fontSize:'0.85rem', cursor:'pointer', fontWeight: isSelected ? '600' : '500', color: isSelected ? '#3b82f6' : '#64748b',
                                display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                            }}>
                            <div style={{width:16, height:16, borderRadius:4, border: `2px solid ${isSelected ? '#3b82f6' : '#cbd5e0'}`, background: isSelected ? '#3b82f6' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                {isSelected && <CheckSquare size={10} color="white" strokeWidth={4} />}
                            </div>
                            {plant}
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Year Selector */}
        <div>
            <label style={{fontSize:'0.9rem', fontWeight:'700', color:'#334155', display:'block', marginBottom:'8px'}}>Compare Years</label>
            <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                {availableYears.map((year) => {
                    const isSelected = selectedYears.includes(year);
                    return (
                        <div key={year} onClick={() => toggleYear(year)} style={{
                                padding:'6px 12px', borderRadius:'20px', border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                                background: isSelected ? '#ecfdf5' : 'white', fontSize:'0.85rem', cursor:'pointer', fontWeight: isSelected ? '600' : '500', color: isSelected ? '#10b981' : '#64748b',
                                display:'flex', alignItems:'center', gap:'8px', transition:'all 0.2s'
                            }}>
                             {year}
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      {/* --- NEW SECTION: Percentage Difference Card --- */}
      {percentageDiff && (
          <div style={{...styles.card, padding:'24px', background:'linear-gradient(to right, #f8fafc, #ffffff)', borderLeft:'4px solid #3b82f6'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'700', color:'#334155', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
                  <Percent size={18} /> Comparison Analysis: {percentageDiff.y1} vs {percentageDiff.y2}
              </h3>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
                  {percentageDiff.diffs.map((item, idx) => {
                      if (item.diff === null) return null;
                      const isPositive = item.diff > 0;
                      return (
                          <div key={idx} style={{background:'white', padding:'16px', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', border:'1px solid #f1f5f9'}}>
                              <div style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'4px'}}>{item.plant}</div>
                              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                  <div style={{fontSize:'1.5rem', fontWeight:'800', color: isPositive ? '#10b981' : '#ef4444'}}>
                                      {isPositive ? '+' : ''}{item.diff.toFixed(1)}%
                                  </div>
                                  {isPositive ? <ArrowUpRight size={24} color="#10b981" /> : <ArrowDownRight size={24} color="#ef4444" />}
                              </div>
                              <div style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'4px'}}>
                                  Total: {item.y1Total.toLocaleString(undefined,{maximumFractionDigits:0})} ➔ {item.y2Total.toLocaleString(undefined,{maximumFractionDigits:0})}
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      <div style={styles.card}>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize:12, fill:'#64748b'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis label={{ value: 'Irradiation (kWh/m2)', angle: -90, position: 'insideLeft', fill:'#64748b' }} tick={{fontSize:12, fill:'#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="kWh/m²" />} cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray:'4 4'}} />
                    <Legend content={<CustomLegend />} />
                    {lineConfigs.map((config) => (
                        <Line 
                            key={config.key} 
                            type="monotone" 
                            dataKey={config.key} 
                            stroke={config.color} 
                            strokeWidth={3} 
                            dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                            activeDot={{r: 6, strokeWidth: 0}}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
         ) : (
             <div style={{padding:40, textAlign:'center', color:'#94a3b8'}}>
                 No data available for selected filters. <br/>
                 <small>Ensure plants and years are selected and data exists in spreadsheet.</small>
             </div>
         )}
      </div>
    </div>
  );
};

const PRView = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedPRType, setSelectedPRType] = useState('All Types'); 

  const { years, months, plants, prTypes } = useMemo(() => {
      const y = new Set();
      const m = new Set();
      const p = new Set();
      const t = new Set();
      const sourceData = data.pr || [];

      sourceData.forEach(item => {
          let plantName = getVal(item, ['Plant Name', 'Plant name', 'Plant', 'Project']);
          if (plantName) { plantName = String(plantName).trim(); if(plantName) p.add(plantName); }
          
          const yearCol = getVal(item, ['Year', 'year', 'Tahun']);
          const monthCol = getVal(item, ['Month', 'month', 'Bulan']);
          const dateStr = getVal(item, ['Date', 'date']);
          const typeVal = getVal(item, ['PR Level Type', 'PR Level', 'PR levelType', 'PR level', 'Level Type', 'Type', 'Jenis PR']);

          if (typeVal && String(typeVal).trim() !== '') t.add(String(typeVal).trim());

          if (yearCol) y.add(String(yearCol).trim());
          else if (dateStr) {
             const parts = dateStr.split(/[-/]/);
             if (parts.length === 3) y.add(parts[2].length === 2 ? '20'+parts[2] : parts[2]);
          } 
          
          if (monthCol) {
             let mVal = String(monthCol).trim();
             if (mVal.includes('/')) mVal = mVal.split('/')[0];
             m.add(mVal);
          }
      });
      
      // Fixed Duplicate Key 'May'
      const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12, 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec':12 };
      
      return {
          years: Array.from(y).sort(),
          months: Array.from(m).sort((a,b) => (monthOrder[a] || 0) - (monthOrder[b] || 0)),
          plants: Array.from(p),
          prTypes: Array.from(t).sort()
      };
  }, [data]);

  useEffect(() => {
      if (plants.length > 0 && selectedPlants.length === 0) setSelectedPlants(plants);
      if (years.length > 0 && !years.includes(selectedYear)) setSelectedYear(years[years.length - 1]);
      if (prTypes.length > 0 && (!selectedPRType || selectedPRType === 'All Types' || !prTypes.includes(selectedPRType))) setSelectedPRType(prTypes[0]);
  }, [plants, years, prTypes, selectedPlants, selectedYear, selectedPRType]); 

  const togglePlant = (plant) => {
      if (selectedPlants.includes(plant)) setSelectedPlants(selectedPlants.filter(p => p !== plant));
      else setSelectedPlants([...selectedPlants, plant]);
  };

  const chartData = useMemo(() => {
    const sourceData = data.pr || [];
    if (!sourceData) return [];
    
    let filtered = sourceData.filter(d => {
        let plant = getVal(d, ['Plant Name', 'Plant name', 'Plant']);
        if (plant) plant = String(plant).trim();
        const yearCol = getVal(d, ['Year', 'year']);
        const monthCol = getVal(d, ['Month', 'month']);
        const dateStr = getVal(d, ['Date', 'date']);
        const typeVal = getVal(d, ['PR Level Type', 'PR Level', 'PR levelType', 'Type']);

        let year = yearCol ? String(yearCol).trim() : '';
        if (!year && dateStr) {
           const parts = dateStr.split(/[-/]/);
           if (parts.length === 3) year = parts[2].length === 2 ? '20'+parts[2] : parts[2];
        }

        let monthStr = monthCol ? String(monthCol).trim() : '';
        if (monthStr.includes('/')) monthStr = monthStr.split('/')[0];

        const matchesYear = year === selectedYear;
        const matchesPlant = selectedPlants.includes(plant);
        let matchesType = true;
        if (prTypes.length > 0 && selectedPRType !== 'All Types') matchesType = typeVal === selectedPRType;
        
        let matchesMonth = true;
        if (selectedMonth !== 'All Months') matchesMonth = monthStr === selectedMonth;
        
        return matchesYear && matchesPlant && matchesMonth && matchesType;
    });

    const groupedByMonth = {};
    filtered.forEach(item => {
        let month = getVal(item, ['Month', 'month']);
        if(month.includes('/')) month = month.split('/')[0];
        let plantName = getVal(item, ['Plant Name', 'Plant name', 'Plant']);
        if(plantName) plantName = String(plantName).trim();
        const val = getVal(item, ['value', 'Value', 'PR', 'PR (%)']);
        
        let numVal = 0;
        if (typeof val === 'string') numVal = parseFloat(val.replace(/%/g, ''));
        else numVal = val;

        if (!groupedByMonth[month]) groupedByMonth[month] = { name: month };
        groupedByMonth[month][plantName] = numVal;
    });
    
    // Fixed Duplicate Key 'May'
    const monthOrder = { 'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12, 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec':12 };
    return Object.values(groupedByMonth).sort((a,b) => (monthOrder[a.name] || 0) - (monthOrder[b.name] || 0));
  }, [data, selectedPlants, selectedYear, selectedMonth, selectedPRType, prTypes]);

  // Calculate Metrics for the Cards
  const metrics = useMemo(() => {
    let totalPR = 0;
    let count = 0;
    let maxPR = 0;
    let minPR = 100;

    chartData.forEach(d => {
        selectedPlants.forEach(p => {
            if (d[p]) {
                totalPR += d[p];
                count++;
                if (d[p] > maxPR) maxPR = d[p];
                if (d[p] < minPR) minPR = d[p];
            }
        });
    });

    return {
        avg: count > 0 ? (totalPR / count).toFixed(2) : 0,
        max: maxPR > 0 ? maxPR.toFixed(2) : 0,
        min: minPR < 100 ? minPR.toFixed(2) : 0
    };
  }, [chartData, selectedPlants]);

  const PLANT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div>
      <div style={styles.header}>
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color:'#0f172a', letterSpacing:'-0.5px' }}>Performance Ratio (PR)</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop:'4px' }}>Analyze plant efficiency trends across portfolios</p>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
             {/* Year Selector */}
             <div style={{background:'white', borderRadius:'8px', padding:'6px 12px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'8px'}}>
                 <Calendar size={16} color="#64748b"/>
                 <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={{border:'none', outline:'none', fontSize:'0.9rem', color:'#334155', fontWeight:'600', cursor:'pointer', background:'transparent'}}>
                     {years.map(y=><option key={y} value={y}>{y}</option>)}
                 </select>
             </div>
             {/* Month Selector */}
             <div style={{background:'white', borderRadius:'8px', padding:'6px 12px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'8px'}}>
                 <Filter size={16} color="#64748b"/>
                 <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{border:'none', outline:'none', fontSize:'0.9rem', color:'#334155', fontWeight:'600', cursor:'pointer', background:'transparent'}}>
                     <option value="All Months">All Months</option>{months.map(m=><option key={m} value={m}>{m}</option>)}
                 </select>
             </div>
             {/* Type Selector */}
             <div style={{background:'white', borderRadius:'8px', padding:'6px 12px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:'8px'}}>
                 <Activity size={16} color="#64748b"/>
                 <select value={selectedPRType} onChange={e=>setSelectedPRType(e.target.value)} style={{border:'none', outline:'none', fontSize:'0.9rem', color:'#334155', fontWeight:'600', cursor:'pointer', background:'transparent'}}>
                     {prTypes.length > 0 ? prTypes.map(t=><option key={t} value={t}>{t}</option>) : <option value="All Types">Default</option>}
                </select>
             </div>
        </div>
      </div>

      {/* METRIC CARDS ROW */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px', marginBottom:'24px'}}>
        <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'16px'}}>
            <div style={{width:48, height:48, borderRadius:'12px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', color:'#3b82f6'}}><Activity size={24}/></div>
            <div><div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Average PR</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#0f172a'}}>{metrics.avg}%</div></div>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'16px'}}>
            <div style={{width:48, height:48, borderRadius:'12px', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', color:'#10b981'}}><TrendingUp size={24}/></div>
            <div><div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Highest PR Recorded</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#0f172a'}}>{metrics.max}%</div></div>
        </div>
        <div style={{background:'white', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'16px'}}>
            <div style={{width:48, height:48, borderRadius:'12px', background:'#fff1f2', display:'flex', alignItems:'center', justifyContent:'center', color:'#f43f5e'}}><TrendingDown size={24}/></div>
            <div><div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Lowest PR Recorded</div><div style={{fontSize:'1.8rem', fontWeight:'800', color:'#0f172a'}}>{metrics.min}%</div></div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
             <div>
                <h3 style={{fontSize:'1.1rem', fontWeight:'700', color:'#1e293b', marginBottom:'4px'}}>Performance Ratio Trends</h3>
                <p style={{fontSize:'0.85rem', color:'#64748b'}}>Comparing {selectedPRType} across {selectedPlants.length} plants in {selectedYear}</p>
             </div>
             {/* Plant Toggles Pill Style */}
             <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {plants.map((plant, index) => {
                    const isSelected = selectedPlants.includes(plant);
                    const color = PLANT_COLORS[index % PLANT_COLORS.length];
                    return (
                        <div key={plant} onClick={() => togglePlant(plant)} 
                            style={{
                                cursor:'pointer', padding:'6px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', transition:'all 0.2s',
                                border: isSelected ? `1px solid ${color}` : '1px solid #e2e8f0',
                                background: isSelected ? color : 'white',
                                color: isSelected ? 'white' : '#64748b',
                                display:'flex', alignItems:'center', gap:'6px'
                            }}
                        >
                            {plant}
                        </div>
                    )
                })}
             </div>
        </div>

        <ResponsiveContainer width="100%" height={450}>
            {chartData.length > 0 ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                    dy={10} 
                />
                <YAxis 
                    domain={['auto', 'auto']} 
                    unit="%" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                />
                <Tooltip content={<CustomTooltip unit="%" />} cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray:'4 4'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop:'20px', fontSize:'0.9rem'}} />
                {plants.map((plant, index) => {
                    if (!selectedPlants.includes(plant)) return null;
                    return (
                        <Line 
                            key={plant} 
                            type="monotone" 
                            dataKey={plant} 
                            stroke={PLANT_COLORS[index % PLANT_COLORS.length]} 
                            strokeWidth={3} 
                            dot={{r: 5, strokeWidth: 2, fill: '#fff', stroke: PLANT_COLORS[index % PLANT_COLORS.length]}} 
                            activeDot={{r: 7, strokeWidth: 0, fill: PLANT_COLORS[index % PLANT_COLORS.length]}} 
                            animationDuration={1500}
                        />
                    );
                })}
              </LineChart>
            ) : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', flexDirection:'column', gap:'12px'}}><AlertCircle size={32} /><span>No data available. Please check filters.</span></div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// NEW: SY Analysis View Component
const SYAnalysisView = ({ data }) => {
    const [selectedPlant, setSelectedPlant] = useState('All Plants');
    const [selectedYear, setSelectedYear] = useState('All Years');

    // Debug state
    const [debugInfo, setDebugInfo] = useState({ loaded: 0, valid: 0, points: 0, cols: {} });

    const { plants, years, chartData, kpi, debug } = useMemo(() => {
        const sourceData = data.sy || []; // Use 'sy' from App state
        const pSet = new Set(['All Plants']);
        const ySet = new Set(['All Years']);
        
        if (sourceData.length === 0) {
             return { plants: [], years: [], chartData: [], kpi: { avgExp:0, avgAct:0, diff:0, perf:0 }, debug: {} };
        }

        // 1. Column Detection (Robust)
        const firstRow = sourceData[0];
        const keys = Object.keys(firstRow);
        
        const findKey = (sub) => keys.find(k => k.toLowerCase().includes(sub.toLowerCase()));
        
        const plantKey = findKey('Plant') || 'Plant name';
        const yearKey = findKey('Year') || 'Year';
        const monthKey = findKey('Month') || 'Month';
        
        // Exact matches as requested
        let expKey = keys.find(k => k.trim() === 'SY_expect. (kWh/kWp)');
        if (!expKey) expKey = keys.find(k => k.toLowerCase().includes('sy_expect')) || 'SY_expect. (kWh/kWp)';

        let actKey = keys.find(k => k.trim() === 'SY_Actual. (kWh/kWp)');
        if (!actKey) actKey = keys.find(k => k.toLowerCase().includes('sy_actual')) || 'SY_Actual. (kWh/kWp)';

        // 2. Helper: toNumber
        const toNumber = (v) => {
            if (v === null || v === undefined) return NaN;
            const s = String(v).trim();
            if (s === "" || s === "-" || s.toLowerCase() === "na" || s.toLowerCase() === "n/a") return NaN;
            // remove commas
            let cleaned = s.replace(/,/g, "");
            // remove non-numeric chars except dot and minus (unit handling)
            cleaned = cleaned.replace(/[^\d.\-]/g, ""); 
            return parseFloat(cleaned);
        };

        // 3. Helper: parseMonth
        const parseMonth = (m) => {
            if (m === null || m === undefined) return NaN;
            const s = String(m).trim();
            if (/^\d+$/.test(s)) return parseInt(s, 10);
            
            const map = {
                jan:1,january:1,
                feb:2,february:2,
                mar:3,march:3,
                apr:4,april:4,
                may:5,
                jun:6,june:6,
                jul:7,july:7,
                aug:8,august:8,
                sep:9,september:9,
                oct:10,october:10,
                nov:11,november:11,
                dec:12,december:12
            };
            
            // Try explicit match first, then slice
            const lower = s.toLowerCase();
            if (map[lower]) return map[lower];
            
            const key = lower.slice(0,3);
            return map[key] ?? NaN;
        };

        // Counters for debug
        let nanExpCount = 0;
        let nanActCount = 0;
        let invalidMonthCount = 0;
        let invalidYearCount = 0;
        const rawSamples = [];
        const parsedSamples = [];

        // 4. Processing
        const groupedData = {};
        let loadedCount = sourceData.length;
        let validCount = 0;

        sourceData.forEach((d, i) => {
            const pRaw = d[plantKey];
            const yRaw = d[yearKey];
            const mRaw = d[monthKey];
            const syExpRaw = d[expKey];
            const syActRaw = d[actKey];

            // Capture samples for first 3 rows
            if (i < 3) {
                rawSamples.push({ exp: syExpRaw, act: syActRaw, m: mRaw, y: yRaw });
            }

            if (pRaw && yRaw) {
                const p = String(pRaw).trim();
                const y = parseInt(String(yRaw).replace(/,/g, '').trim(), 10); // handle "2,024" year edge case
                const m = parseMonth(mRaw);
                
                // Collect Filters
                pSet.add(p);
                ySet.add(String(y));

                // Clean Values
                const syExp = toNumber(syExpRaw);
                const syAct = toNumber(syActRaw);

                if (i < 3) {
                    parsedSamples.push({ exp: syExp, act: syAct, m, y });
                }

                // Checks
                let isValid = true;
                if (isNaN(y)) { invalidYearCount++; isValid = false; }
                if (isNaN(m) || m < 1 || m > 12) { invalidMonthCount++; isValid = false; }
                
                // Only skip row if data is completely missing/invalid (NaN). 0 is allowed.
                if (isNaN(syExp)) { nanExpCount++; isValid = false; }
                if (isNaN(syAct)) { nanActCount++; isValid = false; }

                // Validate Row
                if (isValid) {
                    validCount++;

                    // Apply Filters
                    const plantMatch = selectedPlant === 'All Plants' || p === selectedPlant;
                    const yearMatch = selectedYear === 'All Years' || String(y) === selectedYear;

                    if (plantMatch && yearMatch) {
                        const period = `${y}-${String(m).padStart(2, '0')}`; // YYYY-MM
                        
                        if (!groupedData[period]) {
                            groupedData[period] = { 
                                period: period, // used for x-axis
                                year: y, 
                                month: m, 
                                expSum: 0, 
                                actSum: 0, 
                                count: 0 
                            };
                        }
                        groupedData[period].expSum += syExp;
                        groupedData[period].actSum += syAct;
                        groupedData[period].count += 1;
                    }
                }
            }
        });

        const sortedPlants = Array.from(pSet).sort();
        const sortedYears = Array.from(ySet).sort().reverse();

        // Convert grouped object to array and calculate averages
        const processed = Object.values(groupedData).map(item => ({
            period: item.period, // Correct key for chart
            year: item.year,
            month: item.month,
            expected: parseFloat((item.expSum / item.count).toFixed(2)), // Average
            actual: parseFloat((item.actSum / item.count).toFixed(2)), // Average
        })).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // KPI Calculation
        let totalExp = 0;
        let totalAct = 0;
        processed.forEach(item => {
            totalExp += item.expected;
            totalAct += item.actual;
        });

        const avgExp = processed.length > 0 ? (totalExp / processed.length) : 0;
        const avgAct = processed.length > 0 ? (totalAct / processed.length) : 0;
        const diff = avgAct - avgExp;
        const perf = avgExp !== 0 ? (avgAct / avgExp) * 100 : 0;

        // Return Data + Debug Info
        return {
            plants: sortedPlants,
            years: sortedYears,
            chartData: processed,
            kpi: {
                avgExp,
                avgAct,
                diff,
                perf
            },
            debug: {
                loaded: loadedCount,
                valid: validCount,
                points: processed.length,
                cols: { plantKey, yearKey, monthKey, expKey, actKey },
                rawSamples,
                parsedSamples,
                nanExpCount,
                nanActCount,
                invalidMonthCount,
                invalidYearCount
            }
        };
    }, [data.sy, selectedPlant, selectedYear]);

    // Update debug state
    useEffect(() => {
        if(chartData && years) { // just a trigger
             // We use the computed debug object directly in render
        }
    }, [chartData, years]);

    return (
        <div>
            {/* 1. Filters */}
            <div style={styles.header}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>SY Expected vs Actual (kWh/kWp)</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={styles.select}>
                      {plants.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={styles.select}>
                      {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
            </div>

            {/* 2. KPI Cards */}
            <div style={styles.grid4}>
                <div style={{...styles.card, background: '#f8fafc', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Avg Expected SY</div>
                    <div style={{fontSize:'1.8rem', fontWeight:'800', color:'#3b82f6', marginTop:'8px'}}>{kpi.avgExp.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>kWh/kWp</div>
                </div>
                <div style={{...styles.card, background: '#f8fafc', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Avg Actual SY</div>
                    <div style={{fontSize:'1.8rem', fontWeight:'800', color:'#10b981', marginTop:'8px'}}>{kpi.avgAct.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>kWh/kWp</div>
                </div>
                <div style={{...styles.card, background: '#f8fafc', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Difference</div>
                    <div style={{fontSize:'1.8rem', fontWeight:'800', color: kpi.diff >= 0 ? '#10b981' : '#ef4444', marginTop:'8px'}}>{kpi.diff > 0 ? '+' : ''}{kpi.diff.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                    <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>Actual - Expected</div>
                </div>
                <div style={{...styles.card, background: '#f8fafc', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'0.85rem', color:'#64748b', fontWeight:'600', textTransform:'uppercase'}}>Performance %</div>
                    <div style={{fontSize:'1.8rem', fontWeight:'800', color: kpi.perf >= 100 ? '#10b981' : '#f59e0b', marginTop:'8px'}}>{kpi.perf > 0 ? kpi.perf.toFixed(2) + '%' : '-'}</div>
                    <div style={{fontSize:'0.8rem', color:'#94a3b8'}}>Achievement</div>
                </div>
            </div>

            {/* 3. Line Chart Comparison */}
            <div style={styles.card}>
                <h3 style={{fontSize:'1.1rem', fontWeight:'700', color:'#1e293b', marginBottom:'24px'}}>SY Expected vs Actual (kWh/kWp)</h3>
                <ResponsiveContainer width="100%" height={450}>
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="period" tick={{fontSize:12, fill:'#64748b'}} />
                        <YAxis label={{ value: 'kWh/kWp', angle: -90, position: 'insideLeft', fill:'#64748b' }} tick={{fontSize:12, fill:'#64748b'}} />
                        <Tooltip content={<CustomTooltip unit="kWh/kWp" />} />
                        <Legend />
                        <Line type="monotone" dataKey="expected" stroke="#0ea5e9" name="Expected" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
                        <Line type="monotone" dataKey="actual" stroke="#f59e0b" name="Actual" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- RESTORED COMPONENTS FOR AVAILABILITY & DOWNTIME ---

const AvailTrendView = ({ data }) => {
    // If no real data passed yet or structure not ready, fallback to mock or empty
    const [chartData, setChartData] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Fetch and Process Data from data.avail
    useEffect(() => {
        const sourceData = data.avail || [];
        
        if (sourceData.length === 0) return;

        // Column Detection
        const firstRow = sourceData[0];
        const keys = Object.keys(firstRow);
        
        const findKey = (sub) => keys.find(k => k.toLowerCase().includes(sub.toLowerCase()));
        
        const plantKey = findKey('Plant') || 'Plant name';
        const yearKey = findKey('Year') || 'Year';
        const monthKey = findKey('Month') || 'Month';
        // Adjust these if your actual headers are different for Availability
        const availKey = keys.find(k => k.toLowerCase().includes('availability')) || 'System Availability (%)'; 
        const guaranteeKey = keys.find(k => k.toLowerCase().includes('guarantee')) || 'Contractual Guarantee (%)';

        // Filter defaults
        const defaultPlant = selectedPlant || (sourceData[0] ? String(sourceData[0][plantKey]).trim() : '');
        const defaultYear = selectedYear || (sourceData[0] ? String(sourceData[0][yearKey]).trim() : '2024');

        if (!selectedPlant) setSelectedPlant(defaultPlant);
        if (!selectedYear) setSelectedYear(defaultYear);

        // Process Data
        const processed = [];
        const monthOrder = { 'jan':1, 'january':1, 'feb':2, 'february':2, 'mar':3, 'march':3, 'apr':4, 'april':4, 'may':5, 'jun':6, 'june':6, 'jul':7, 'july':7, 'aug:8':8, 'august':8, 'sep':9, 'september':9, 'oct':10, 'october':10, 'nov':11, 'november':11, 'dec':12, 'december':12 };

        sourceData.forEach(d => {
             const p = String(d[plantKey]).trim();
             const y = String(d[yearKey]).trim();
             
             if (p === defaultPlant && y === defaultYear) {
                 const mRaw = String(d[monthKey]).trim();
                 let mNorm = mRaw; // Keep raw for display
                 let mSort = 0;
                 
                 // Sort logic
                 if (/^\d+$/.test(mRaw)) mSort = parseInt(mRaw, 10);
                 else mSort = monthOrder[mRaw.toLowerCase()] || 0;

                 const availVal = parseFloat(String(d[availKey]).replace('%',''));
                 const targetVal = parseFloat(String(d[guaranteeKey]).replace('%','')) || 99.0; // Default target 99% if missing

                 if (!isNaN(availVal)) {
                     processed.push({
                         month: mRaw,
                         sortIdx: mSort,
                         avail: availVal,
                         target: targetVal
                     });
                 }
             }
        });

        // Sort by month index
        processed.sort((a,b) => a.sortIdx - b.sortIdx);
        setChartData(processed);

    }, [data.avail, selectedPlant, selectedYear]);

    // Extract unique Plants and Years for Dropdowns
    const { plants, years } = useMemo(() => {
        const pSet = new Set();
        const ySet = new Set();
        (data.avail || []).forEach(d => {
             // Basic detection again for dropdown population
             const keys = Object.keys(d);
             const pk = keys.find(k => k.toLowerCase().includes('plant')) || 'Plant name';
             const yk = keys.find(k => k.toLowerCase().includes('year')) || 'Year';
             if(d[pk]) pSet.add(String(d[pk]).trim());
             if(d[yk]) ySet.add(String(d[yk]).trim());
        });
        return {
            plants: Array.from(pSet).sort(),
            years: Array.from(ySet).sort().reverse()
        };
    }, [data.avail]);

    return (
        <div>
            <div style={styles.header}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Plant Availability Trend (%)</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={styles.select}>
                      {plants.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={styles.select}>
                      {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
            </div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    {chartData.length > 0 ? (
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis domain={[90, 100]} />
                        <Tooltip content={<CustomTooltip unit="%" />} />
                        <Legend />
                        <Area type="monotone" dataKey="avail" fill="#dbeafe" stroke="#3b82f6" name="Actual Availability" />
                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Contractual Guarantee" />
                    </ComposedChart>
                    ) : (
                        <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8'}}>No availability data for selected filters.</div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DowntimeBreakdownView = () => {
    // Mock Data
    const data = [
        { reason: 'Inverter Fault', hours: 45, color: '#ef4444' },
        { reason: 'Grid Outage', hours: 32, color: '#f59e0b' },
        { reason: 'Prev. Maintenance', hours: 24, color: '#3b82f6' },
        { reason: 'Panel Cleaning', hours: 18, color: '#10b981' },
        { reason: 'Comms Failure', hours: 12, color: '#8b5cf6' },
    ];

    return (
        <div>
             <div style={styles.header}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Downtime Breakdown (Hours)</h1>
            </div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} layout="vertical" margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="reason" type="category" width={120} />
                        <Tooltip content={<CustomTooltip unit=" hrs" />} />
                        <Legend />
                        <Bar dataKey="hours" name="Lost Hours" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DowntimeParetoView = () => {
    // Mock Data for Pareto
    const data = [
        { type: 'Inverter 01', hours: 50, cumulative: 50 },
        { type: 'Transformer A', hours: 30, cumulative: 80 },
        { type: 'ACB Tripping', hours: 15, cumulative: 95 },
        { type: 'String Fuse', hours: 5, cumulative: 100 },
    ];

    return (
        <div>
             <div style={styles.header}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Downtime Pareto Chart</h1>
            </div>
            <div style={styles.card}>
                 <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis yAxisId="left" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="hours" name="Downtime Hours" fill="#3b82f6" barSize={50} />
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative %" stroke="#ef4444" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MTBFView = () => {
    // Mock Data for MTBF/MTTR
    const data = [
        { month: 'Jan', mtbf: 450, mttr: 2.5 },
        { month: 'Feb', mtbf: 520, mttr: 1.8 },
        { month: 'Mar', mtbf: 480, mttr: 2.1 },
        { month: 'Apr', mtbf: 600, mttr: 1.5 },
        { month: 'May', mtbf: 580, mttr: 1.6 },
        { month: 'Jun', mtbf: 650, mttr: 1.2 },
    ];

    return (
        <div>
             <div style={styles.header}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>MTBF & MTTR Trends</h1>
            </div>
            <div style={styles.grid2}>
                <div style={styles.card}>
                    <h4 style={{marginBottom:'20px', color:'#334155'}}>Mean Time Between Failures (MTBF)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip unit=" hrs" />} />
                            <Area type="monotone" dataKey="mtbf" stroke="#10b981" fill="#ecfdf5" name="MTBF (Hrs)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div style={styles.card}>
                    <h4 style={{marginBottom:'20px', color:'#334155'}}>Mean Time To Repair (MTTR)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip unit=" hrs" />} />
                            <Line type="monotone" dataKey="mttr" stroke="#f59e0b" strokeWidth={3} name="MTTR (Hrs)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- RESTORED COMPONENTS FOR PR & LOSSES ---

const PRTrendView = ({ data }) => {
    const [selectedPlant, setSelectedPlant] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [selectedType, setSelectedType] = useState('All');
    
    // Toggle for Expected PR
    const [showExpected, setShowExpected] = useState(false);

    // Helper: Parse Numeric Percentage
    const parsePct = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const str = String(val).replace('%', '').trim();
        const num = parseFloat(str);
        return isNaN(num) ? null : num;
    };

    // Helper: Month Sorter
    const getMonthIndex = (m) => {
        if (!m) return -1;
        const str = String(m).toLowerCase().trim();
        // Check numeric
        if (/^\d+$/.test(str)) {
            const n = parseInt(str, 10);
            return (n >= 1 && n <= 12) ? n : -1;
        }
        const map = {
            jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,
            jul:7,july:7,aug:8,august:8,sep:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12
        };
        const key = str.slice(0,3);
        return map[str] || map[key] || -1;
    };

    const { options, chartData } = useMemo(() => {
        const sourceData = data.pr || [];
        const plants = new Set();
        const years = new Set();
        const levels = new Set(['All']);
        const types = new Set(['All']);
        
        // Exact Headers per requirement
        const HEADER_PLANT = 'Plant name';
        const HEADER_YEAR = 'Year';
        const HEADER_MONTH = 'Month';
        const HEADER_LEVEL = 'PR Level';
        const HEADER_TYPE = 'Type';
        const HEADER_ACTUAL = 'Actual PR (%)';
        const HEADER_TCOR = 'Actual PR (T-cor.) %';
        const HEADER_EXPECTED = 'Expected PR %';
        const HEADER_REMARKS = 'Remarks';

        // 1. Extract Options
        sourceData.forEach(d => {
            if(d[HEADER_PLANT]) plants.add(String(d[HEADER_PLANT]).trim());
            if(d[HEADER_YEAR]) years.add(String(d[HEADER_YEAR]).trim());
            if(d[HEADER_LEVEL]) levels.add(String(d[HEADER_LEVEL]).trim());
            if(d[HEADER_TYPE]) types.add(String(d[HEADER_TYPE]).trim());
        });

        const sortedYears = Array.from(years).sort().reverse();
        const sortedPlants = Array.from(plants).sort();
        
        // Default Selections Logic
        const activePlant = selectedPlant || sortedPlants[0] || '';
        const activeYear = selectedYear || sortedYears[0] || '';

        // 2. Filter & Process Data
        const processed = [];
        
        sourceData.forEach(d => {
            // Safe string comparison
            const p = String(d[HEADER_PLANT] || '').trim();
            const y = String(d[HEADER_YEAR] || '').trim();
            const l = String(d[HEADER_LEVEL] || '').trim();
            const t = String(d[HEADER_TYPE] || '').trim();

            const matchPlant = p === activePlant;
            const matchYear = y === activeYear;
            const matchLevel = selectedLevel === 'All' || l === selectedLevel;
            const matchType = selectedType === 'All' || t === selectedType;

            if (matchPlant && matchYear && matchLevel && matchType) {
                const mRaw = d[HEADER_MONTH];
                const mIdx = getMonthIndex(mRaw);

                if (mIdx !== -1) {
                    processed.push({
                        monthName: mRaw,
                        monthIdx: mIdx,
                        actual: parsePct(d[HEADER_ACTUAL]),
                        tcor: parsePct(d[HEADER_TCOR]),
                        expected: parsePct(d[HEADER_EXPECTED]),
                        remarks: d[HEADER_REMARKS] || '', // Capture Remarks
                        plant: p,
                        year: y
                    });
                }
            }
        });

        // 3. Aggregate 
        const grouped = {};
        processed.forEach(item => {
             if(!grouped[item.monthIdx]) {
                 grouped[item.monthIdx] = { ...item, count: 1 };
             } else {
                 // Summing up for average later
                 const g = grouped[item.monthIdx];
                 if (item.actual !== null) g.actual = (g.actual || 0) + item.actual;
                 if (item.tcor !== null) g.tcor = (g.tcor || 0) + item.tcor;
                 if (item.expected !== null) g.expected = (g.expected || 0) + item.expected;
                 g.count++;
                 // Concatenate remarks if different and not empty
                 if (item.remarks && !g.remarks.includes(item.remarks)) {
                     g.remarks = g.remarks ? `${g.remarks}; ${item.remarks}` : item.remarks;
                 }
             }
        });

        const finalData = Object.values(grouped).map(g => ({
            ...g,
            actual: g.actual !== null ? parseFloat((g.actual / g.count).toFixed(2)) : null,
            tcor: g.tcor !== null ? parseFloat((g.tcor / g.count).toFixed(2)) : null,
            expected: g.expected !== null ? parseFloat((g.expected / g.count).toFixed(2)) : null,
        })).sort((a,b) => a.monthIdx - b.monthIdx);

        return {
            options: { plants: sortedPlants, years: sortedYears, levels: Array.from(levels).sort(), types: Array.from(types).sort() },
            chartData: finalData
        };
    }, [data.pr, selectedPlant, selectedYear, selectedLevel, selectedType]);

    // Initial Default Setting
    useEffect(() => {
        if (!selectedPlant && options.plants.length > 0) setSelectedPlant(options.plants[0]);
        if (!selectedYear && options.years.length > 0) setSelectedYear(options.years[0]);
    }, [options, selectedPlant, selectedYear]);

    // Custom Tooltip for detailed view including Remarks
    const PRTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div style={{ background: 'rgba(255, 255, 255, 0.98)', padding: '16px', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '220px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px', color: '#334155', borderBottom:'1px solid #e2e8f0', paddingBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        {dataPoint.plant} - {label} {dataPoint.year}
                    </p>
                    {payload.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '6px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                <div style={{ width: 10, height: 10, backgroundColor: p.color, borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight:'500' }}>{p.name}</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>{p.value?.toFixed(2)}%</span>
                        </div>
                    ))}
                    {/* Display Remarks if present */}
                    {dataPoint.remarks && (
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>
                           <span style={{fontWeight:'700', color:'#334155', display:'block', fontSize:'0.7rem', textTransform:'uppercase', marginBottom:'2px'}}>Remarks:</span> 
                           {dataPoint.remarks}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            {/* Filters Header */}
            <div style={styles.header}>
                <div>
                   <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color:'#0f172a' }}>PR (Performance Ratio) Trend</h1>
                   <p style={{ color: '#64748b', marginTop: '4px' }}>Analyze monthly PR trends and anomalies.</p>
                </div>
                
            </div>

            {/* Filter Controls Row */}
            <div style={{...styles.card, padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', background: 'white'}}>
                 
                 {/* Plant Filter */}
                 <div style={{flex: '1 1 200px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Plant Name</label>
                    <select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                        {options.plants.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>

                 {/* Year Filter */}
                 <div style={{flex: '0 1 120px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Year</label>
                    <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                        {options.years.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>

                 {/* PR Level Filter */}
                 {options.levels.length > 0 && (
                     <div style={{flex: '0 1 140px'}}>
                        <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>PR Level</label>
                        <select value={selectedLevel} onChange={e=>setSelectedLevel(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                            {options.levels.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                     </div>
                 )}

                 {/* Type Filter */}
                 {options.types.length > 0 && (
                     <div style={{flex: '0 1 140px'}}>
                        <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Type</label>
                        <select value={selectedType} onChange={e=>setSelectedType(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                            {options.types.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                 )}
                 
                 {/* Toggle Button */}
                 <div style={{flex: '0 0 auto', paddingBottom:'2px'}}>
                    <button 
                        onClick={() => setShowExpected(!showExpected)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: showExpected ? '1px solid #10b981' : '1px solid #e2e8f0',
                            background: showExpected ? '#ecfdf5' : 'white',
                            color: showExpected ? '#10b981' : '#64748b',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        {showExpected ? <CheckCircle size={18}/> : <div style={{width:18, height:18, borderRadius:'50%', border:'2px solid #cbd5e0'}}></div>}
                        Show Expected PR %
                    </button>
                 </div>
            </div>
            
            {/* CHART: PR Monthly Trend */}
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={450}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="monthName" tick={{fontSize:12, fill:'#64748b'}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis unit="%" axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#64748b'}} domain={['auto', 'auto']} />
                        <Tooltip content={<PRTooltip />} cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray:'4 4'}} />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        
                        {/* Series 1: Actual PR (%) - Always Show */}
                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="Actual PR (%)" activeDot={{r:6}} dot={{r:4, strokeWidth:2, fill:'white'}} />
                        
                        {/* Series 2: Actual PR (T-cor.) % - Always Show */}
                        <Line type="monotone" dataKey="tcor" stroke="#f59e0b" strokeWidth={2} name="Actual PR (T-cor.) %" activeDot={{r:6}} dot={{r:4, strokeWidth:2, fill:'white'}} />
                        
                        {/* Series 3: Expected PR % - Conditional */}
                        {showExpected && (
                            <Line type="monotone" dataKey="expected" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Expected PR %" activeDot={{r:6}} dot={false} connectNulls={false} />
                        )}

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const PRScatterView = ({ data }) => {
    // 1. Controls State
    const [selectedPlant, setSelectedPlant] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [prMetric, setPrMetric] = useState('Actual PR (%)'); // Toggle: 'Actual PR (%)' or 'Actual PR (T-cor.) %'

    // 2. Data Processing: Match PR and Irradiance
    const { chartData, plants, years } = useMemo(() => {
        const prSource = data.pr || [];
        const irrSource = data.irr || [];

        // Build Option Sets
        const pSet = new Set();
        const ySet = new Set();

        // ---------------------------------------------------------
        // A) Index Irradiance Data (Source B)
        // Key: "Plant|Year|NormalizedMonth" -> Value: Number
        // ---------------------------------------------------------
        const irrMap = new Map();
        
        irrSource.forEach(d => {
            // Flexible header detection for Plant/Year/Month in Irr sheet
            const keys = Object.keys(d);
            const keyPlant = keys.find(k => k.toLowerCase().includes('plant')) || 'Plant Name';
            const keyYear = keys.find(k => k.toLowerCase().includes('year')) || 'Year';
            const keyMonth = keys.find(k => k.toLowerCase().includes('month')) || 'Month';
            const keyVal = 'POA Irr Act. (kWh/m2)'; // Exact per requirement

            const p = String(d[keyPlant] || '').trim();
            const y = String(d[keyYear] || '').trim();
            const mRaw = String(d[keyMonth] || '').trim();
            const m = normalizeMonth(mRaw); // Reuse existing utility
            const val = parseFloat(String(d[keyVal] || '').replace(/,/g, ''));

            if (p && y && m !== 'Unknown' && !isNaN(val)) {
                const compositeKey = `${p}|${y}|${m}`;
                irrMap.set(compositeKey, val);
                
                // Add to options lists
                pSet.add(p);
                ySet.add(y);
            }
        });

        // ---------------------------------------------------------
        // B) Process PR Data (Source A) & Join
        // ---------------------------------------------------------
        const points = [];

        prSource.forEach(d => {
            // Exact Headers from PR Sheet
            const p = String(d['Plant name'] || '').trim();
            const y = String(d['Year'] || '').trim();
            const mRaw = String(d['Month'] || '').trim();
            const m = normalizeMonth(mRaw);
            
            if (p && y && m !== 'Unknown') {
                pSet.add(p);
                ySet.add(y);

                // Try to find matching Irradiance
                const compositeKey = `${p}|${y}|${m}`;
                const irrValue = irrMap.get(compositeKey);

                if (irrValue !== undefined) {
                    // We have a match! Now get the selected PR value
                    const prRaw = String(d[prMetric] || '').replace('%', '');
                    const prValue = parseFloat(prRaw);

                    if (!isNaN(prValue)) {
                        points.push({
                            plant: p,
                            year: y,
                            month: mRaw, // Keep original month name for display
                            x: irrValue, // Irradiance (X-axis)
                            y: prValue,  // PR (Y-axis)
                            remarks: d['Remarks'] || ''
                        });
                    }
                }
            }
        });

        const sortedPlants = Array.from(pSet).sort();
        const sortedYears = Array.from(ySet).sort().reverse();

        // ---------------------------------------------------------
        // C) Apply Filters
        // ---------------------------------------------------------
        const activePlant = selectedPlant || sortedPlants[0] || '';
        const activeYear = selectedYear || sortedYears[0] || '';

        const filteredPoints = points.filter(pt => {
            const matchPlant = activePlant ? pt.plant === activePlant : true;
            const matchYear = activeYear ? pt.year === activeYear : true;
            return matchPlant && matchYear;
        });

        return {
            chartData: filteredPoints,
            plants: sortedPlants,
            years: sortedYears
        };
    }, [data, selectedPlant, selectedYear, prMetric]);

    // Sync default selections
    useEffect(() => {
        if (!selectedPlant && plants.length > 0) setSelectedPlant(plants[0]);
        if (!selectedYear && years.length > 0) setSelectedYear(years[0]);
    }, [plants, years, selectedPlant, selectedYear]);

    // Custom Tooltip
    const CustomScatterTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const pt = payload[0].payload;
            return (
                <div style={{ background: 'rgba(255, 255, 255, 0.98)', padding: '12px', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '200px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    <div style={{fontWeight:'700', color:'#334155', borderBottom:'1px solid #e2e8f0', paddingBottom:'6px', marginBottom:'8px'}}>
                        {pt.plant} | {pt.year} | {pt.month}
                    </div>
                    <div style={{fontSize:'0.85rem', display:'flex', flexDirection:'column', gap:'6px'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <span style={{color:'#64748b'}}>Irradiance:</span>
                            <span style={{fontWeight:'700', color:'#3b82f6'}}>{pt.x} kWh/m²</span>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <span style={{color:'#64748b'}}>{prMetric}:</span>
                            <span style={{fontWeight:'700', color:'#10b981'}}>{pt.y}%</span>
                        </div>
                        {pt.remarks && (
                             <div style={{marginTop:'4px', paddingTop:'4px', borderTop:'1px dashed #cbd5e1', fontStyle:'italic', color:'#ef4444', fontSize:'0.75rem'}}>
                                Note: {pt.remarks}
                             </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div style={styles.header}>
                <div>
                   <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color:'#0f172a' }}>PR vs Irradiance Scatter</h1>
                   <p style={{ color: '#64748b', marginTop: '4px' }}>Correlation between Performance Ratio and Irradiance.</p>
                </div>
            </div>

            {/* Controls Row */}
            <div style={{...styles.card, padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', background: 'white'}}>
                 
                 {/* Plant Dropdown */}
                 <div style={{flex: '1 1 200px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Plant Name</label>
                    <select value={selectedPlant} onChange={e=>setSelectedPlant(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                        {plants.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>

                 {/* Year Dropdown */}
                 <div style={{flex: '0 1 120px'}}>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>Year</label>
                    <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} style={{...styles.select, width: '100%', border: '1px solid #cbd5e1'}}>
                        {years.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>

                 {/* PR Series Toggle */}
                 <div style={{flex: '0 0 auto'}}>
                     <label style={{display:'block', fontSize:'0.8rem', fontWeight:'600', marginBottom:'6px', color:'#64748b'}}>PR Metric</label>
                     <div style={{display:'flex', background:'#f1f5f9', padding:'4px', borderRadius:'8px', gap:'4px'}}>
                         <button 
                            onClick={() => setPrMetric('Actual PR (%)')}
                            style={{
                                padding:'8px 16px', borderRadius:'6px', fontSize:'0.85rem', fontWeight:'600', border:'none', cursor:'pointer',
                                background: prMetric === 'Actual PR (%)' ? 'white' : 'transparent',
                                color: prMetric === 'Actual PR (%)' ? '#3b82f6' : '#64748b',
                                boxShadow: prMetric === 'Actual PR (%)' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                         >Actual PR</button>
                         <button 
                            onClick={() => setPrMetric('Actual PR (T-cor.) %')}
                            style={{
                                padding:'8px 16px', borderRadius:'6px', fontSize:'0.85rem', fontWeight:'600', border:'none', cursor:'pointer',
                                background: prMetric === 'Actual PR (T-cor.) %' ? 'white' : 'transparent',
                                color: prMetric === 'Actual PR (T-cor.) %' ? '#8b5cf6' : '#64748b',
                                boxShadow: prMetric === 'Actual PR (T-cor.) %' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                         >T-cor PR</button>
                     </div>
                 </div>
            </div>

            {/* Scatter Chart */}
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={450}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Irradiance" 
                            unit=" kWh/m²" 
                            domain={['auto', 'auto']}
                            label={{ value: 'POA Irr Act. (kWh/m2)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                        />
                        <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="PR" 
                            unit="%" 
                            domain={['auto', 'auto']} 
                            label={{ value: prMetric, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                        />
                        <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name={prMetric} data={chartData} fill={prMetric === 'Actual PR (%)' ? '#3b82f6' : '#8b5cf6'} shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
                {chartData.length === 0 && (
                    <div style={{textAlign:'center', padding:'20px', color:'#94a3b8', fontStyle:'italic'}}>
                        No matching data points found for selected filters. Ensure both PR and Irradiance data exist for this period.
                    </div>
                )}
            </div>
        </div>
    );
};

const LossWaterfallView = () => {
    const data = [
        { name: 'Theoretical Energy', value: 1000, fill: '#94a3b8' }, // Base
        { name: 'Temperature Loss', value: -120, fill: '#ef4444' },
        { name: 'Soiling Loss', value: -50, fill: '#f59e0b' },
        { name: 'Inverter Loss', value: -30, fill: '#f97316' },
        { name: 'Grid Availability', value: -15, fill: '#eab308' },
        { name: 'Cable Loss', value: -20, fill: '#84cc16' },
        { name: 'Net Energy Export', value: 765, fill: '#3b82f6' }, // Result
    ];

    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Energy Loss Waterfall Analysis</h1></div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis label={{ value: 'MWh', angle: -90, position: 'insideLeft' }} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Legend />
                        <Bar dataKey="value" name="Energy Impact (MWh)" label={{ position: 'top' }}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- RESTORED COMPONENTS FOR PV CLEANING / SOILING IMPACT ---

const PrePostCleaningView = () => {
    const data = [
        { cycle: 'Cycle 1 (Jan)', pre: 78.5, post: 81.2, gain: 2.7 },
        { cycle: 'Cycle 2 (Mar)', pre: 77.8, post: 80.5, gain: 2.7 },
        { cycle: 'Cycle 3 (May)', pre: 76.5, post: 80.0, gain: 3.5 },
        { cycle: 'Cycle 4 (Jul)', pre: 78.0, post: 81.5, gain: 3.5 },
    ];
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Pre vs Post Cleaning Gain</h1></div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="cycle" />
                        <YAxis unit="%" domain={[70, 90]} />
                        <Tooltip content={<CustomTooltip unit="%" />} />
                        <Legend />
                        <Bar dataKey="pre" name="Pre-Cleaning PR" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="post" name="Post-Cleaning PR" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const SoilingTrendView = () => {
    const data = [
        { day: 'Day 1', loss: 1.0 }, { day: 'Day 5', loss: 1.5 }, { day: 'Day 10', loss: 2.2 },
        { day: 'Day 15', loss: 3.0 }, { day: 'Day 20 (Clean)', loss: 3.8 }, { day: 'Day 21', loss: 0.5 },
        { day: 'Day 25', loss: 1.2 }, { day: 'Day 30', loss: 1.8 }
    ];
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Soiling Trend / Cleaning Cycle</h1></div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis unit="%" label={{ value: 'Soiling Loss (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip unit="%" />} />
                        <Legend />
                        <Area type="monotone" dataKey="loss" stroke="#f59e0b" fill="#fef3c7" name="Estimated Soiling Loss" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const CleaningFreqView = () => {
    const data = [
        { freq: '15 Days', pr_gain: 1.5 },
        { freq: '30 Days', pr_gain: 3.2 },
        { freq: '45 Days', pr_gain: 4.5 },
        { freq: '60 Days', pr_gain: 5.1 }, // Diminishing returns maybe? or higher risk
    ];
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Cleaning Frequency vs Performance</h1></div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="freq" />
                        <YAxis unit="%" label={{ value: 'Avg PR Gain (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomTooltip unit="%" />} />
                        <Legend />
                        <Line type="monotone" dataKey="pr_gain" stroke="#8b5cf6" strokeWidth={3} dot={{r:6}} name="PR Gain" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- NEW COMPONENTS FOR INVERTER / BLOCK LEVEL PERFORMANCE ---

const InvRankingView = () => {
    // Mock Data
    const data = [
        { inv: 'Inv-01', yield: 4.5 }, { inv: 'Inv-04', yield: 4.4 }, { inv: 'Inv-02', yield: 4.3 },
        { inv: 'Inv-05', yield: 4.2 }, { inv: 'Inv-03', yield: 4.1 }, { inv: 'Inv-06', yield: 3.8 }
    ].sort((a,b) => b.yield - a.yield);

    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Inverter Comparison Ranking</h1></div>
            <div style={styles.card}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} layout="vertical" margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="inv" type="category" width={80} />
                        <Tooltip content={<CustomTooltip unit=" kWh/kWp" />} />
                        <Legend />
                        <Bar dataKey="yield" name="Specific Yield" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                             {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.yield < 4.0 ? '#ef4444' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const InvHeatmapView = () => {
    // Mock Data for Heatmap (Month x Inverter)
    const data = [
        { x: 1, y: 1, z: 98 }, { x: 1, y: 2, z: 97 }, { x: 1, y: 3, z: 92 },
        { x: 2, y: 1, z: 99 }, { x: 2, y: 2, z: 96 }, { x: 2, y: 3, z: 94 },
        { x: 3, y: 1, z: 97 }, { x: 3, y: 2, z: 95 }, { x: 3, y: 3, z: 88 },
    ];
    // Simple placeholder since full heatmap is complex
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>Heatmap Performance</h1></div>
            <div style={styles.card}>
                <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
                    <Activity size={48} style={{marginBottom:'16px', color:'#cbd5e0'}} />
                    <p>Heatmap visualization (Month vs Inverter) coming soon.</p>
                </div>
            </div>
        </div>
    );
};


const PerformanceAnalysisView = ({ data, subTab }) => {
  if (subTab === 'pa-gen-p50') return <GenerationOverview data={data} />;
  if (subTab === 'pa-poa') return <IrradianceOverview data={data} />;
  if (subTab === 'pa-sy') return <SYAnalysisView data={data} />;
  
  // Availability Sub-menus
  if (subTab === 'pa-avail-trend') return <AvailTrendView data={data} />; // Passed data here
  if (subTab === 'pa-downtime-breakdown') return <DowntimeBreakdownView />;
  if (subTab === 'pa-downtime-pareto') return <DowntimeParetoView />;
  if (subTab === 'pa-mtbf') return <MTBFView />;

  // NEW PR & Losses Sub-menus
  if (subTab === 'pa-pr-trend') return <PRTrendView data={data} />; // Updated to pass data
  if (subTab === 'pa-pr-scatter') return <PRScatterView data={data} />; // Updated to pass data
  if (subTab === 'pa-loss-waterfall') return <LossWaterfallView />;

  // NEW PV Cleaning / Soiling Sub-menus
  if (subTab === 'pa-cleaning-gain') return <PrePostCleaningView />;
  if (subTab === 'pa-soiling-trend') return <SoilingTrendView />;
  if (subTab === 'pa-cleaning-freq') return <CleaningFreqView />;

  // NEW Inverter / Block Performance Sub-menus
  if (subTab === 'pa-inv-ranking') return <InvRankingView />;
  if (subTab === 'pa-inv-heatmap') return <InvHeatmapView />;

  // Existing Generic Logic (fallback)
  return <GenerationOverview data={data} />;
};

const GeneralOMView = ({ subTab }) => {
  const tasks = [{ date: '2024-01-15', area: 'Zone A', status: 'Completed', notes: 'Routine cycle' }, { date: '2024-02-20', area: 'Zone B', status: 'Completed', notes: 'Grass height > 15cm' }];
  const getTitle = () => {
    switch(subTab) { case 'om-cleaning': return 'PV Cleaning Schedule'; case 'om-reworks': return 'PV Reworks & Defect Rectification'; case 'om-grass': return 'Grass Cutting & Herbicides'; default: return 'O&M Works'; }
  };
  return (
    <div>
      <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>{getTitle()}</h1><button style={styles.buttonPrimary}>+ Add Log</button></div>
      <div style={styles.card}><table style={styles.table}><thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Area / Plant</th><th style={styles.th}>Status</th><th style={styles.th}>Notes</th></tr></thead><tbody>{tasks.map((t, i) => (<tr key={i}><td style={styles.td}>{t.date}</td><td style={styles.td}>{t.area}</td><td style={styles.td}><span style={{background:'#dcfce7', color:'#15803d', padding:'4px 10px', borderRadius:'99px', fontSize:'0.75rem', fontWeight:'600'}}>{t.status}</span></td><td style={styles.td}>{t.notes}</td></tr>))}</tbody></table></div>
    </div>
  );
};

const WorkforceView = ({ subTab }) => {
    const getTitle = () => {
        switch(subTab) { case 'wf-manpower': return 'Weekly Manpower Arrangement'; case 'wf-service': return 'Staff Service Period'; case 'wf-competency': return 'Staff Competency Profile'; default: return 'Workforce Management'; }
    };
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>{getTitle()}</h1><button style={styles.buttonPrimary}>Manage</button></div>
            <div style={styles.card}><div style={{padding:'40px', textAlign:'center', color:'#64748b'}}><Users size={48} style={{marginBottom:'16px', color:'#cbd5e0'}} /><p>Detailed view for <b>{getTitle()}</b> is currently under development.</p></div></div>
        </div>
    );
};

const SparePartsView = ({ subTab }) => {
    const getTitle = () => {
        switch(subTab) { case 'sp-critical': return 'Critical Spare Parts (To Be Procured)'; case 'sp-consumable': return 'Consumable Items'; case 'sp-repair': return 'Spare Parts Under Repair'; case 'sp-history': return 'Spare Parts Consumption History'; case 'sp-cost': return 'Repair Cost & Warranty Tracking'; default: return 'Spare Part & Material'; }
    };
    return (
        <div>
            <div style={styles.header}><h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color:'#0f172a' }}>{getTitle()}</h1><button style={styles.buttonPrimary}>Update Inventory</button></div>
            <div style={styles.card}><div style={{padding:'40px', textAlign:'center', color:'#64748b'}}><Package size={48} style={{marginBottom:'16px', color:'#cbd5e0'}} /><p>Inventory management for <b>{getTitle()}</b> coming soon.</p></div></div>
        </div>
    );
};

const GenTrendView = ({ data }) => {
    return <GenerationOverview data={data} />;
};

// -----------------------------------------------------------------------------
// MAIN APP COMPONENT
// -----------------------------------------------------------------------------

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({ 
      'performance': true, 
      'om': true, 
      'wf': true, 
      'sp': true, 
      'avail': true, // Availability group
      'pr_losses': true, // NEW PR & Losses group
      'cleaning': true, // NEW Cleaning group
      'inv_perf': true // NEW Inverter Perf group
  }); 
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ specs: [], pr: [], iod: [], gen: [], irr: [], forecast: [], sy: [], avail: [] }); 
  const [error, setError] = useState(null);
  
  const [pendingTasks, setPendingTasks] = useState([
      { id: 1, title: 'Check Inverter 04 Fan', assignee: 'Ahmad', priority: 'High', due: '2026-02-01', status: 'Pending' },
      { id: 2, title: 'Submit Monthly Report', assignee: 'Sarah', priority: 'Medium', due: '2026-02-05', status: 'Pending' }
  ]);

  const fetchSheetData = async (gid) => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const text = await response.text();
      return parseCSV(text);
    } catch (error) {
      console.error(`Error fetching sheet gid=${gid}:`, error);
      return null; 
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const specsData = await fetchSheetData('0');
        const iodData = await fetchSheetData('238655628');
        const newGenData = await fetchSheetData('1994118950');
        const newPRData = await fetchSheetData('490767397');
        const newIrrData = await fetchSheetData('881151372'); 
        const forecastData = await fetchSheetData('1371144757'); 
        const syData = await fetchSheetData('121350203'); 
        const availData = await fetchSheetData('635882056'); // NEW: Fetch Availability Data

        setData({
          specs: specsData || getMockData(TABS.SPECS), 
          iod: iodData || getMockData(TABS.IOD_COD),
          genTrend: newGenData, 
          pr: newPRData || getMockData(TABS.PR), 
          gen: newGenData || getMockData(TABS.GEN),
          irr: newIrrData || [],
          forecast: forecastData || [],
          sy: syData || [],
          avail: availData || [] // Store availability data
        });
        setLoading(false);
      } catch (err) {
        setError("Could not load data.");
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const NavItem = ({ id, icon: Icon, label, hasSub, menuKey, onClick }) => {
    const [hover, setHover] = useState(false);
    return (
      <div 
        style={{ ...styles.navItem, ...(activeTab === id ? styles.navItemActive : (hover ? styles.navItemHover : {})) }}
        onClick={() => hasSub ? toggleMenu(menuKey) : (onClick ? onClick() : setActiveTab(id))}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Icon size={18} />
        <span style={{flex:1}}>{label}</span>
        {hasSub && (expandedMenus[menuKey] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>)}
      </div>
    );
  };

  const SubItem = ({ id, label, style }) => (
    <div style={{ ...styles.subNavItem, ...(activeTab === id ? styles.subNavItemActive : {}), ...style }} onClick={() => setActiveTab(id)}>{label}</div>
  );

  const getPendingCount = () => pendingTasks.filter(t => t.status === 'Pending').length;
  const getOverdueCount = () => pendingTasks.filter(t => t.status === 'Pending' && checkIsOverdue(t.due)).length;

  if (loading) return <div style={styles.loader}>Loading...</div>;

  const overdueCount = getOverdueCount();

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}><div style={styles.logoIcon}><Zap size={18} /></div>Ir. Bukhari | OMP</div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="specs" icon={FileText} label="Technical Specifications" />
          <NavItem id="iod" icon={Calendar} label="IOD & COD" />
          
          <NavItem hasSub menuKey="performance" icon={Zap} label="Performance Analysis" />
          {expandedMenus['performance'] && (
            <>
                <SubItem id="pa-gen-p50" label="Actual Gen VS P50, P75, P90" />
                <SubItem id="pa-poa" label="POA Irr. Exp VS Actual" />
                <SubItem id="pa-sy" label="SY Expected VS Actual" />
                
                {/* Collapsible Group for Availability & Downtime */}
                <div style={{...styles.subNavItem, justifyContent:'space-between', color: expandedMenus['avail'] ? '#ffffff' : '#94a3b8', cursor:'pointer'}} onClick={() => toggleMenu('avail')}>
                    <span>Availability & Downtime Analysis</span>
                    {expandedMenus['avail'] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
                {expandedMenus['avail'] && (
                    <>
                        <SubItem id="pa-avail-trend" label="1) Plant Availability Trend" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-downtime-breakdown" label="2) Downtime Breakdown" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-downtime-pareto" label="3) Downtime Pareto Chart" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-mtbf" label="4) MTBF & MTTR Trend" style={{paddingLeft: '72px'}} />
                    </>
                )}

                {/* NEW Collapsible Group for PR & Losses */}
                <div style={{...styles.subNavItem, justifyContent:'space-between', color: expandedMenus['pr_losses'] ? '#ffffff' : '#94a3b8', cursor:'pointer'}} onClick={() => toggleMenu('pr_losses')}>
                    <span>Performance Ratio & Losses</span>
                    {expandedMenus['pr_losses'] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
                {expandedMenus['pr_losses'] && (
                    <>
                        <SubItem id="pa-pr-trend" label="1) PR (Performance Ratio) Trend" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-pr-scatter" label="2) PR vs Irradiance Scatter" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-loss-waterfall" label="3) Energy Loss Waterfall" style={{paddingLeft: '72px'}} />
                    </>
                )}

                {/* NEW Collapsible Group for PV Cleaning */}
                <div style={{...styles.subNavItem, justifyContent:'space-between', color: expandedMenus['cleaning'] ? '#ffffff' : '#94a3b8', cursor:'pointer'}} onClick={() => toggleMenu('cleaning')}>
                    <span>PV Cleaning / Soiling Impact</span>
                    {expandedMenus['cleaning'] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
                {expandedMenus['cleaning'] && (
                    <>
                        <SubItem id="pa-cleaning-gain" label="1) Pre vs Post Cleaning Gain" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-soiling-trend" label="2) Soiling Trend / Cleaning Cycle" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-cleaning-freq" label="3) Cleaning Frequency vs Performance" style={{paddingLeft: '72px'}} />
                    </>
                )}
                
                {/* NEW Collapsible Group for Inverter/Block Level */}
                <div style={{...styles.subNavItem, justifyContent:'space-between', color: expandedMenus['inv_perf'] ? '#ffffff' : '#94a3b8', cursor:'pointer'}} onClick={() => toggleMenu('inv_perf')}>
                    <span>Inverter / Block level Performance</span>
                    {expandedMenus['inv_perf'] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </div>
                {expandedMenus['inv_perf'] && (
                    <>
                        <SubItem id="pa-inv-ranking" label="1) Inverter Comparison Ranking" style={{paddingLeft: '72px'}} />
                        <SubItem id="pa-inv-heatmap" label="2) Heatmap Performance (Month x Inverter)" style={{paddingLeft: '72px'}} />
                    </>
                )}

            </>
          )}

          <NavItem hasSub menuKey="om" icon={Wrench} label="General O&M Works" />
          {expandedMenus['om'] && (<><SubItem id="om-cleaning" label="PV Cleaning" /><SubItem id="om-reworks" label="PV Reworks" /><SubItem id="om-grass" label="Grass Cutting / Herbicides" /></>)}

          <NavItem hasSub menuKey="wf" icon={Users} label="Workforce & Competency" />
          {expandedMenus['wf'] && (<><SubItem id="wf-manpower" label="Weekly Manpower Arrangement" /><SubItem id="wf-service" label="Staff Service Period" /><SubItem id="wf-competency" label="Staff Competency Profile" /></>)}

          <NavItem hasSub menuKey="sp" icon={Package} label="Spare Part & Material" />
          {expandedMenus['sp'] && (<><SubItem id="sp-critical" label="Critical Spare Parts (To Be Procured)" /><SubItem id="sp-consumable" label="Consumable Items" /><SubItem id="sp-repair" label="Spare Parts Under Repair" /><SubItem id="sp-history" label="Spare Parts Consumption History" /><SubItem id="sp-cost" label="Repair Cost & Warranty Tracking" /></>)}
        </nav>
      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={{display:'flex', alignItems:'center', gap:'16px'}}><MenuIcon size={20} color="#64748b" style={{cursor:'pointer'}} /><span style={{fontSize:'0.9rem', color:'#64748b'}}>System Status: <span style={{color:'#10b981', fontWeight:'600'}}>Operational</span></span></div>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <div style={{position:'relative', cursor:'pointer'}}><Bell size={20} color={overdueCount > 0 ? "#ef4444" : "#64748b"} />{overdueCount > 0 ? (<div style={{position:'absolute', top:-6, right:-6, minWidth:18, height:18, background:'#ef4444', borderRadius:'9px', border:'2px solid white', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'}}>{overdueCount}</div>) : (<div style={{position:'absolute', top:-2, right:-2, width:8, height:8, background:'#10b981', borderRadius:'50%', border:'1px solid white'}}></div>)}</div>
            <div style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}><div style={{width:32, height:32, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}><User size={18} color="#64748b" /></div><span style={{fontSize:'0.9rem', fontWeight:'500', color:'#334155'}}>Ir. Bukhari</span></div>
          </div>
        </div>

        <div style={styles.contentContainer}>
          {error && <div style={{ marginBottom: '24px', padding: '16px', background: '#fef2f2', color: '#b91c1c', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>{error}</div>}

          {activeTab === 'dashboard' && <DashboardView data={data} onNavigate={setActiveTab} pendingCount={getPendingCount()} overdueCount={overdueCount} />}
          {activeTab === 'pending-tasks' && <PendingTasksView tasks={pendingTasks} setTasks={setPendingTasks} onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'financial' && <FinancialImpactView onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'compliance' && <ComplianceView onBack={() => setActiveTab('dashboard')} />}
          {activeTab === 'specs' && <SpecsView data={data} />}
          {activeTab === 'iod' && <IODView data={data} />}
          
          {activeTab.startsWith('pa-') && <PerformanceAnalysisView data={data} subTab={activeTab} />}
          {activeTab.startsWith('om-') && <GeneralOMView subTab={activeTab} />}
          {activeTab.startsWith('wf-') && <WorkforceView subTab={activeTab} />}
          {activeTab.startsWith('sp-') && <SparePartsView subTab={activeTab} />}
        </div>
      </div>
    </div>
  );
}
