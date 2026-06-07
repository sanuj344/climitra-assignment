import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const token = useAuthStore(state => state.token);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const cards = [
    { name: 'Total Documents', value: stats?.total_documents || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Pending Review', value: stats?.pending_review || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Approved', value: stats?.approved || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Rejected', value: stats?.rejected || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Low Confidence', value: stats?.low_confidence || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of evidence verification status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
              <div className={`p-3 rounded-full ${card.bg} mb-4`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">{card.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Documents per Day</h2>
        <ResponsiveContainer width="100%" height={288}>
          <BarChart data={stats?.documents_per_day || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
            <Tooltip 
              cursor={{fill: '#F3F4F6'}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
