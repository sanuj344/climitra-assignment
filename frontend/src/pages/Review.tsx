import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Check, X, AlertTriangle, Edit2, Save, History } from 'lucide-react';

const Review = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const token = useAuthStore(state => state.token);
  const role = useAuthStore(state => state.role);
  const navigate = useNavigate();

  const fetchDoc = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDoc(await res.json());
      
      const auditRes = await fetch(`http://localhost:8000/api/audit/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id, token]);

  const handleApprove = async () => {
    await fetch(`http://localhost:8000/api/documents/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    navigate('/documents');
  };

  const handleReject = async () => {
    await fetch(`http://localhost:8000/api/documents/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    navigate('/documents');
  };

  const handleSaveCorrection = async (fieldName: string) => {
    await fetch(`http://localhost:8000/api/documents/${id}/correct`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ field_name: fieldName, new_value: editValue })
    });
    setEditingField(null);
    fetchDoc(); // Refresh to get updated fields and audit logs
  };

  if (!doc) return <div className="p-8 text-center text-gray-500">Loading document...</div>;

  const imagePath = doc.images?.[0]?.file_path ? `http://localhost:8000/${doc.images[0].file_path}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review Document</h1>
          <p className="text-gray-500 mt-1">ID: {doc.id}</p>
        </div>
        {(role === 'reviewer' || role === 'admin') && doc.status === 'review_required' && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
              <X className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Original Image */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-[70vh]">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Original Image</h2>
          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {imagePath ? (
              <img src={imagePath} alt="Document" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-gray-400">Image not available</div>
            )}
          </div>
        </div>

        {/* Right Side: Extracted Fields & Audit Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[70vh] overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Extracted Fields</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {doc.fields?.map((field: any) => {
              const confClass = field.confidence >= 0.90 ? 'bg-green-100 text-green-700' : 
                               field.confidence >= 0.70 ? 'bg-amber-100 text-amber-700' : 
                               'bg-red-100 text-red-700';
              
              const isEditing = editingField === field.field_name;

              return (
                <div key={field.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">{field.field_name.replace('_', ' ').toUpperCase()}</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confClass}`}>
                        {Math.round(field.confidence * 100)}% Confidence
                      </span>
                      {field.is_corrected && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Corrected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        onClick={() => handleSaveCorrection(field.field_name)}
                        className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingField(null)}
                        className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-base text-gray-900 font-mono">{field.value}</span>
                      {(role === 'reviewer' || role === 'admin') && doc.status === 'review_required' && (
                        <button 
                          onClick={() => {
                            setEditingField(field.field_name);
                            setEditValue(field.value);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(!doc.fields || doc.fields.length === 0) && (
              <div className="text-sm text-gray-500 text-center py-4">No fields extracted yet.</div>
            )}
          </div>

          {/* Audit Logs Section */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <History className="w-4 h-4" /> Audit Trail
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                  <div className="flex justify-between font-medium text-gray-800 mb-1">
                    <span>{log.user?.email || 'Unknown User'}</span>
                    <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.action === 'field_corrected' ? (
                    <div>Changed <span className="font-semibold">{log.field_name}</span> from <span className="line-through text-red-500">{log.previous_value}</span> to <span className="text-green-600 font-semibold">{log.new_value}</span></div>
                  ) : (
                    <div>Changed status to <span className="font-semibold">{log.new_value}</span></div>
                  )}
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-xs text-gray-400">No modifications recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
