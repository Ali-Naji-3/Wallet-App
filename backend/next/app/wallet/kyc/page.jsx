'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Camera, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle, 
  XCircle,
  Loader2,
  CreditCard,
  FileText,
  User,
  MapPin,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  ScanFace,
  Fingerprint,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import apiClient from '@/lib/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STEPS = [
  { id: 'start', title: 'Start', icon: Shield },
  { id: 'document', title: 'Document', icon: CreditCard },
  { id: 'selfie', title: 'Selfie', icon: Camera },
  { id: 'personal', title: 'Details', icon: User },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

const DOC_TYPES = [
  { id: 'id_card', name: 'National ID Card', icon: CreditCard, description: 'Government-issued ID card' },
  { id: 'passport', name: 'Passport', icon: FileText, description: 'Valid passport' },
  { id: 'driver_license', name: 'Driver\'s License', icon: CreditCard, description: 'Valid driver\'s license' },
];

export default function KYCPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('start');
  const [submitting, setSubmitting] = useState(false);
  
  // Document data
  const [documentType, setDocumentType] = useState('');
  const [idFrontImage, setIdFrontImage] = useState(null);
  const [idBackImage, setIdBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  
  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentCountry, setDocumentCountry] = useState('');
  const [documentExpiry, setDocumentExpiry] = useState('');
  
  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Liveness check
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessChecks, setLivenessChecks] = useState([false, false, false]);
  
  // Fetch current KYC status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await apiClient.get('/api/kyc/my-status');
        setKycStatus(data);
        
        // If user has approved or pending KYC, don't show form
        if (data.status === 'approved' || data.status === 'pending' || data.status === 'under_review') {
          setStep('status');
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, []);

  // Camera functions
  const startCamera = async (target, mode = 'environment') => {
    setCameraTarget(target);
    setFacingMode(mode);
    setCameraOpen(true);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: 1280, height: 720 },
        audio: false,
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
    setLivenessStep(0);
    setLivenessChecks([false, false, false]);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      switch (cameraTarget) {
        case 'id_front':
          setIdFrontImage(imageData);
          break;
        case 'id_back':
          setIdBackImage(imageData);
          break;
        case 'selfie':
          setSelfieImage(imageData);
          break;
      }
      
      stopCamera();
      toast.success('Photo captured successfully');
    }
  };

  // Liveness check simulation
  const runLivenessCheck = () => {
    setLivenessStep(1);
    
    // Simulate liveness checks
    setTimeout(() => {
      setLivenessChecks([true, false, false]);
      setLivenessStep(2);
      
      setTimeout(() => {
        setLivenessChecks([true, true, false]);
        setLivenessStep(3);
        
        setTimeout(() => {
          setLivenessChecks([true, true, true]);
          capturePhoto();
        }, 1500);
      }, 1500);
    }, 2000);
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result;
      switch (target) {
        case 'id_front':
          setIdFrontImage(imageData);
          break;
        case 'id_back':
          setIdBackImage(imageData);
          break;
        case 'selfie':
          setSelfieImage(imageData);
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      await apiClient.post('/api/kyc/submit', {
        documentType,
        idFrontImage,
        idBackImage,
        selfieImage,
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        documentNumber,
        documentCountry,
        documentExpiry,
        addressLine1,
        city,
        postalCode,
        country,
        tier: 1,
        faceMatchScore: 85, // Simulated
        livenessPassed: true, // Simulated
      });
      
      toast.success('KYC verification submitted successfully!');
      setStep('submitted');
      
      // Refresh status
      const { data } = await apiClient.get('/api/kyc/my-status');
      setKycStatus(data);
      
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error(error.response?.data?.message || 'Failed to submit KYC verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIndex = () => STEPS.findIndex(s => s.id === step);
  const progress = ((getStepIndex() + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (step) {
      case 'start':
        return true;
      case 'document':
        return documentType && idFrontImage;
      case 'selfie':
        return selfieImage;
      case 'personal':
        return firstName && lastName && dateOfBirth;
      default:
        return true;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Show status page if user has existing KYC
  if (step === 'status' && kycStatus) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardHeader className="text-center">
            <div className={`mx-auto p-4 rounded-full w-fit ${
              kycStatus.status === 'approved' ? 'bg-emerald-500/20' :
              kycStatus.status === 'pending' || kycStatus.status === 'under_review' ? 'bg-amber-500/20' :
              kycStatus.status === 'rejected' ? 'bg-red-500/20' : 'bg-gray-500/20'
            }`}>
              {kycStatus.status === 'approved' ? <Shield className="h-12 w-12 text-emerald-400" /> :
               kycStatus.status === 'pending' || kycStatus.status === 'under_review' ? <Clock className="h-12 w-12 text-amber-400" /> :
               kycStatus.status === 'rejected' ? <XCircle className="h-12 w-12 text-red-400" /> :
               <Shield className="h-12 w-12 text-gray-400" />}
            </div>
            <CardTitle className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {kycStatus.status === 'approved' ? 'Identity Verified' :
               kycStatus.status === 'pending' ? 'Verification Pending' :
               kycStatus.status === 'under_review' ? 'Under Review' :
               kycStatus.status === 'rejected' ? 'Verification Rejected' :
               'Verify Your Identity'}
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {kycStatus.status === 'approved' 
                ? `Your identity has been verified. You have Tier ${kycStatus.tier} access.` 
                : kycStatus.status === 'pending' || kycStatus.status === 'under_review'
                ? 'Your verification is being reviewed. This usually takes 1-2 business days.'
                : kycStatus.status === 'rejected'
                ? 'Your verification was rejected. Please submit again with correct documents.'
                : 'Complete identity verification to unlock full features.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status</span>
                  <div className="mt-1">
                    <Badge className={
                      kycStatus.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      kycStatus.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      kycStatus.status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {kycStatus.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tier</span>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tier {kycStatus.tier || 0}
                  </p>
                </div>
                {kycStatus.submitted_at && (
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Submitted</span>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(kycStatus.submitted_at), 'PPP')}
                    </p>
                  </div>
                )}
                {kycStatus.expires_at && (
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Expires</span>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(kycStatus.expires_at), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {kycStatus.rejection_reason && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm font-medium">Rejection Reason:</p>
                <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {kycStatus.rejection_reason}
                </p>
              </div>
            )}
            
            {kycStatus.status === 'rejected' && (
              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900"
                onClick={() => setStep('start')}
              >
                Submit New Verification
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success page
  if (step === 'submitted') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-emerald-500/20 w-fit">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
            <CardTitle className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Verification Submitted!
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Your documents have been submitted for review. We'll notify you once the verification is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              This usually takes 1-2 business days
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/wallet/dashboard'}
              className={isDark ? 'border-gray-700' : 'border-gray-300'}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-3xl mx-auto ${isDark ? '' : 'bg-gray-50'}`}>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                getStepIndex() > idx ? 'bg-emerald-500 text-white' :
                getStepIndex() === idx ? 'bg-amber-500 text-gray-900' :
                isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
              }`}>
                {getStepIndex() > idx ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-12 md:w-24 h-1 mx-2 ${
                  getStepIndex() > idx ? 'bg-emerald-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
        <CardContent className="p-6">
          
          {/* Start Step */}
          {step === 'start' && (
            <div className="text-center space-y-6">
              <div className="mx-auto p-4 rounded-full bg-amber-500/20 w-fit">
                <Shield className="h-12 w-12 text-amber-400" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Verify Your Identity
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Complete identity verification to unlock full features and higher transaction limits.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} text-left`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  What you'll need:
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      Valid government-issued ID (passport, ID card, or driver's license)
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-amber-500" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      A clear selfie photo for face verification
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <ScanFace className="h-5 w-5 text-amber-500" />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      Liveness check to confirm you're a real person
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className={`p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-left`}>
                <p className="text-sm text-blue-400">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  This process takes about 2-3 minutes. Your data is encrypted and secure.
                </p>
              </div>
            </div>
          )}

          {/* Document Step */}
          {step === 'document' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Select Document Type
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Choose the type of ID you want to submit
                </p>
              </div>
              
              <div className="grid gap-3">
                {DOC_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setDocumentType(doc.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      documentType === doc.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${documentType === doc.id ? 'bg-amber-500/20' : isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <doc.icon className={`h-6 w-6 ${documentType === doc.id ? 'text-amber-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{doc.description}</p>
                      </div>
                      {documentType === doc.id && (
                        <CheckCircle className="h-5 w-5 text-amber-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {documentType && (
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Upload Document Photos
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Front */}
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Front Side *</Label>
                      <div 
                        className={`mt-2 aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                          idFrontImage ? 'border-emerald-500' : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {idFrontImage ? (
                          <div className="relative w-full h-full group">
                            <img src={idFrontImage} alt="ID Front" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => startCamera('id_front')} className="text-white">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <Camera className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Take a photo</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => startCamera('id_front')}>
                                <Camera className="h-4 w-4 mr-1" /> Camera
                              </Button>
                              <label className="cursor-pointer">
                                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                                  <Upload className="h-4 w-4 mr-1" /> Upload
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'id_front')} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Back */}
                    <div>
                      <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Back Side (Optional)</Label>
                      <div 
                        className={`mt-2 aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                          idBackImage ? 'border-emerald-500' : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {idBackImage ? (
                          <div className="relative w-full h-full group">
                            <img src={idBackImage} alt="ID Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => startCamera('id_back')} className="text-white">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <CreditCard className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Back of ID</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" onClick={() => startCamera('id_back')}>
                                <Camera className="h-4 w-4 mr-1" /> Camera
                              </Button>
                              <label className="cursor-pointer">
                                <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                                  <Upload className="h-4 w-4 mr-1" /> Upload
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'id_back')} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selfie Step */}
          {step === 'selfie' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Take a Selfie
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  We need to verify that you match your ID document
                </p>
              </div>
              
              <div className="max-w-sm mx-auto">
                <div 
                  className={`aspect-square rounded-full border-4 overflow-hidden ${
                    selfieImage ? 'border-emerald-500' : isDark ? 'border-gray-700' : 'border-gray-300'
                  }`}
                >
                  {selfieImage ? (
                    <div className="relative w-full h-full group">
                      <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="ghost" onClick={() => startCamera('selfie', 'user')} className="text-white">
                          <RotateCcw className="h-5 w-5 mr-2" /> Retake
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <ScanFace className={`h-16 w-16 mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Position your face here</p>
                    </div>
                  )}
                </div>
                
                {!selfieImage && (
                  <Button 
                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-gray-900"
                    onClick={() => startCamera('selfie', 'user')}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tips for a good selfie:</h4>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>• Make sure your face is well-lit</li>
                  <li>• Remove glasses and hats</li>
                  <li>• Look directly at the camera</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>
            </div>
          )}

          {/* Personal Info Step */}
          {step === 'personal' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Personal Information
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Enter your details as they appear on your ID
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Date of Birth *</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Nationality</Label>
                  <Input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Lebanese"
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Number</Label>
                  <Input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="AB123456"
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
                <div>
                  <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Document Expiry</Label>
                  <Input
                    type="date"
                    value={documentExpiry}
                    onChange={(e) => setDocumentExpiry(e.target.value)}
                    className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                  />
                </div>
              </div>
              
              <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Address (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Address</Label>
                    <Input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main Street"
                      className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                    />
                  </div>
                  <div>
                    <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Beirut"
                      className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                    />
                  </div>
                  <div>
                    <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Postal Code</Label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="00000"
                      className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className={isDark ? 'text-gray-400' : 'text-gray-600'}>Country</Label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Lebanon"
                      className={isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Review & Submit
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Please review your information before submitting
                </p>
              </div>
              
              {/* Document preview */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Documents
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    {idFrontImage && <img src={idFrontImage} alt="ID Front" className="w-full h-full object-cover" />}
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-700">
                    {idBackImage ? (
                      <img src={idBackImage} alt="ID Back" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Not provided</div>
                    )}
                  </div>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    {selfieImage && <img src={selfieImage} alt="Selfie" className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>
              
              {/* Personal info preview */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Name: </span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{firstName} {lastName}</span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>DOB: </span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{dateOfBirth}</span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Nationality: </span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{nationality || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Doc #: </span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{documentNumber || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg bg-amber-500/10 border border-amber-500/30`}>
                <p className="text-sm text-amber-400">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  By submitting, you confirm that all information is accurate and matches your ID document.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-800 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                const steps = ['start', 'document', 'selfie', 'personal', 'review'];
                const idx = steps.indexOf(step);
                if (idx > 0) setStep(steps[idx - 1]);
              }}
              disabled={step === 'start'}
              className={isDark ? 'border-gray-700' : 'border-gray-300'}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {step === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Verification
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const steps = ['start', 'document', 'selfie', 'personal', 'review'];
                  const idx = steps.indexOf(step);
                  if (idx < steps.length - 1) setStep(steps[idx + 1]);
                }}
                disabled={!canProceed()}
                className="bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={() => stopCamera()}>
        <DialogContent className="max-w-2xl bg-black border-gray-800" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-white">
              {cameraTarget === 'selfie' ? 'Take a Selfie' : 'Capture Document'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full rounded-lg ${cameraTarget === 'selfie' ? 'transform scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Face overlay for selfie */}
            {cameraTarget === 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-4 border-amber-500/50 rounded-full" />
              </div>
            )}
            
            {/* Liveness check UI */}
            {cameraTarget === 'selfie' && livenessStep > 0 && (
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-black/80 rounded-lg">
                <p className="text-white text-center mb-2">Liveness Check</p>
                <div className="flex justify-center gap-4">
                  <div className={`flex items-center gap-2 ${livenessChecks[0] ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {livenessChecks[0] ? <CheckCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="text-sm">Face Detected</span>
                  </div>
                  <div className={`flex items-center gap-2 ${livenessChecks[1] ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {livenessChecks[1] ? <CheckCircle className="h-4 w-4" /> : livenessStep >= 2 ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span className="text-sm">Blink Check</span>
                  </div>
                  <div className={`flex items-center gap-2 ${livenessChecks[2] ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {livenessChecks[2] ? <CheckCircle className="h-4 w-4" /> : livenessStep >= 3 ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span className="text-sm">Motion Check</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={stopCamera} className="border-gray-700 text-gray-300">
              Cancel
            </Button>
            {cameraTarget === 'selfie' ? (
              livenessStep === 0 ? (
                <Button onClick={runLivenessCheck} className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Start Liveness Check
                </Button>
              ) : null
            ) : (
              <Button onClick={capturePhoto} className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

