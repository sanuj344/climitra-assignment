import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Search as SearchIcon, Eye, Filter } from 'lucide-react';

const STATUS_OPTIONS = ['', 'processing', 'review_required', 'approved', 'rejected'];

const Search = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (query) params.append('vehicle_number', query);
      if (status) params.append('status', status);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`http://localhost:8000/api/documents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        let data = await res.json();

        // Client-side filter by status (since our basic GET /documents doesn't filter yet)
        if (status) data = data.filter((d: any) => d.status === status);

        // Filter by vehicle number from extracted fields
        if (query) {
          data = data.filter((d: any) =>
            d.fields?.some((f: any) =>
              f.field_name === 'vehicle_number' &&
              f.value?.toLowerCase().includes(query.toLowerCase())
            )
          );
        }

        // Filter by date range
        if (dateFrom) {
          data = data.filter((d: any) => new Date(d.created_at) >= new Date(dateFrom));
        }
        if (dateTo) {
          data = data.filter((d: any) => new Date(d.created_at) <= new Date(dateTo + 'T23:59:59'));
        }

        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'processing':       return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'review_required':  return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':         return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':         return 'bg-red-50 text-red-700 border-red-200';
      default:                 return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Search &amp; Reconciliation</h1>
        <p className="text-gray-500 mt-1">Filter documents by vehicle number, date, and status</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle Number</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. GJ04X6344"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s ? s.replace('_', ' ').toUpperCase() : 'All Statuses'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <SearchIcon className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No documents match your filters.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((doc: any) => {
                  const vehicleField = doc.fields?.find((f: any) => f.field_name === 'vehicle_number');
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">{doc.id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{vehicleField?.value || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(doc.status)}`}>
                          {doc.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
