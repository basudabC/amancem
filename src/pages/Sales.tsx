// ============================================================
// Sales Page — Quick Sales Recording
// Search for shops and record sales with auto-filled data
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ConversionForm } from '@/components/ConversionForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Phone, MapPin, Store, User } from 'lucide-react';
import type { Customer } from '@/types';

export function Sales() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showSaleForm, setShowSaleForm] = useState(false);

    // Fetch all active customers for search
    const { data: customers, isLoading, refetch } = useQuery({
        queryKey: ['customers-for-sales'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            return data as Customer[];
        },
    });

    // Filter customers based on search
    const filteredCustomers = customers?.filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
            customer.name.toLowerCase().includes(query) ||
            customer.shop_name?.toLowerCase().includes(query) ||
            customer.owner_name?.toLowerCase().includes(query) ||
            customer.phone?.includes(query)
        );
    });

    const handleRecordSale = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowSaleForm(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#F0F4F8]">Quick Sales</h2>
                <p className="text-[#8B9CB8] mt-1">
                    Search for customers and record sales quickly
                </p>
            </div>

            {/* Search Bar */}
            <Card className="bg-[#0A2A5C] border-white/10">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B9CB8]" />
                        <Input
                            placeholder="Search by shop name, owner name, or phone number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 bg-[#061A3A] border-white/10 text-[#F0F4F8] placeholder:text-[#4A5B7A] h-12 text-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C41E3A]" />
                </div>
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map((customer) => (
                        <Card
                            key={customer.id}
                            className="bg-[#0A2A5C] border-white/10 hover:border-[#3A9EFF]/50 transition-colors"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-[#F0F4F8] text-base">
                                            {customer.shop_name || customer.name}
                                        </CardTitle>
                                        <p className="text-[#8B9CB8] text-sm mt-1">
                                            {customer.pipeline === 'recurring' ? 'Recurring Shop' : 'Project'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${customer.is_converted
                                            ? 'border-[#2ECC71] text-[#2ECC71]'
                                            : 'border-[#8B9CB8] text-[#8B9CB8]'
                                            }`}
                                    >
                                        {customer.is_converted ? 'Converted' : 'Prospect'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-[#8B9CB8]" />
                                        <span className="text-[#F0F4F8]">
                                            {customer.owner_name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-[#8B9CB8]" />
                                        <span className="text-[#8B9CB8]">
                                            {customer.phone || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-[#8B9CB8]" />
                                        <span className="text-[#8B9CB8] text-xs">
                                            {customer.address || 'No address'}
                                        </span>
                                    </div>
                                </div>

                                {/* Previous Sales Data (if recurring shop) */}
                                {customer.pipeline === 'recurring' && (
                                    <div className="pt-2 mt-2 border-t border-white/10">
                                        <p className="text-[#8B9CB8] text-xs mb-1">Previous Sales Data:</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            {customer.monthly_sales_advance && (
                                                <div className="text-[#8B9CB8]">
                                                    Advance: <span className="text-[#F0F4F8]">{customer.monthly_sales_advance}t</span>
                                                </div>
                                            )}
                                            {customer.monthly_sales_basic && (
                                                <div className="text-[#8B9CB8]">
                                                    Basic: <span className="text-[#F0F4F8]">{customer.monthly_sales_basic}t</span>
                                                </div>
                                            )}
                                        </div>
                                        {customer.credit_practice && (
                                            <div className="text-xs text-[#8B9CB8] mt-1">
                                                Credit: <span className="text-[#F0F4F8]">{customer.credit_practice}</span>
                                                {customer.credit_days && ` (${customer.credit_days} days)`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Project Info */}
                                {customer.pipeline === 'one_time' && (
                                    <div className="pt-2 mt-2 border-t border-white/10">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-[#8B9CB8]">Construction:</span>
                                                <span className="text-[#D4A843] font-semibold ml-1">
                                                    {customer.construction_stage || 0}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[#8B9CB8]">Cement:</span>
                                                <span className="text-[#2ECC71] font-semibold ml-1">
                                                    {customer.cement_remaining || 0}t left
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={() => handleRecordSale(customer)}
                                    className="w-full bg-[#2ECC71] hover:bg-[#27AE60]"
                                >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Record Sale
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-[#0A2A5C] border-white/10">
                    <CardContent className="py-12 text-center">
                        <Store className="w-16 h-16 mx-auto mb-4 text-[#4A5B7A]" />
                        <h3 className="text-[#F0F4F8] font-semibold text-lg mb-2">
                            {searchQuery ? 'No customers found' : 'No customers yet'}
                        </h3>
                        <p className="text-[#8B9CB8]">
                            {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Conversion Form */}
            {selectedCustomer && (
                <ConversionForm
                    open={showSaleForm}
                    onOpenChange={setShowSaleForm}
                    customer={selectedCustomer}
                    onSuccess={() => {
                        refetch();
                        setShowSaleForm(false);
                    }}
                />
            )}
        </div>
    );
}
