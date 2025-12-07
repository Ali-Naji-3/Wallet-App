'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  CreditCard,
  Camera,
  Shield,
  FileText,
  MapPin,
  Calendar,
  Globe,
  Loader2,
  Download,
  ZoomIn,
  RotateCcw,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  ShieldX,
  History,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function KYCPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [loadingKYC, setLoadingKYC] = useState(false);
  const [kycDetail, setKycDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
  
  // Action modals
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Image preview
  const [imagePreview, setImagePreview] = useState(null);

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (search) {
        params.set('search', search);
      }
      
      const { data } = await apiClient.get(`/api/admin/kyc?${params.toString()}`);
      setVerifications(data.verifications || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching KYC:', error);
      toast.error('Failed to fetch KYC verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchKYC();
  };

  const openReviewModal = async (kyc) => {
    setSelectedKYC(kyc);
    setReviewModal(true);
    setLoadingKYC(true);
    setActiveTab('documents');
    
    try {
      const { data } = await apiClient.get(`/api/admin/kyc/${kyc.id}`);
      setKycDetail(data);
    } catch (error) {
      console.error('Error fetching KYC details:', error);
      toast.error('Failed to load KYC details');
    } finally {
      setLoadingKYC(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await apiClient.post(`/api/admin/kyc/${selectedKYC.id}/approve`, { notes: adminNotes });
      toast.success('KYC verification approved');
      setApproveModal(false);
      setReviewModal(false);
      setAdminNotes('');
      fetchKYC();
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    setProcessing(true);
    try {
      await apiClient.post(`/api/admin/kyc/${selectedKYC.id}/reject`, { 
        rejectionReason, 
        notes: adminNotes 
      });
      toast.success('KYC verification rejected');
      setRejectModal(false);
      setReviewModal(false);
      setRejectionReason('');
      setAdminNotes('');
      fetchKYC();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    
    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      expired: 'Expired',
    };
    
    return (
      <Badge className={`${styles[status]} border`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTierLabel = (tier) => {
    const labels = {
      0: 'Basic',
      1: 'Tier 1 - Identity',
      2: 'Tier 2 - Enhanced',
      3: 'Tier 3 - Premium',
    };
    return labels[tier] || `Tier ${tier}`;
  };

  const getDocTypeIcon = (type) => {
    switch (type) {
      case 'id_card': return <CreditCard className="h-4 w-4" />;
      case 'passport': return <FileText className="h-4 w-4" />;
      case 'driver_license': return <CreditCard className="h-4 w-4" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  const formatDocType = (type) => {
    const labels = {
      id_card: 'ID Card',
      passport: 'Passport',
      driver_license: 'Driver License',
      residence_permit: 'Residence Permit',
    };
    return labels[type] || type;
  };

  return (
    <div className={`p-6 space-y-6 ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/kyc" className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
          KYC & Verification
        </Link>
        <ChevronRight className={`h-4 w-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>Pending Reviews</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            KYC Verification Queue
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and manage customer identity verifications
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchKYC}
          className={isDark ? 'border-gray-700 text-gray-300' : 'border-gray-300'}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.pending || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <AlertCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Under Review</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.under_review || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Approved Today</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.approved_today || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rejected Today</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.rejected_today || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
              {['pending', 'under_review', 'all'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status 
                    ? 'bg-amber-500 text-gray-900 hover:bg-amber-600' 
                    : isDark ? 'border-gray-700 text-gray-400 hover:text-white' : 'border-gray-300'
                  }
                >
                  {status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                  {status === 'under_review' && <AlertCircle className="h-4 w-4 mr-1" />}
                  {status === 'all' && <Filter className="h-4 w-4 mr-1" />}
                  {status === 'pending' ? 'Pending' : status === 'under_review' ? 'Under Review' : 'All'}
                </Button>
              ))}
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 pr-4 py-2 w-64 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark 
                    ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </form>
          </div>
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
                No verifications found
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {statusFilter === 'pending' ? 'All pending verifications have been processed' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Document Type</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tier</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Verification</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted</th>
                    <th className={`p-4 text-left text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
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
                            <AvatarFallback className="bg-amber-500/20 text-amber-500 font-semibold">
                              {(kyc.first_name?.charAt(0) || kyc.full_name?.charAt(0) || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {kyc.first_name && kyc.last_name 
                                ? `${kyc.first_name} ${kyc.last_name}` 
                                : kyc.full_name || 'Unknown'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{kyc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getDocTypeIcon(kyc.document_type)}
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {formatDocType(kyc.document_type)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}>
                          {getTierLabel(kyc.tier)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1" title="Face Match">
                            <ScanFace className={`h-4 w-4 ${kyc.face_match_score >= 80 ? 'text-emerald-400' : kyc.face_match_score ? 'text-amber-400' : 'text-gray-500'}`} />
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {kyc.face_match_score ? `${kyc.face_match_score}%` : '--'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1" title="Liveness Check">
                            {kyc.liveness_passed ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <ShieldX className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`p-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {kyc.submitted_at ? format(new Date(kyc.submitted_at), 'MMM d, yyyy HH:mm') : '--'}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(kyc.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openReviewModal(kyc)}
                            className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          {['pending', 'under_review'].includes(kyc.status) && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { setSelectedKYC(kyc); setApproveModal(true); }}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => { setSelectedKYC(kyc); setRejectModal(true); }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              KYC Verification Review
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Review and verify the submitted documents and information
            </DialogDescription>
          </DialogHeader>
          
          {loadingKYC ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : kycDetail ? (
            <div className="space-y-6">
              {/* User Info Header */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-amber-500 text-gray-900 text-xl font-bold">
                        {(kycDetail.kyc?.first_name?.charAt(0) || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.first_name} {kycDetail.kyc?.last_name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {kycDetail.kyc?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(kycDetail.kyc?.status)}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Submitted: {kycDetail.kyc?.submitted_at ? format(new Date(kycDetail.kyc.submitted_at), 'PPpp') : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <ScanFace className={`h-8 w-8 mx-auto mb-2 ${
                    kycDetail.kyc?.face_match_score >= 80 ? 'text-emerald-400' : 
                    kycDetail.kyc?.face_match_score >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`} />
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {kycDetail.kyc?.face_match_score || 0}%
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Face Match Score</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <Fingerprint className={`h-8 w-8 mx-auto mb-2 ${
                    kycDetail.kyc?.liveness_passed ? 'text-emerald-400' : 'text-red-400'
                  }`} />
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {kycDetail.kyc?.liveness_passed ? 'Passed' : 'Failed'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Liveness Check</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <Shield className={`h-8 w-8 mx-auto mb-2 ${
                    kycDetail.kyc?.document_authentic ? 'text-emerald-400' : 
                    kycDetail.kyc?.document_authentic === false ? 'text-red-400' : 'text-gray-400'
                  }`} />
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {kycDetail.kyc?.document_authentic === true ? 'Valid' : 
                     kycDetail.kyc?.document_authentic === false ? 'Invalid' : 'Pending'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Document Check</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
                  <TabsTrigger value="documents" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="gap-2">
                    <User className="h-4 w-4" />
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger value="address" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* ID Front */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ID Front
                      </p>
                      {kycDetail.kyc?.id_front_image ? (
                        <div 
                          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setImagePreview(kycDetail.kyc.id_front_image)}
                        >
                          <img 
                            src={kycDetail.kyc.id_front_image} 
                            alt="ID Front" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* ID Back */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        ID Back
                      </p>
                      {kycDetail.kyc?.id_back_image ? (
                        <div 
                          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setImagePreview(kycDetail.kyc.id_back_image)}
                        >
                          <img 
                            src={kycDetail.kyc.id_back_image} 
                            alt="ID Back" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Not provided</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Selfie */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Selfie Photo
                      </p>
                      {kycDetail.kyc?.selfie_image ? (
                        <div 
                          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setImagePreview(kycDetail.kyc.selfie_image)}
                        >
                          <img 
                            src={kycDetail.kyc.selfie_image} 
                            alt="Selfie" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <Camera className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Address Proof */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Address Proof
                      </p>
                      {kycDetail.kyc?.address_proof_image ? (
                        <div 
                          className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setImagePreview(kycDetail.kyc.address_proof_image)}
                        >
                          <img 
                            src={kycDetail.kyc.address_proof_image} 
                            alt="Address Proof" 
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Not provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="personal" className="mt-4">
                  <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>First Name</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.first_name || '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last Name</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.last_name || '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Date of Birth</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.date_of_birth ? format(new Date(kycDetail.kyc.date_of_birth), 'PPP') : '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Nationality</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.nationality || '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Type</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDocType(kycDetail.kyc?.document_type)}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Number</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.document_number || '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Country</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.document_country || '--'}
                      </p>
                    </div>
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Expiry</Label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {kycDetail.kyc?.document_expiry ? format(new Date(kycDetail.kyc.document_expiry), 'PPP') : '--'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="address" className="mt-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="space-y-3">
                      <div>
                        <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Address Line 1</Label>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {kycDetail.kyc?.address_line1 || '--'}
                        </p>
                      </div>
                      <div>
                        <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Address Line 2</Label>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {kycDetail.kyc?.address_line2 || '--'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>City</Label>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {kycDetail.kyc?.city || '--'}
                          </p>
                        </div>
                        <div>
                          <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>State/Province</Label>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {kycDetail.kyc?.state || '--'}
                          </p>
                        </div>
                        <div>
                          <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Postal Code</Label>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {kycDetail.kyc?.postal_code || '--'}
                          </p>
                        </div>
                        <div>
                          <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Country</Label>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {kycDetail.kyc?.country || '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  {kycDetail.history && kycDetail.history.length > 0 ? (
                    <div className="space-y-3">
                      {kycDetail.history.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(item.status)}
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {formatDocType(item.document_type)}
                              </span>
                            </div>
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {item.submitted_at ? format(new Date(item.submitted_at), 'PPP') : '--'}
                            </span>
                          </div>
                          {item.rejection_reason && (
                            <p className="text-sm text-red-400 mt-2">
                              Reason: {item.rejection_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      No previous submissions
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              {['pending', 'under_review'].includes(kycDetail.kyc?.status) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    onClick={() => setReviewModal(false)}
                    className={isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300'}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setRejectModal(true); }}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => { setApproveModal(true); }}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModal} onOpenChange={setApproveModal}>
        <DialogContent className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Approve KYC Verification
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              This will verify the user and grant them tier {selectedKYC?.tier} access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={processing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Reject KYC Verification
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Please provide a reason for rejection. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={`w-full p-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Select a reason...</option>
                <option value="Document unclear or unreadable">Document unclear or unreadable</option>
                <option value="Document expired">Document expired</option>
                <option value="Face does not match document">Face does not match document</option>
                <option value="Selfie quality is poor">Selfie quality is poor</option>
                <option value="Information mismatch">Information mismatch</option>
                <option value="Suspected fraud">Suspected fraud</option>
                <option value="Document not accepted">Document type not accepted</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(false)} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={processing || !rejectionReason}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl bg-black border-gray-800" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-white">Document Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[50vh]">
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
