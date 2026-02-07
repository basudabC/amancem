import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp, DollarSign, Award, Tag } from 'lucide-react';
import { format } from 'date-fns';

export interface BrandRecord {
    id: string;
    brand_name: string;
    month: string;
    year: number;
    monthly_volume: number;
    selling_price: number;
    promotions: string;
    brand_preference_rank: number;
}

interface BrandTrackerProps {
    customerId?: string;
    initialRecords?: BrandRecord[];
    onRecordsChange?: (records: BrandRecord[]) => void;
}

const COMPETITOR_BRANDS = [
    'Aman Cement',
    'Heidelberg',
    'Seven Rings',
    'Shah',
    'Bashundhara',
    'Fresh',
    'Premier',
    'Crown',
    'Metrocem',
    'Scan Cement'
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function BrandTracker({ customerId, initialRecords = [], onRecordsChange }: BrandTrackerProps) {
    const [records, setRecords] = useState<BrandRecord[]>(initialRecords);
    const [isLoading, setIsLoading] = useState(!!customerId);
    const [isAdding, setIsAdding] = useState(false);

    // New Record State
    const [newRecord, setNewRecord] = useState<Partial<BrandRecord>>({
        brand_name: '',
        month: format(new Date(), 'MMMM'),
        year: new Date().getFullYear(),
        monthly_volume: 0,
        selling_price: 0,
        promotions: '',
        brand_preference_rank: 1
    });

    useEffect(() => {
        if (customerId) {
            fetchBrandRecords();
        } else {
            setRecords(initialRecords);
            setIsLoading(false);
        }
    }, [customerId, initialRecords]);

    // Notify parent of changes whenever records update
    useEffect(() => {
        if (onRecordsChange) {
            onRecordsChange(records);
        }
    }, [records, onRecordsChange]);

    const fetchBrandRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('customer_brand_tracker')
                .select('*')
                .eq('customer_id', customerId)
                .order('year', { ascending: false })
                .order('created_at', { ascending: false }); // Secondary sort

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error fetching brand records:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRecord = async () => {
        if (!newRecord.brand_name) {
            toast.error('Please select a brand');
            return;
        }

        try {
            setIsAdding(true);

            if (customerId) {
                // Determine rank based on volume if not manually set (optional logic, kept simple for now)

                const { error } = await supabase.from('customer_brand_tracker').insert({
                    customer_id: customerId,
                    ...newRecord
                });

                if (error) throw error;

                toast.success('Brand record added');
                fetchBrandRecords();
            } else {
                // Local state only for new customers
                const tempRecord = {
                    ...newRecord,
                    id: `temp-${Date.now()}`, // Temporary ID
                } as BrandRecord;

                setRecords(prev => [tempRecord, ...prev]);
                toast.success('Record added (will be saved with customer)');
            }

            // Reset form but keep month/year for convenience
            setNewRecord(prev => ({
                ...prev,
                brand_name: '',
                monthly_volume: 0,
                selling_price: 0,
                promotions: '',
                brand_preference_rank: 1
            }));

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            if (customerId && !id.startsWith('temp-')) {
                const { error } = await supabase
                    .from('customer_brand_tracker')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                toast.success('Record deleted');
                fetchBrandRecords();
            } else {
                setRecords(prev => prev.filter(r => r.id !== id));
                toast.success('Record removed');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            toast.error('Failed to delete record');
        }
    };

    return (
        <Card className="bg-[#0A2A5C] border-white/10 mt-6">
            <CardHeader>
                <CardTitle className="text-[#F0F4F8] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#3A9EFF]" />
                    Market Competitor Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add New Record Form */}
                <div className="bg-[#061A3A] p-4 rounded-lg border border-white/5 space-y-4">
                    <h4 className="text-[#F0F4F8] font-medium text-sm border-b border-white/10 pb-2 mb-3">
                        Add Monthly Record
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        <div className="space-y-1">
                            <Label className="text-[#8B9CB8] text-xs">Brand</Label>
                            <Select
                                value={newRecord.brand_name}
                                onValueChange={(v) => setNewRecord({ ...newRecord, brand_name: v })}
                            >
                                <SelectTrigger className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs">
                                    <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0A2A5C] border-white/10">
                                    {COMPETITOR_BRANDS.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[#8B9CB8] text-xs">Month</Label>
                            <Select
                                value={newRecord.month}
                                onValueChange={(v) => setNewRecord({ ...newRecord, month: v })}
                            >
                                <SelectTrigger className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0A2A5C] border-white/10">
                                    {MONTHS.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[#8B9CB8] text-xs">Selling Price (Tk)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-1.5 w-3 h-3 text-[#8B9CB8]" />
                                <Input
                                    type="number"
                                    value={newRecord.selling_price || ''}
                                    onChange={(e) => setNewRecord({ ...newRecord, selling_price: parseFloat(e.target.value) })}
                                    className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs pl-7"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[#8B9CB8] text-xs">Volume (Bags)</Label>
                            <Input
                                type="number"
                                value={newRecord.monthly_volume || ''}
                                onChange={(e) => setNewRecord({ ...newRecord, monthly_volume: parseFloat(e.target.value) })}
                                className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs"
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-1 col-span-2">
                            <Label className="text-[#8B9CB8] text-xs">Promotions (Last 6 Months)</Label>
                            <div className="relative">
                                <Tag className="absolute left-2 top-1.5 w-3 h-3 text-[#8B9CB8]" />
                                <Input
                                    value={newRecord.promotions || ''}
                                    onChange={(e) => setNewRecord({ ...newRecord, promotions: e.target.value })}
                                    className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs pl-7"
                                    placeholder="e.g. Foreign Trip, Gold Coin"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[#8B9CB8] text-xs">Rank (1-5)</Label>
                            <div className="relative">
                                <Award className="absolute left-2 top-1.5 w-3 h-3 text-[#8B9CB8]" />
                                <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newRecord.brand_preference_rank || ''}
                                    onChange={(e) => setNewRecord({ ...newRecord, brand_preference_rank: parseInt(e.target.value) })}
                                    className="bg-[#0A2A5C] border-white/10 text-[#F0F4F8] h-8 text-xs pl-7"
                                />
                            </div>
                        </div>



                        <div className="flex items-end">
                            <Button
                                type="button"
                                onClick={handleAddRecord}
                                disabled={isAdding}
                                className="w-full h-8 bg-[#2ECC71] hover:bg-[#27AE60] text-xs"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Record
                            </Button>
                        </div>
                    </div>
                </div>


                {/* Desktop Table View (Hidden on Mobile) */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#0F3460] text-[#8B9CB8] text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3">Brand</th>
                                <th className="px-4 py-3">Month</th>
                                <th className="px-4 py-3 text-right">Price</th>
                                <th className="px-4 py-3 text-right">Volume</th>
                                <th className="px-4 py-3">Promotions</th>
                                <th className="px-4 py-3 text-center">Rank</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-[#8B9CB8]">
                                        No competitor data added yet.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-[#F0F4F8]">{record.brand_name}</td>
                                        <td className="px-4 py-3 text-[#B0BCCF]">
                                            {record.month} {record.year}
                                        </td>
                                        <td className="px-4 py-3 text-right text-[#F0F4F8]">
                                            ৳{record.selling_price}
                                        </td>
                                        <td className="px-4 py-3 text-right text-[#F0F4F8]">
                                            {record.monthly_volume}
                                        </td>
                                        <td className="px-4 py-3 text-[#B0BCCF] truncate max-w-[150px]">
                                            {record.promotions || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${record.brand_preference_rank === 1 ? 'bg-[#FFD700] text-black' :
                                                record.brand_preference_rank === 2 ? 'bg-[#C0C0C0] text-black' :
                                                    record.brand_preference_rank === 3 ? 'bg-[#CD7F32] text-black' :
                                                        'bg-white/10 text-white'
                                                }`}>
                                                #{record.brand_preference_rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDeleteRecord(record.id)}
                                                className="text-[#E74C5E] hover:text-[#FF6B6B]"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View (Visible on Mobile) */}
                <div className="md:hidden space-y-3">
                    {records.length === 0 ? (
                        <div className="text-center text-[#8B9CB8] py-4 border border-white/5 rounded-lg">
                            No component data added yet.
                        </div>
                    ) : (
                        records.map((record) => (
                            <div key={record.id} className="bg-[#061A3A] p-3 rounded-lg border border-white/10 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-[#F0F4F8] font-medium">{record.brand_name}</h4>
                                        <p className="text-[#8B9CB8] text-xs">{record.month} {record.year}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${record.brand_preference_rank === 1 ? 'bg-[#FFD700] text-black' :
                                            record.brand_preference_rank === 2 ? 'bg-[#C0C0C0] text-black' :
                                                record.brand_preference_rank === 3 ? 'bg-[#CD7F32] text-black' :
                                                    'bg-white/10 text-white'
                                            }`}>
                                            #{record.brand_preference_rank}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteRecord(record.id)}
                                            className="text-[#E74C5E] hover:text-[#FF6B6B] p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-[#0A2A5C] p-2 rounded border border-white/5">
                                        <span className="text-[#8B9CB8] text-xs block">Price</span>
                                        <span className="text-[#F0F4F8]">৳{record.selling_price}</span>
                                    </div>
                                    <div className="bg-[#0A2A5C] p-2 rounded border border-white/5">
                                        <span className="text-[#8B9CB8] text-xs block">Volume</span>
                                        <span className="text-[#F0F4F8]">{record.monthly_volume} bags</span>
                                    </div>
                                </div>

                                {record.promotions && (
                                    <div className="text-xs text-[#B0BCCF] flex items-start gap-1">
                                        <Tag className="w-3 h-3 mt-0.5 text-[#3A9EFF]" />
                                        <span>{record.promotions}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
