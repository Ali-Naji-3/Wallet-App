'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  StarOff,
  Loader2,
  Shield,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

// Card brand icons and colors
const CARD_BRANDS = {
  visa: {
    name: 'Visa',
    color: 'from-blue-600 to-blue-700',
    textColor: 'text-white',
  },
  mastercard: {
    name: 'Mastercard',
    color: 'from-red-600 to-orange-600',
    textColor: 'text-white',
  },
  amex: {
    name: 'American Express',
    color: 'from-teal-600 to-cyan-600',
    textColor: 'text-white',
  },
  discover: {
    name: 'Discover',
    color: 'from-orange-500 to-amber-600',
    textColor: 'text-white',
  },
  other: {
    name: 'Card',
    color: 'from-slate-600 to-slate-700',
    textColor: 'text-white',
  },
};

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});

  // Fetch cards on mount
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/cards');
      setCards(response.data);
    } catch (err) {
      console.error('Failed to fetch cards:', err);
      toast.error(err.response?.data?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Card holder name is required';
    }

    const cleanedNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cleanedNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
      newErrors.cardNumber = 'Invalid card number length';
    }

    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Required';
    }

    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Required';
    }

    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCard = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/api/cards', {
        cardHolderName: formData.cardHolderName,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cvv: formData.cvv,
        billingAddress: formData.billingAddress || null,
        billingCity: formData.billingCity || null,
        billingState: formData.billingState || null,
        billingZip: formData.billingZip || null,
        billingCountry: formData.billingCountry || null,
        isDefault: formData.isDefault,
      });

      toast.success('Card added successfully!');
      setIsDialogOpen(false);
      resetForm();
      fetchCards();
    } catch (err) {
      console.error('Failed to add card:', err);
      toast.error(err.response?.data?.message || 'Failed to add card');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/cards/${cardId}`);
      toast.success('Card deleted successfully');
      fetchCards();
    } catch (err) {
      console.error('Failed to delete card:', err);
      toast.error(err.response?.data?.message || 'Failed to delete card');
    }
  };

  const handleSetDefault = async (cardId) => {
    try {
      await apiClient.patch(`/api/cards/${cardId}`, { setDefault: true });
      toast.success('Default card updated');
      fetchCards();
    } catch (err) {
      console.error('Failed to set default card:', err);
      toast.error(err.response?.data?.message || 'Failed to update default card');
    }
  };

  const resetForm = () => {
    setFormData({
      cardHolderName: '',
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingZip: '',
      billingCountry: '',
      isDefault: false,
    });
    setErrors({});
  };

  // Generate year options (current year + 15 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear + i);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Cards</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Manage your payment cards securely
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Add New Card
              </DialogTitle>
              <DialogDescription>
                Enter your card details. All information is encrypted and stored securely.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddCard} className="space-y-6 mt-4">
              {/* Card Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  Card Information
                </h3>

                {/* Card Holder Name */}
                <div className="space-y-2">
                  <Label htmlFor="cardHolderName">
                    Card Holder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cardHolderName"
                    placeholder="John Doe"
                    value={formData.cardHolderName}
                    onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                    className={errors.cardHolderName ? 'border-red-500' : ''}
                  />
                  {errors.cardHolderName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cardHolderName}
                    </p>
                  )}
                </div>

                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">
                    Card Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      if (formatted.replace(/\s/g, '').length <= 19) {
                        handleInputChange('cardNumber', formatted);
                      }
                    }}
                    className={errors.cardNumber ? 'border-red-500' : ''}
                    maxLength={23}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cardNumber}
                    </p>
                  )}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">
                      Month <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.expiryMonth}
                      onValueChange={(value) => handleInputChange('expiryMonth', value)}
                    >
                      <SelectTrigger className={errors.expiryMonth ? 'border-red-500' : ''}>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">
                      Year <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.expiryYear}
                      onValueChange={(value) => handleInputChange('expiryYear', value)}
                    >
                      <SelectTrigger className={errors.expiryYear ? 'border-red-500' : ''}>
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">
                      CVV <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => {
                        if (/^\d{0,4}$/.test(e.target.value)) {
                          handleInputChange('cvv', e.target.value);
                        }
                      }}
                      className={errors.cvv ? 'border-red-500' : ''}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address (Optional) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Billing Address (Optional)
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Street Address</Label>
                  <Input
                    id="billingAddress"
                    placeholder="123 Main St"
                    value={formData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      placeholder="New York"
                      value={formData.billingCity}
                      onChange={(e) => handleInputChange('billingCity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input
                      id="billingState"
                      placeholder="NY"
                      value={formData.billingState}
                      onChange={(e) => handleInputChange('billingState', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingZip">ZIP Code</Label>
                    <Input
                      id="billingZip"
                      placeholder="10001"
                      value={formData.billingZip}
                      onChange={(e) => handleInputChange('billingZip', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Country</Label>
                    <Input
                      id="billingCountry"
                      placeholder="United States"
                      value={formData.billingCountry}
                      onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default card
                </Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Card'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Notice */}
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                Your cards are secure
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                All card information is encrypted and stored securely. We never share your payment
                details with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : cards.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-gray-400 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No cards added yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Add your first payment card to start making transactions
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const brandInfo = CARD_BRANDS[card.card_type] || CARD_BRANDS.other;
            return (
              <Card
                key={card.id}
                className={`bg-gradient-to-br ${brandInfo.color} ${brandInfo.textColor} border-0 shadow-xl hover:shadow-2xl transition-all`}
              >
                <CardContent className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-6 w-6" />
                      <span className="font-semibold text-sm uppercase">
                        {brandInfo.name}
                      </span>
                    </div>
                    {card.is_default === 1 && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">Default</span>
                      </div>
                    )}
                  </div>

                  {/* Card Number */}
                  <div className="mb-6">
                    <div className="text-2xl font-mono tracking-wider">
                      •••• •••• •••• {card.card_number_last4}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs opacity-70 mb-1">Card Holder</div>
                      <div className="font-semibold">{card.card_holder_name}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70 mb-1">Expires</div>
                      <div className="font-mono">
                        {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/20">
                    {card.is_default === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        className="flex-1 hover:bg-white/20 text-current"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      className="flex-1 hover:bg-white/20 text-current"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


