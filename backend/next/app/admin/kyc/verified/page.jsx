'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileCheck, 
  Search,
  ChevronRight,
  Shield,
  Clock,
  User,
  Loader2,
  Filter,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VerifiedKYCPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', 'approved');
      if (search) {
        params.set('search', search);
      }
      
      const { data } = await apiClient.get(`/api/admin/kyc?${params.toString()}`);
      setVerifications(data.verifications || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching KYC:', error);
      toast.error('Failed to fetch verified users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchKYC();
  };

  const getTierLabel = (tier) => {
    const labels = {
      0: 'Basic',
      1: 'Tier 1',
      2: 'Tier 2',
      3: 'Tier 3',
    };
    return labels[tier] || `Tier ${tier}`;
  };

  return (
    <div className={`p-6 space-y-6 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/kyc" className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
          KYC & Verification
        </Link>
        <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>Verified Users</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verified Users
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            All users with approved KYC verification
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Verified</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.approved || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tier 1</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {verifications.filter(v => v.tier === 1).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tier 2</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {verifications.filter(v => v.tier === 2).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Shield className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tier 3</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {verifications.filter(v => v.tier === 3).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search verified users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 pr-4 py-2 w-full rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isDark 
                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileCheck className={`h-12 w-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No verified users found
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Approved verifications will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Verified Name</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tier</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Document</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Verified On</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((kyc) => (
                    <tr 
                      key={kyc.id} 
                      className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-500 font-semibold">
                              {(kyc.full_name?.charAt(0) || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {kyc.full_name || 'Unknown'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{kyc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {kyc.first_name} {kyc.last_name}
                      </td>
                      <td className="p-4">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {getTierLabel(kyc.tier)}
                        </Badge>
                      </td>
                      <td className={`p-4 capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {kyc.document_type?.replace('_', ' ')}
                      </td>
                      <td className={`p-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {kyc.reviewed_at ? format(new Date(kyc.reviewed_at), 'MMM d, yyyy') : '--'}
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/users/${kyc.user_id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                          >
                            <User className="h-4 w-4 mr-1" />
                            View User
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

