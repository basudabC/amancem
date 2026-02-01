// ============================================================
// Conversion/Sales Form Component
// Complete sales recording with payment and delivery details
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Package, CreditCard, Truck, Calculator, AlertCircle } from 'lucide-react';
import type { Customer, ConversionFormData, PaymentType, AmanProduct } from '@/types';

interface ConversionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer;
    visitId?: string;
    onSuccess?: () => void;
}

const AMAN_PRODUCTS: AmanProduct[] = [
    'AmanCem Advance',
    'AmanCem Advance Plus',
    'AmanCem Green',
    'AmanCem Basic',
    'AmanCem Classic',
];

export function ConversionForm({ open, onOpenChange, customer, visitId, onSuccess }: ConversionFormProps) {
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<ConversionFormData>>({
        customer_id: customer.id,
        visit_id: visitId,
        payment_type: 'cash',
    });
    const [totalValue, setTotalValue] = useState(0);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Auto-calculate total value
    useEffect(() => {
        if (formData.quantity_bags && formData.unit_price) {
            const total = formData.quantity_bags * formData.unit_price;
            setTotalValue(total);
        } else {
            setTotalValue(0);
        }
    }, [formData.quantity_bags, formData.unit_price]);

    // Validate payment
    useEffect(() => {
        if (totalValue === 0) {
            setPaymentError(null);
            return;
        }

        const { payment_type, cash_amount, credit_amount } = formData;

        if (payment_type === 'cash') {
            if (cash_amount !== totalValue) {
                setPaymentError(`Cash amount must equal total value (${totalValue.toFixed(2)} Tk)`);
            } else {
                setPaymentError(null);
            }
        } else if (payment_type === 'credit') {
            if (credit_amount !== totalValue) {
                setPaymentError(`Credit amount must equal total value (${totalValue.toFixed(2)} Tk)`);
            } else {
                setPaymentError(null);
            }
        } else if (payment_type === 'partial') {
            const total = (cash_amount || 0) + (credit_amount || 0);
            if (total !== totalValue) {
                setPaymentError(`Cash + Credit must equal total value (${totalValue.toFixed(2)} Tk)`);
            } else {
                setPaymentError(null);
            }
        }
    }, [formData.payment_type, formData.cash_amount, formData.credit_amount, totalValue]);

    // Auto-fill delivery address from customer
    useEffect(() => {
        if (open && customer) {
            setFormData((prev) => ({
                ...prev,
                delivery_address: customer.address,
                delivery_lat: customer.lat,
                delivery_lng: customer.lng,
            }));
        }
    }, [open, customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentError) {
            toast.error(paymentError);
            return;
        }

        setIsSubmitting(true);

        try {
            const conversionData: any = {
                customer_id: customer.id,
                converted_by: user?.id,
                visit_id: visitId,

                // Product details
                product: formData.product,
                quantity_bags: formData.quantity_bags,
                unit_price: formData.unit_price,
                // total_value will be auto-calculated by trigger

                // Payment details
                payment_type: formData.payment_type,
                cash_amount: formData.cash_amount,
                credit_amount: formData.credit_amount,
                credit_days: formData.credit_days,
                // expected_payment_date will be auto-calculated by trigger

                // Delivery details
                delivery_address: formData.delivery_address,
                delivery_lat: formData.delivery_lat,
                delivery_lng: formData.delivery_lng,
                expected_delivery_date: formData.expected_delivery_date,

                // Project updates (if applicable)
                construction_stage_update: formData.construction_stage_update,
                cement_consumed_update: formData.cement_consumed_update,

                sale_notes: formData.sale_notes,
            };

            const { error } = await supabase.from('conversions').insert([conversionData]);

            if (error) throw error;

            // Update customer conversion status
            await supabase
                .from('customers')
                .update({ is_converted: true, converted_at: new Date().toISOString() })
                .eq('id', customer.id);

            toast.success('Sale recorded successfully!');
            onOpenChange(false);
            onSuccess?.();

            // Reset form
            setFormData({
                customer_id: customer.id,
                payment_type: 'cash',
            });
        } catch (error: any) {
            console.error('Error recording sale:', error);
            toast.error(error.message || 'Failed to record sale');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#061A3A] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-[#F0F4F8] text-2xl">Record Sale</DialogTitle>
                    <DialogDescription className="text-[#8B9CB8]">
                        Recording sale for: <span className="text-[#F0F4F8] font-semibold">{customer.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Details */}
                    <Card className="bg-[#0A2A5C] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Product Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-[#F0F4F8]">Product *</Label>
                                    <Select
                                        value={formData.product}
                                        onValueChange={(v) => setFormData({ ...formData, product: v as AmanProduct })}
                                    >
                                        <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0A2A5C] border-white/10">
                                            {AMAN_PRODUCTS.map((product) => (
                                                <SelectItem key={product} value={product}>
                                                    {product}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-[#F0F4F8]">Quantity (bags) *</Label>
                                    <Input
                                        required
                                        type="number"
                                        min="1"
                                        value={formData.quantity_bags || ''}
                                        onChange={(e) => setFormData({ ...formData, quantity_bags: parseInt(e.target.value) })}
                                        className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                        placeholder="25"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[#F0F4F8]">Unit Price (Tk) *</Label>
                                    <Input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.unit_price || ''}
                                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                                        className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                        placeholder="520"
                                    />
                                </div>
                            </div>

                            {totalValue > 0 && (
                                <div className="p-4 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calculator className="w-5 h-5 text-[#2ECC71]" />
                                            <span className="text-[#F0F4F8] font-semibold">Total Value</span>
                                        </div>
                                        <span className="text-[#2ECC71] text-2xl font-bold">{totalValue.toFixed(2)} Tk</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    <Card className="bg-[#0A2A5C] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-[#F0F4F8]">Payment Type *</Label>
                                <Select
                                    value={formData.payment_type}
                                    onValueChange={(v) => setFormData({ ...formData, payment_type: v as PaymentType })}
                                >
                                    <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A2A5C] border-white/10">
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit">Credit</SelectItem>
                                        <SelectItem value="partial">Partial (Cash + Credit)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {(formData.payment_type === 'cash' || formData.payment_type === 'partial') && (
                                    <div>
                                        <Label className="text-[#F0F4F8]">Cash Amount (Tk) *</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.cash_amount || ''}
                                            onChange={(e) => setFormData({ ...formData, cash_amount: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder={formData.payment_type === 'cash' ? totalValue.toString() : '5000'}
                                        />
                                    </div>
                                )}
                                {(formData.payment_type === 'credit' || formData.payment_type === 'partial') && (
                                    <div>
                                        <Label className="text-[#F0F4F8]">Credit Amount (Tk) *</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.credit_amount || ''}
                                            onChange={(e) => setFormData({ ...formData, credit_amount: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder={formData.payment_type === 'credit' ? totalValue.toString() : '8000'}
                                        />
                                    </div>
                                )}
                            </div>

                            {(formData.payment_type === 'credit' || formData.payment_type === 'partial') && (
                                <div>
                                    <Label className="text-[#F0F4F8]">Credit Days</Label>
                                    <Input
                                        type="number"
                                        value={formData.credit_days || ''}
                                        onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) })}
                                        className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                        placeholder="30"
                                    />
                                    <p className="text-[#8B9CB8] text-xs mt-1">Payment date will be auto-calculated</p>
                                </div>
                            )}

                            {paymentError && (
                                <div className="p-3 bg-[#E74C5E]/10 border border-[#E74C5E]/30 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-[#E74C5E] flex-shrink-0 mt-0.5" />
                                    <p className="text-[#E74C5E] text-sm">{paymentError}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Delivery Details */}
                    <Card className="bg-[#0A2A5C] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Delivery Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-[#F0F4F8]">Delivery Address</Label>
                                <Textarea
                                    value={formData.delivery_address || ''}
                                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                                    className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                    rows={2}
                                    placeholder="Delivery address..."
                                />
                            </div>

                            <div>
                                <Label className="text-[#F0F4F8]">Expected Delivery Date</Label>
                                <Input
                                    type="date"
                                    value={formData.expected_delivery_date || ''}
                                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                    className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Updates (if project customer) */}
                    {customer.pipeline === 'one_time' && (
                        <Card className="bg-[#0A2A5C] border-white/10">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8]">Project Updates</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[#F0F4F8]">Construction Stage (%)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.construction_stage_update || ''}
                                            onChange={(e) => setFormData({ ...formData, construction_stage_update: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="35"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[#F0F4F8]">Cement Consumed (tons)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.cement_consumed_update || ''}
                                            onChange={(e) => setFormData({ ...formData, cement_consumed_update: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="12.5"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    <div>
                        <Label className="text-[#F0F4F8]">Sale Notes</Label>
                        <Textarea
                            value={formData.sale_notes || ''}
                            onChange={(e) => setFormData({ ...formData, sale_notes: e.target.value })}
                            className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]"
                            placeholder="Additional notes about this sale..."
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-white/10 text-[#8B9CB8]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !!paymentError}
                            className="bg-[#2ECC71] hover:bg-[#27AE60]"
                        >
                            {isSubmitting ? 'Recording...' : 'Record Sale'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
