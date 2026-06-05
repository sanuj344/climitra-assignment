import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Search, Eye, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/documents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [token]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'processing': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'review_required': return <Search className="w-5 h-5 text-amber-500" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'review_required': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Documents</h1>
          <p className="text-gray-500 mt-1">Manage and verify captured evidence</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documents found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extracted Details</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => {
                const date = new Date(doc.created_at).toLocaleDateString();
                const time = new Date(doc.created_at).toLocaleTimeString();
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.id.substring(0, 8)}...</div>
                      <div className="text-sm text-gray-500">{date} {time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {doc.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.fields && doc.fields.length > 0 
                        ? `${doc.fields.length} fields extracted` 
                        : 'Awaiting OCR'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1"
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
    </div>
  );
};

export default Documents;
