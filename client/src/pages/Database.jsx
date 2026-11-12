import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Database,
  Download,
  Table,
  History,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DatabaseManagement() {
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'query' | 'audit'
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('Guests');
  const [tableData, setTableData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Raw SQL Query runner state
  const [sqlQuery, setSqlQuery] = useState('SELECT id, name, phone, email, address FROM Guests ORDER BY id DESC;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [executing, setExecuting] = useState(false);

  // Preset SQL templates
  const presets = [
    {
      label: 'SELECT All Guests',
      sql: 'SELECT id, name, phone, email, address, created_at FROM Guests ORDER BY id DESC;'
    },
    {
      label: 'INSERT New Guest',
      sql: "INSERT INTO Guests (name, phone, email, address) VALUES ('Aarav Patel', '+91 98765 43210', 'aarav@example.com', 'MG Road, Bangalore');"
    },
    {
      label: 'JOIN: Reservations with Guest & Rooms',
      sql: `SELECT 
  res.id as booking_id,
  g.name as guest_name,
  g.phone,
  res.check_in_date,
  res.check_out_date,
  res.status as booking_status,
  GROUP_CONCAT(r.room_number) as rooms
FROM Reservations res
JOIN Guests g ON res.guest_id = g.id
LEFT JOIN Reservation_Rooms rr ON res.id = rr.reservation_id
LEFT JOIN Rooms r ON rr.room_id = r.id
GROUP BY res.id
ORDER BY res.id DESC;`
    },
    {
      label: 'AGGREGATE: Room Count by Category',
      sql: `SELECT 
  rt.name as category,
  rt.base_price,
  COUNT(r.id) as total_rooms,
  SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) as available_now
FROM Room_Types rt
LEFT JOIN Rooms r ON rt.id = r.room_type_id
GROUP BY rt.id;`
    },
    {
      label: 'UPDATE: Room Status to Maintenance',
      sql: "UPDATE Rooms SET status = 'maintenance' WHERE room_number = '104';"
    }
  ];

  // Fetch tables and audit logs
  const fetchDbInfo = async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        api.get('/db/tables'),
        api.get('/db/audit-logs')
      ]);
      setTables(tRes.data);
      setAuditLogs(aRes.data);
    } catch (err) {
      toast.error('Failed to load database information');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tbl) => {
    setSelectedTable(tbl);
    setLoadingTable(true);
    try {
      const res = await api.get(`/db/table/${tbl}`);
      setTableData(res.data);
    } catch (err) {
      toast.error(`Failed to load data for table ${tbl}`);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchDbInfo();
  }, []);

  useEffect(() => {
    if (tables.length > 0) {
      fetchTableData(selectedTable || tables[0].name);
    }
  }, [tables.length]);

  const handleDownloadBackup = () => {
    api
      .get('/db/backup', { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        a.download = `grand_horrizon_hotel_${timestamp}.db`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Database backup downloaded successfully!');
      })
      .catch((err) => {
        toast.error('Failed to download database backup');
      });
  };

  // Run raw SQL
  const handleExecuteSql = async (overrideQuery) => {
    const q = overrideQuery || sqlQuery;
    if (!q || !q.trim()) return;

    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await api.post('/db/execute', { query: q });
      setQueryResult(res.data);
      if (res.data.type === 'SELECT') {
        toast.success(`Query returned ${res.data.rowCount} row(s)`);
      } else {
        toast.success(res.data.message);
      }
      // Refresh DB data
      fetchDbInfo();
      if (selectedTable) {
        fetchTableData(selectedTable);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setQueryError(msg);
      toast.error('SQL Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif-heading text-2xl font-bold text-navy-900 tracking-tight">
            SQLite Database & Audit Console
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Permanent physical storage at <code className="bg-cream-200 px-1.5 py-0.5 rounded text-navy-900 font-mono text-xs font-semibold">server/database/hotel.db</code>
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-navy-900" />
          <span>Download .db Backup</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-cream-200/70 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'tables'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Table className="w-3.5 h-3.5 text-gold-600" />
          <span>Tables & Schema Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'query'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-gold-600" />
          <span>Interactive SQL Query Runner</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-white text-navy-900 shadow-sm'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-gold-600" />
          <span>Database Alteration History ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Tables & Schema Explorer */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table List Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1 mb-2">
              SQLite Tables ({tables.length})
            </span>
            <div className="space-y-1.5">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => fetchTableData(t.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selectedTable === t.name
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-slate-700 border-cream-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Table className={`w-4 h-4 ${selectedTable === t.name ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold font-mono">{t.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      selectedTable === t.name
                        ? 'bg-navy-800 text-gold-400 font-bold'
                        : 'bg-cream-100 text-slate-600'
                    }`}
                  >
                    {t.rowCount} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Details & Data */}
          <div className="lg:col-span-3 space-y-6">
            {loadingTable || !tableData ? (
              <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center">
                <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Schema Structure Card */}
                <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif-heading text-base font-bold text-navy-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gold-600" />
                      <span>Schema: {tableData.tableName}</span>
                    </h3>
                    <span className="text-xs font-mono text-slate-400">PRAGMA table_info</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tableData.columns?.map((col) => (
                      <div
                        key={col.name}
                        className="p-2 bg-cream-50 rounded-xl border border-cream-200 text-xs"
                      >
                        <div className="flex items-center gap-1.5 font-bold font-mono text-navy-900">
                          {col.pk === 1 && <span className="text-gold-600 text-[10px]">PK</span>}
                          <span>{col.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                          {col.type} {col.notnull ? '• NOT NULL' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Rows Viewer */}
                <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                      Live Records ({tableData.rows?.length || 0})
                    </span>
                    <span className="text-xs text-slate-400">Direct SQL Query Execution</span>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider sticky top-0">
                          {tableData.columns?.map((col) => (
                            <th key={col.name} className="py-2.5 px-3 font-mono text-[11px]">
                              {col.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {tableData.rows?.length > 0 ? (
                          tableData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-cream-50/60 transition-colors">
                              {tableData.columns?.map((col) => (
                                <td key={col.name} className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                                  {row[col.name] !== null && row[col.name] !== undefined
                                    ? String(row[col.name])
                                    : <span className="text-slate-300 italic">NULL</span>}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={tableData.columns?.length || 1}
                              className="py-8 text-center text-slate-400 font-sans"
                            >
                              Table is empty.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Interactive SQL Query Runner */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-serif-heading text-base font-bold text-navy-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gold-600" />
                  <span>Execute Raw SQL Query</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct SQL execution against SQLite with auto-commit. All changes persist permanently on disk.
                </p>
              </div>

              <button
                onClick={() => handleExecuteSql()}
                disabled={executing || !sqlQuery.trim()}
                className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-60"
              >
                {executing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                    <span>Run SQL</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick SQL Examples:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSqlQuery(p.sql);
                      handleExecuteSql(p.sql);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-cream-200 border border-cream-200 text-navy-900 text-[11px] font-medium transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Editor Area */}
            <div>
              <textarea
                rows={4}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Type any SQL statement (e.g. INSERT INTO Guests ..., SELECT ..., UPDATE ...)"
                className="w-full p-4 font-mono text-xs bg-navy-950 text-gold-400 rounded-xl border border-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-500/50 leading-relaxed"
                spellCheck="false"
              />
            </div>

            {/* Error Message */}
            {queryError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">SQL Execution Failed</p>
                  <p className="mt-0.5">{queryError}</p>
                </div>
              </div>
            )}

            {/* Result for Mutation (INSERT / UPDATE / DELETE) */}
            {queryResult && queryResult.type === 'MUTATION' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">{queryResult.message}</p>
                  {queryResult.lastInsertRowid > 0 && (
                    <p className="font-mono text-[11px] mt-0.5 text-emerald-700">
                      Primary Key Generated: <strong>ID #{queryResult.lastInsertRowid}</strong>
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-600 mt-1">
                    ✓ This record is now saved permanently in <code className="font-bold">hotel.db</code> and reflected on the website!
                  </p>
                </div>
              </div>
            )}

            {/* Result for SELECT Query */}
            {queryResult && queryResult.type === 'SELECT' && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-cream-100 border-b border-cream-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-navy-900">
                    Query Results: {queryResult.rowCount} record(s)
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">Auto-committed</span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-cream-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider sticky top-0">
                        {queryResult.columns?.map((col) => (
                          <th key={col} className="py-2.5 px-3 font-mono text-[11px]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {queryResult.rows?.length > 0 ? (
                        queryResult.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-cream-50/60 transition-colors">
                            {queryResult.columns?.map((col) => (
                              <td key={col} className="py-2.5 px-3 text-slate-700 max-w-xs truncate">
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : <span className="text-slate-300 italic">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={queryResult.columns?.length || 1}
                            className="py-8 text-center text-slate-400 font-sans"
                          >
                            (0 rows returned)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Audit History */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-cream-200 bg-cream-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-serif-heading text-base font-bold text-navy-900">
                Audit Trail & Operation History
              </h3>
              <p className="text-xs text-slate-500">
                Log of who modified what record, table target, timestamp, and before/after values
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Audit_Logs Table</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-cream-100/70 border-b border-cream-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Table</th>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Changes (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => {
                    const isCreate = log.action === 'CREATE';
                    const isDelete = log.action.includes('DELETE');

                    return (
                      <tr key={log.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{log.full_name || 'System'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">@{log.username || 'system'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCreate
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDelete
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-navy-900">
                          {log.table_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          #{log.record_id || 'N/A'}
                        </td>
                        <td className="py-3 px-4 max-w-md truncate font-mono text-[10px] text-slate-600">
                          {log.new_values ? (
                            <span className="text-slate-800" title={JSON.stringify(log.new_values, null, 2)}>
                              {JSON.stringify(log.new_values)}
                            </span>
                          ) : log.old_values ? (
                            <span className="text-slate-500" title={JSON.stringify(log.old_values, null, 2)}>
                              Deleted: {JSON.stringify(log.old_values)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
