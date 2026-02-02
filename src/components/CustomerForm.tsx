// ============================================================
// Customer Form Component — Enhanced with ALL Workflow Fields
// Supports both Recurring Shops and Project Customers
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Store, Building2, Calculator } from 'lucide-react';
import type { Customer, CustomerFormData, PipelineType, StructureType } from '@/types';

interface CustomerFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: Customer | null;
    onSuccess?: () => void;
}

const AMAN_PRODUCTS = [
    'AmanCem Advance',
    'AmanCem Advance Plus',
    'AmanCem Green',
    'AmanCem Basic',
    'AmanCem Classic',
];

const COMPETITOR_BRANDS = [
    'Heidelberg Cement',
    'BRAC Cement',
    'Bashundhara Cement',
    'Meghna Cement',
    'Crown Cement',
    'Shah Cement',
];

export function CustomerForm({ open, onOpenChange, customer, onSuccess }: CustomerFormProps) {
    const { user } = useAuthStore();
    const [pipeline, setPipeline] = useState<PipelineType>('recurring');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [cementRequired, setCementRequired] = useState<number>(0);

    // Form state
    const [formData, setFormData] = useState<Partial<CustomerFormData>>({
        pipeline: 'recurring',
        brand_preferences: [],
        competitor_brands: [],
        promotions_offered: [],
    });

    // Populate form when editing
    useEffect(() => {
        if (customer && open) {
            setFormData({
                name: customer.name,
                owner_name: customer.owner_name,
                owner_age: customer.owner_age,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                area: customer.area,
                lat: customer.lat,
                lng: customer.lng,
                pipeline: customer.pipeline,
                shop_name: customer.shop_name,
                monthly_sales_advance: customer.monthly_sales_advance,
                monthly_sales_advance_plus: customer.monthly_sales_advance_plus,
                monthly_sales_green: customer.monthly_sales_green,
                monthly_sales_basic: customer.monthly_sales_basic,
                monthly_sales_classic: customer.monthly_sales_classic,
                selling_price_advance: customer.selling_price_advance,
                selling_price_advance_plus: customer.selling_price_advance_plus,
                selling_price_green: customer.selling_price_green,
                selling_price_basic: customer.selling_price_basic,
                selling_price_classic: customer.selling_price_classic,
                brand_preferences: customer.brand_preferences || [],
                competitor_brands: customer.competitor_brands || [],
                storage_capacity: customer.storage_capacity,
                credit_practice: customer.credit_practice,
                credit_days: customer.credit_days,
                promotions_offered: customer.promotions_offered || [],
                built_up_area: customer.built_up_area,
                number_of_floors: customer.number_of_floors,
                structure_type: customer.structure_type,
                construction_stage: customer.construction_stage,
                project_started: customer.project_started,
                current_brand: customer.current_brand,
                notes: customer.notes,
                tags: customer.tags || [],
            });
            setPipeline(customer.pipeline);
        } else if (!customer && open) {
            // Reset for new customer
            setFormData({
                pipeline: 'recurring',
                brand_preferences: [],
                competitor_brands: [],
                promotions_offered: [],
            });
            setPipeline('recurring');
        }
    }, [customer, open]);

    // Get current GPS location and auto-populate
    useEffect(() => {
        if (open && navigator.geolocation && !customer) {
            // Only auto-fetch for new customers
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setCurrentLocation(location);
                    // Auto-populate the form fields
                    setFormData(prev => ({
                        ...prev,
                        lat: location.lat,
                        lng: location.lng,
                    }));
                },
                (error) => {
                    console.error('Error getting location:', error);
                    toast.error('Could not get your location. Please enter manually.');
                }
            );
        }
    }, [open, customer]);

    // Auto-calculate cement requirement for projects
    useEffect(() => {
        if (
            pipeline === 'one_time' &&
            formData.built_up_area &&
            formData.number_of_floors &&
            formData.structure_type
        ) {
            calculateCementRequirement();
        }
    }, [formData.built_up_area, formData.number_of_floors, formData.structure_type, pipeline]);

    const calculateCementRequirement = async () => {
        try {
            const { data, error } = await supabase.rpc('calculate_cement_requirement', {
                p_built_up_area: formData.built_up_area,
                p_floors: formData.number_of_floors,
                p_structure_type: formData.structure_type,
            });

            if (error) throw error;
            setCementRequired(data || 0);
        } catch (error) {
            console.error('Error calculating cement:', error);
        }
    };

    const handlePinCurrentLocation = () => {
        if (currentLocation) {
            setFormData({
                ...formData,
                lat: currentLocation.lat,
                lng: currentLocation.lng,
            });
            toast.success('Location pinned!');
        } else {
            toast.error('Unable to get current location');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Prepare data based on pipeline type
            const customerData: any = {
                name: formData.name,
                contact_person: formData.contact_person,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                area: formData.area,
                lat: formData.lat,
                lng: formData.lng,
                pipeline,
                status: 'active',
                notes: formData.notes,
                tags: formData.tags || [],
                owner_name: formData.owner_name,
                owner_age: formData.owner_age,
            };

            if (!customer) {
                // Only set these on create
                customerData.created_by = user?.id;

                // Auto-assign if creator is a sales rep
                if (user?.role === 'sales_rep') {
                    customerData.assigned_to = user?.id;
                }
            }

            if (pipeline === 'recurring') {
                // Recurring shop fields - ensure we save even 0 values
                customerData.shop_name = formData.shop_name || formData.name;
                customerData.monthly_sales_advance = formData.monthly_sales_advance || 0;
                customerData.monthly_sales_advance_plus = formData.monthly_sales_advance_plus || 0;
                customerData.monthly_sales_green = formData.monthly_sales_green || 0;
                customerData.monthly_sales_basic = formData.monthly_sales_basic || 0;
                customerData.monthly_sales_classic = formData.monthly_sales_classic || 0;
                customerData.selling_price_advance = formData.selling_price_advance || 0;
                customerData.selling_price_advance_plus = formData.selling_price_advance_plus || 0;
                customerData.selling_price_green = formData.selling_price_green || 0;
                customerData.selling_price_basic = formData.selling_price_basic || 0;
                customerData.selling_price_classic = formData.selling_price_classic || 0;
                customerData.brand_preferences = formData.brand_preferences;
                customerData.competitor_brands = formData.competitor_brands;
                customerData.storage_capacity = formData.storage_capacity;
                customerData.credit_practice = formData.credit_practice;
                customerData.credit_days = formData.credit_days;
                customerData.promotions_offered = formData.promotions_offered;

                console.log('Saving recurring shop with monthly sales:', {
                    advance: customerData.monthly_sales_advance,
                    advance_plus: customerData.monthly_sales_advance_plus,
                    green: customerData.monthly_sales_green,
                    basic: customerData.monthly_sales_basic,
                    classic: customerData.monthly_sales_classic,
                });
            } else {
                // Project customer fields
                customerData.built_up_area = formData.built_up_area;
                customerData.number_of_floors = formData.number_of_floors;
                customerData.structure_type = formData.structure_type;
                customerData.construction_stage = formData.construction_stage || 0;
                customerData.project_started = formData.project_started;
                customerData.current_brand = formData.current_brand;
                // cement_required will be auto-calculated by trigger
            }

            let error;
            if (customer) {
                // Update existing customer
                const result = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customer.id);
                error = result.error;
            } else {
                // Insert new customer
                const result = await supabase.from('customers').insert([customerData]);
                error = result.error;
            }

            if (error) throw error;

            toast.success(`${pipeline === 'recurring' ? 'Shop' : 'Project'} ${customer ? 'updated' : 'added'} successfully!`);
            onOpenChange(false);
            onSuccess?.();

            // Reset form
            setFormData({
                pipeline: 'recurring',
                brand_preferences: [],
                competitor_brands: [],
                promotions_offered: [],
            });
        } catch (error: any) {
            console.error('Error saving customer:', error);
            toast.error(error.message || 'Failed to save customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#061A3A] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-[#F0F4F8] text-2xl">
                        {customer ? 'Edit Customer' : 'Add New Customer'}
                    </DialogTitle>
                    <DialogDescription className="text-[#8B9CB8]">
                        {customer
                            ? 'Update customer information'
                            : 'Fill in the details to add a new customer to your territory'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={pipeline} onValueChange={(v) => setPipeline(v as PipelineType)}>
                    <TabsList className="grid w-full grid-cols-2 bg-[#0A2A5C]">
                        <TabsTrigger value="recurring" className="data-[state=active]:bg-[#C41E3A]">
                            <Store className="w-4 h-4 mr-2" />
                            Recurring Shop
                        </TabsTrigger>
                        <TabsTrigger value="one_time" className="data-[state=active]:bg-[#C41E3A]">
                            <Building2 className="w-4 h-4 mr-2" />
                            Project Customer
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                        {/* Basic Information (Common) */}
                        <Card className="bg-[#0A2A5C] border-white/10">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8]">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-[#F0F4F8]">
                                            {pipeline === 'recurring' ? 'Shop Name' : 'Project Name'} *
                                        </Label>
                                        <Input
                                            required
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder={pipeline === 'recurring' ? 'Rahman Hardware' : 'Rahman Residence'}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[#F0F4F8]">Owner Name *</Label>
                                        <Input
                                            required
                                            value={formData.owner_name || ''}
                                            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="Mr. Abdur Rahman"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {pipeline === 'recurring' && (
                                        <div>
                                            <Label className="text-[#F0F4F8]">Owner Age</Label>
                                            <Input
                                                type="number"
                                                value={formData.owner_age || ''}
                                                onChange={(e) => setFormData({ ...formData, owner_age: parseInt(e.target.value) })}
                                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                                placeholder="52"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-[#F0F4F8]">Phone Number *</Label>
                                        <Input
                                            required
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="01712-XXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[#F0F4F8]">Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="owner@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-[#F0F4F8]">Address</Label>
                                    <Textarea
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                        placeholder="Full address..."
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label className="text-[#F0F4F8]">Area *</Label>
                                    <Input
                                        required
                                        value={formData.area || ''}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                        placeholder="e.g. Gulshan 1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-[#F0F4F8]">GPS Location *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            type="number"
                                            step="any"
                                            value={formData.lat || ''}
                                            onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="Latitude (23.8715)"
                                        />
                                        <Input
                                            required
                                            type="number"
                                            step="any"
                                            value={formData.lng || ''}
                                            onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                            placeholder="Longitude (90.3985)"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handlePinCurrentLocation}
                                            className="bg-[#3A9EFF] hover:bg-[#2D7FCC]"
                                        >
                                            <MapPin className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recurring Shop Specific Fields */}
                        <TabsContent value="recurring" className="mt-0">
                            <RecurringShopFields formData={formData} setFormData={setFormData} />
                        </TabsContent>

                        {/* Project Customer Specific Fields */}
                        <TabsContent value="one_time" className="mt-0">
                            <ProjectCustomerFields
                                formData={formData}
                                setFormData={setFormData}
                                cementRequired={cementRequired}
                            />
                        </TabsContent>

                        {/* Notes */}
                        <Card className="bg-[#0A2A5C] border-white/10">
                            <CardHeader>
                                <CardTitle className="text-[#F0F4F8]">Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                    placeholder="Any additional information..."
                                    rows={3}
                                />
                            </CardContent>
                        </Card>

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
                                disabled={isSubmitting}
                                className="bg-[#C41E3A] hover:bg-[#9B1830]"
                            >
                                {isSubmitting
                                    ? (customer ? 'Updating...' : 'Adding...')
                                    : (customer ? 'Update Customer' : `Add ${pipeline === 'recurring' ? 'Shop' : 'Project'}`)}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// Recurring Shop Fields Component
function RecurringShopFields({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            {/* Monthly Sales Data */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8]">Monthly Sales by Product (tons)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Advance</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.monthly_sales_advance || ''}
                            onChange={(e) => setFormData({ ...formData, monthly_sales_advance: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Advance Plus</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.monthly_sales_advance_plus || ''}
                            onChange={(e) => setFormData({ ...formData, monthly_sales_advance_plus: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Green</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.monthly_sales_green || ''}
                            onChange={(e) => setFormData({ ...formData, monthly_sales_green: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Basic</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.monthly_sales_basic || ''}
                            onChange={(e) => setFormData({ ...formData, monthly_sales_basic: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Classic</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.monthly_sales_classic || ''}
                            onChange={(e) => setFormData({ ...formData, monthly_sales_classic: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="0.00"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Selling Prices */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8]">Selling Price per Bag (Tk)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Advance</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.selling_price_advance || ''}
                            onChange={(e) => setFormData({ ...formData, selling_price_advance: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="520"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Advance Plus</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.selling_price_advance_plus || ''}
                            onChange={(e) => setFormData({ ...formData, selling_price_advance_plus: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="540"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Green</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.selling_price_green || ''}
                            onChange={(e) => setFormData({ ...formData, selling_price_green: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="530"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Basic</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.selling_price_basic || ''}
                            onChange={(e) => setFormData({ ...formData, selling_price_basic: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="500"
                        />
                    </div>
                    <div>
                        <Label className="text-[#8B9CB8] text-sm">AmanCem Classic</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.selling_price_classic || ''}
                            onChange={(e) => setFormData({ ...formData, selling_price_classic: parseFloat(e.target.value) || 0 })}
                            className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                            placeholder="480"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Storage & Credit */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8]">Storage & Credit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-[#F0F4F8]">Storage Capacity (tons)</Label>
                            <Input
                                type="number"
                                value={formData.storage_capacity || ''}
                                onChange={(e) => setFormData({ ...formData, storage_capacity: parseFloat(e.target.value) })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="80"
                            />
                        </div>
                        <div>
                            <Label className="text-[#F0F4F8]">Credit Practice</Label>
                            <Select
                                value={formData.credit_practice || 'cash'}
                                onValueChange={(v) => setFormData({ ...formData, credit_practice: v })}
                            >
                                <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0A2A5C] border-white/10">
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.credit_practice === 'credit' && (
                            <div>
                                <Label className="text-[#F0F4F8]">Credit Days</Label>
                                <Input
                                    type="number"
                                    value={formData.credit_days || ''}
                                    onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) })}
                                    className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                    placeholder="30"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Project Customer Fields Component
function ProjectCustomerFields({ formData, setFormData, cementRequired }: any) {
    return (
        <div className="space-y-6">
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8]">Construction Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label className="text-[#F0F4F8]">Built-Up Area (sqft) *</Label>
                            <Input
                                required
                                type="number"
                                value={formData.built_up_area || ''}
                                onChange={(e) => setFormData({ ...formData, built_up_area: parseFloat(e.target.value) })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="1200"
                            />
                        </div>
                        <div>
                            <Label className="text-[#F0F4F8]">Number of Floors *</Label>
                            <Input
                                required
                                type="number"
                                value={formData.number_of_floors || ''}
                                onChange={(e) => setFormData({ ...formData, number_of_floors: parseInt(e.target.value) })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="3"
                            />
                        </div>
                        <div>
                            <Label className="text-[#F0F4F8]">Structure Type *</Label>
                            <Select
                                value={formData.structure_type || ''}
                                onValueChange={(v) => setFormData({ ...formData, structure_type: v as StructureType })}
                            >
                                <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0A2A5C] border-white/10">
                                    <SelectItem value="RCC">RCC</SelectItem>
                                    <SelectItem value="Steel">Steel</SelectItem>
                                    <SelectItem value="Mixed">Mixed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-[#F0F4F8]">Construction Stage (%)</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.construction_stage || ''}
                                onChange={(e) => setFormData({ ...formData, construction_stage: parseFloat(e.target.value) })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="25"
                            />
                        </div>
                        <div>
                            <Label className="text-[#F0F4F8]">Current Brand</Label>
                            <Input
                                value={formData.current_brand || ''}
                                onChange={(e) => setFormData({ ...formData, current_brand: e.target.value })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="Heidelberg"
                            />
                        </div>
                    </div>

                    {/* Auto-Calculated Cement Requirement */}
                    {cementRequired > 0 && (
                        <div className="p-4 bg-[#2ECC71]/10 border border-[#2ECC71]/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Calculator className="w-5 h-5 text-[#2ECC71]" />
                                <div>
                                    <p className="text-[#F0F4F8] font-semibold">Auto-Calculated Cement Requirement</p>
                                    <p className="text-[#2ECC71] text-2xl font-bold">{cementRequired.toFixed(2)} tons</p>
                                    <p className="text-[#8B9CB8] text-sm">(includes 10% wastage buffer)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
