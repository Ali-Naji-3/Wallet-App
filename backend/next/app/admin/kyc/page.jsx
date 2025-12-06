'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const kycRequests = [
  { id: 1, name: 'John Doe', email: 'john@example.com', type: 'ID Card', submitted: 'Dec 6, 2025', status: 'pending' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', type: 'Passport', submitted: 'Dec 5, 2025', status: 'pending' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', type: 'Driver License', submitted: 'Dec 5, 2025', status: 'under_review' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', type: 'ID Card', submitted: 'Dec 4, 2025', status: 'pending' },
  { id: 5, name: 'Tom Brown', email: 'tom@example.com', type: 'Passport', submitted: 'Dec 4, 2025', status: 'under_review' },
];

export default function KYCPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/kyc" className="text-gray-400 hover:text-white">KYC & Verification</Link>
        <ChevronRight className="h-4 w-4 text-gray-600" />
        <span className="text-gray-300">Pending Reviews</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pending KYC Reviews</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <AlertCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Under Review</p>
              <p className="text-2xl font-bold text-white">5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Approved Today</p>
              <p className="text-2xl font-bold text-white">8</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
      <div>
              <p className="text-gray-400 text-sm">Rejected Today</p>
              <p className="text-2xl font-bold text-white">2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Document Type</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Submitted</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{req.name}</p>
                          <p className="text-gray-500 text-sm">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{req.type}</td>
                    <td className="p-4 text-gray-400">{req.submitted}</td>
                    <td className="p-4">
                      <Badge className={
                        req.status === 'pending' 
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }>
                        {req.status === 'pending' ? 'Pending' : 'Under Review'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
