// ============================================================
// Customer Form Component — Enhanced with ALL Workflow Fields
// Supports both Recurring Shops and Project Customers
// ============================================================

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
    MapPin,
    Store,
    Building2,
    Calculator,
    Trash2,
    Plus
} from 'lucide-react';
import { BrandTracker, type BrandRecord } from './BrandTracker';
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
    'Shah Cement',
    'Bashundhara Cement',
    'Seven Rings Cement',
    'Fresh Cement',
    'Heidelberg Cement',
    'Premier Cement',
    'Lafarge Holcim',
    'Akij Cement',
    'Royal Cement',
    'Anwar Cement',
    'Crown Cement',
    'Confidence Cement',
    'Mir Cement',
    'Metrocem Cement',
    'Tiger Cement',
    'Scan Cement',
    'Supercrete Cement',
    'Ruby Cement',
    'King Brand Cement',
    'Five Rings Cement',
    'Anchor Cement',
    'Elephant Brand',
    'Meghacem Delux',
    'Dhalai Special',
    'Asha Cement',
    'Insee Cement',
    'Seven Horse Cement',
    'Bengal Cement',
    'Others',
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function CustomerForm({ open, onOpenChange, customer, onSuccess }: CustomerFormProps) {
    const { user } = useAuthStore();
    const [pipeline, setPipeline] = useState<PipelineType>('recurring');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [cementRequired, setCementRequired] = useState<number>(0);
    const [brandRecords, setBrandRecords] = useState<BrandRecord[]>([]);

    // Form state
    const [formData, setFormData] = useState<Partial<CustomerFormData>>({
        pipeline: 'recurring',
        brand_preferences: [],
        competitor_brands: [],
        promotions_offered: [],
    });



    /* --- Hierarchy Logic --- */
    const { data: regions = [] } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const { data } = await supabase.from('regions').select('*').order('name');
            return data || [];
        },
    });

    const { data: areas = [] } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const { data } = await supabase.from('areas').select('*').order('name');
            return data || [];
        },
    });

    const { data: territories = [] } = useQuery({
        queryKey: ['territories'],
        queryFn: async () => {
            // Fetch territory with region and area names for filtering
            const { data } = await supabase.from('territories').select('*').eq('is_active', true).order('name');
            return data || [];
        },
    });


    // Filter Areas based on selected Region
    const filteredAreas = (() => {
        const selectedRegion = regions.find((r: any) => r.name === formData.region);
        if (!selectedRegion) return [];
        return areas.filter((a: any) => a.region_id === selectedRegion.id);
    })();

    // Filter Territories based on selected Area
    const filteredTerritories = (() => {
        // Filter territories whose area name matches
        // Since territories table has 'area' column (text), we match by name for now.
        return territories.filter((t: any) => t.area === formData.area);
    })();


    // Populate form when editing
    useEffect(() => {
        if (customer && open) {
            setFormData({
                id: customer.id, // Ensure ID is passed for sub-components
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
                cement_consumed: customer.cement_consumed,
                current_brand: customer.current_brand,
                notes: customer.notes,
                tags: customer.tags || [],
                customer_type: customer.customer_type, // Load customer type
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
            setBrandRecords([]);
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
            console.log('Submitting Customer Form. Data:', formData);

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

            // STRICT VALIDATION: Check all mandatory fields
            const mandatoryFields = [
                { key: 'name', label: pipeline === 'recurring' ? 'Shop Name' : 'Project Name' },
                { key: 'owner_name', label: 'Owner Name' },
                { key: 'phone', label: 'Phone Number' },
                { key: 'address', label: 'Address' },
                { key: 'region_id', label: 'Region' },
                { key: 'area_id', label: 'Area' },
                { key: 'territory_id', label: 'Territory' },
                { key: 'lat', label: 'GPS Latitude' },
                { key: 'lng', label: 'GPS Longitude' },
            ];

            for (const field of mandatoryFields) {
                const val = formData[field.key as keyof CustomerFormData];
                const isValid = typeof val === 'string' ? val.trim().length > 0 : !!val;

                if (!isValid) {
                    toast.error(`Please fill in ${field.label}`);
                    setIsSubmitting(false);
                    return;
                }
                // Special check for GPS 0,0 which is technically valid but practically invalid
                if ((field.key === 'lat' || field.key === 'lng') && Number(val) === 0) {
                    toast.error(`Please provide valid ${field.label}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            customerData.territory_id = formData.territory_id;
            customerData.region_id = formData.region_id;
            customerData.area_id = formData.area_id;

            if (pipeline === 'recurring') {
                // RECURRING SPECIFIC VALIDATION
                if (!formData.customer_type) {
                    toast.error('Please select Customer Type');
                    setIsSubmitting(false);
                    return;
                }
                if (!formData.owner_age || formData.owner_age <= 0) {
                    toast.error('Please enter a valid Owner Age');
                    setIsSubmitting(false);
                    return;
                }
                if (!formData.storage_capacity || formData.storage_capacity <= 0) {
                    toast.error('Please enter Storage Capacity');
                    setIsSubmitting(false);
                    return;
                }
                if (!formData.credit_practice) {
                    toast.error('Please select Credit Practice');
                    setIsSubmitting(false);
                    return;
                }
                if (formData.credit_practice === 'credit' && (!formData.credit_days || formData.credit_days <= 0)) {
                    toast.error('Please enter Credit Days');
                    setIsSubmitting(false);
                    return;
                }

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

                // Add Customer Type for Recurring Shops
                customerData.customer_type = formData.customer_type;

                console.log('Saving recurring shop with monthly sales:', {
                    advance: customerData.monthly_sales_advance,
                    advance_plus: customerData.monthly_sales_advance_plus,
                    green: customerData.monthly_sales_green,
                    basic: customerData.monthly_sales_basic,
                    classic: customerData.monthly_sales_classic,
                });
            } else {
                // PROJECT CUSTOMER SPECIFIC VALIDATION
                if (!formData.built_up_area || formData.built_up_area <= 0) {
                    toast.error('Please enter valid Built Up Area');
                    setIsSubmitting(false);
                    return;
                }
                if (!formData.number_of_floors || formData.number_of_floors <= 0) {
                    toast.error('Please enter valid Number of Floors');
                    setIsSubmitting(false);
                    return;
                }
                if (!formData.structure_type) {
                    toast.error('Please select Structure Type');
                    setIsSubmitting(false);
                    return;
                }
                if (formData.project_started === undefined) {
                    toast.error('Please select Project Started status');
                    setIsSubmitting(false);
                    return;
                }

                // Project customer fields
                customerData.built_up_area = formData.built_up_area;
                customerData.number_of_floors = formData.number_of_floors;
                customerData.structure_type = formData.structure_type;
                customerData.construction_stage = formData.construction_stage || 0;
                customerData.project_started = formData.project_started;
                customerData.current_brand = formData.current_brand;
                customerData.cement_consumed = formData.cement_consumed || 0;
                // cement_required will be auto-calculated by trigger
            }

            let error;
            let result;
            if (customer) {
                // Update existing customer
                result = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', customer.id);
                error = result.error;
            } else {
                // Insert new customer
                result = await supabase.from('customers').insert([customerData]).select();
                error = result.error;
            }

            if (error) throw error;

            // If new customer and has brand records, save them
            if (!customer && pipeline === 'recurring' && brandRecords.length > 0 && result.data) {
                const newCustomerId = result.data[0].id;
                const recordsToInsert = brandRecords.map(record => ({
                    customer_id: newCustomerId,
                    brand_name: record.brand_name,
                    month: record.month,
                    year: record.year,
                    monthly_volume: record.monthly_volume,
                    selling_price: record.selling_price,
                    promotions: record.promotions,
                    brand_preference_rank: record.brand_preference_rank
                }));

                const { error: brandError } = await supabase
                    .from('customer_brand_tracker')
                    .insert(recordsToInsert);

                if (brandError) {
                    console.error('Error saving brand records:', brandError);
                    toast.error('Customer saved, but failed to save brand analysis');
                }
            }

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
            setBrandRecords([]);
        } catch (error: any) {
            console.error('Error saving customer:', error);
            toast.error(error.message || 'Failed to save customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[85vw] max-h-[90vh] overflow-y-auto bg-[#061A3A] border-white/10">
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
                                    {pipeline === 'recurring' && (
                                        <div>
                                            <Label className="text-[#F0F4F8]">Customer Type *</Label>
                                            <Select
                                                value={formData.customer_type || ''}
                                                onValueChange={(v) => setFormData({ ...formData, customer_type: v })}
                                            >
                                                <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                                    <SelectItem value="Retailer">Retailer</SelectItem>
                                                    <SelectItem value="Dealer">Dealer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
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
                                    <Label className="text-[#F0F4F8]">Region *</Label>
                                    <Select
                                        value={formData.region || ''}
                                        onValueChange={(v) => {
                                            const selected = regions.find((r: any) => r.name === v);
                                            setFormData({
                                                ...formData,
                                                region: v,
                                                region_id: selected?.id,
                                                area: '',
                                                area_id: '',
                                                territory_id: ''
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                            <SelectValue placeholder="Select Region" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                            {regions.map((r: any) => (
                                                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-[#F0F4F8]">Area *</Label>
                                    <Select
                                        value={formData.area || ''} // Using Name
                                        onValueChange={(v) => {
                                            const selected = filteredAreas.find((a: any) => a.name === v);
                                            setFormData({
                                                ...formData,
                                                area: v,
                                                area_id: selected?.id,
                                                territory_id: ''
                                            });
                                        }}
                                        disabled={!formData.region}
                                    >
                                        <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                            <SelectValue placeholder="Select Area" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                            {filteredAreas.map((a: any) => (
                                                <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-[#F0F4F8]">Territory *</Label>
                                    <Select
                                        value={formData.territory_id || ''}
                                        onValueChange={(v) => setFormData({ ...formData, territory_id: v })}
                                        disabled={!formData.area}
                                    >
                                        <SelectTrigger className="bg-[#061A3A] border-white/10 text-[#F0F4F8]">
                                            <SelectValue placeholder="Select Territory" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                            {filteredTerritories.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                        <TabsContent value="recurring" className="mt-0 space-y-6">
                            <RecurringShopFields formData={formData} setFormData={setFormData} />

                            {/* Competitor Analysis Tracker */}
                            <BrandTracker
                                customerId={formData.id}
                                initialRecords={brandRecords}
                                onRecordsChange={setBrandRecords}
                            />
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
        </Dialog >
    );
}

// Recurring Shop Fields Component
function RecurringShopFields({ formData, setFormData }: any) {
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
    const [volume, setVolume] = useState<string>('');
    const [price, setPrice] = useState<string>('');

    // Mapping for product keys
    const productKeys: Record<string, { vol: string, price: string }> = {
        'AmanCem Advance': { vol: 'monthly_sales_advance', price: 'selling_price_advance' },
        'AmanCem Advance Plus': { vol: 'monthly_sales_advance_plus', price: 'selling_price_advance_plus' },
        'AmanCem Green': { vol: 'monthly_sales_green', price: 'selling_price_green' },
        'AmanCem Basic': { vol: 'monthly_sales_basic', price: 'selling_price_basic' },
        'AmanCem Classic': { vol: 'monthly_sales_classic', price: 'selling_price_classic' },
    };

    const handleAddProduct = () => {
        if (!selectedProduct || !volume || !price) {
            toast.error('Please fill all fields');
            return;
        }

        const keys = productKeys[selectedProduct];
        setFormData({
            ...formData,
            [keys.vol]: parseFloat(volume),
            [keys.price]: parseFloat(price)
        });

        // Reset inputs (keep month)
        setSelectedProduct('');
        setVolume('');
        setPrice('');
        toast.success(`${selectedProduct} added`);
    };

    const handleRemoveProduct = (product: string) => {
        const keys = productKeys[product];
        setFormData({
            ...formData,
            [keys.vol]: 0,
            [keys.price]: 0
        });
        toast.success(`${product} removed`);
    };

    // Get list of added products
    const addedProducts = Object.keys(productKeys).filter(product => {
        const keys = productKeys[product];
        return (formData[keys.vol] > 0 || formData[keys.price] > 0);
    });

    return (
        <div className="space-y-6">
            {/* Monthly Sales & Price Input */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardHeader>
                    <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                        <Store className="w-5 h-5 text-[#3A9EFF]" />
                        My Monthly Sales <span className="text-[#8B9CB8] text-sm font-normal">(Optional)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4 bg-[#061A3A] p-4 rounded-lg border border-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#8B9CB8] text-xs">Select Month</Label>
                                <Select
                                    value={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                >
                                    <SelectTrigger className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A2A5C] border-white/10">
                                        {MONTHS.map(month => (
                                            <SelectItem key={month} value={month} className="text-[#F0F4F8]">
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#8B9CB8] text-xs">Select Product</Label>
                                <Select
                                    value={selectedProduct}
                                    onValueChange={setSelectedProduct}
                                >
                                    <SelectTrigger className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                                        <SelectValue placeholder="Choose Product" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A2A5C] border-white/10">
                                        {AMAN_PRODUCTS.map(product => (
                                            <SelectItem key={product} value={product} className="text-[#F0F4F8]">
                                                {product}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#8B9CB8] text-xs">Monthly Volume (tons)</Label>
                                <Input
                                    type="number"
                                    value={volume}
                                    onChange={(e) => setVolume(e.target.value)}
                                    className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[#8B9CB8] text-xs">Selling Price (Tk/bag)</Label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8]"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={handleAddProduct}
                            className="w-full bg-[#3A9EFF] hover:bg-[#2D7FCC] text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Sales Data ({selectedMonth})
                        </Button>
                    </div>

                    {/* List of Added Products */}
                    <div className="space-y-3">
                        {addedProducts.length === 0 ? (
                            <div className="text-center text-[#8B9CB8] py-4 text-sm border border-dashed border-white/10 rounded-lg">
                                No sales data added yet.
                            </div>
                        ) : (
                            addedProducts.map(product => {
                                const keys = productKeys[product];
                                return (
                                    <div key={product} className="bg-[#061A3A] p-3 rounded-lg border border-white/10 flex justify-between items-center group">
                                        <div>
                                            <h4 className="text-[#F0F4F8] font-medium text-sm">{product}</h4>
                                            <div className="flex gap-4 mt-1">
                                                <p className="text-[#8B9CB8] text-xs">
                                                    Vol: <span className="text-[#F0F4F8]">{formData[keys.vol]} tons</span>
                                                </p>
                                                <p className="text-[#8B9CB8] text-xs">
                                                    Price: <span className="text-[#F0F4F8]">৳{formData[keys.price]}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveProduct(product)}
                                            className="text-[#8B9CB8] hover:text-[#E74C5E] hover:bg-white/5"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                );
                            })
                        )}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-[#F0F4F8]">Cement Consumed (tons)</Label>
                            <Input
                                type="number"
                                value={formData.cement_consumed || ''}
                                onChange={(e) => setFormData({ ...formData, cement_consumed: parseFloat(e.target.value) })}
                                className="bg-[#061A3A] border-white/10 text-[#F0F4F8]"
                                placeholder="50"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="project_started"
                                    checked={formData.project_started || false}
                                    onChange={(e) => setFormData({ ...formData, project_started: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-[#C41E3A] focus:ring-[#C41E3A]"
                                />
                                <Label htmlFor="project_started" className="text-[#F0F4F8] cursor-pointer">Project Already Started?</Label>
                            </div>
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
