// ============================================================
// AMAN CEMENT CRM — Customers List Page
// ============================================================

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  User,
  Store,
  Building2,
  Filter
} from 'lucide-react';
import type { Customer } from '@/types';

export function Customers() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recurring');

  const { data: customers, isLoading } = useCustomers({
    salesRepId: user?.role === 'sales_rep' ? user.id : undefined,
    pipeline: activeTab as 'recurring' | 'one_time',
    status: 'active',
  });

  const filteredCustomers = customers?.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#F0F4F8]">Customers</h2>
          <p className="text-[#8B9CB8] mt-1">
            Manage your customer base
          </p>
        </div>
        <Button className="bg-[#C41E3A] hover:bg-[#9B1830]">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Tabs & Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#0A2A5C] border border-white/10">
            <TabsTrigger 
              value="recurring"
              className="data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white"
            >
              <Store className="w-4 h-4 mr-2" />
              Recurring
            </TabsTrigger>
            <TabsTrigger 
              value="one_time"
              className="data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9CB8]" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-[#0A2A5C] border-white/10 text-[#F0F4F8] placeholder:text-[#4A5B7A]"
              />
            </div>
            <Button variant="outline" className="border-white/10 text-[#8B9CB8]">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="recurring" className="mt-6">
          <CustomersList 
            customers={filteredCustomers} 
            isLoading={isLoading}
            type="recurring"
          />
        </TabsContent>

        <TabsContent value="one_time" className="mt-6">
          <CustomersList 
            customers={filteredCustomers} 
            isLoading={isLoading}
            type="project"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CustomersListProps {
  customers: Customer[] | undefined;
  isLoading: boolean;
  type: 'recurring' | 'project';
}

function CustomersList({ customers, isLoading, type }: CustomersListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C41E3A]" />
      </div>
    );
  }

  if (!customers?.length) {
    return (
      <Card className="bg-[#0A2A5C] border-white/10">
        <CardContent className="py-12 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-[#4A5B7A]" />
          <h3 className="text-[#F0F4F8] font-semibold text-lg mb-2">
            No customers found
          </h3>
          <p className="text-[#8B9CB8] mb-4">
            {type === 'recurring' 
              ? 'Start by adding your first recurring customer' 
              : 'Start by adding your first project customer'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer: Customer) => {
        const pipelineData = customer.pipeline_data as any;
        
        return (
          <Card 
            key={customer.id}
            className="bg-[#0A2A5C] border-white/10 cursor-pointer hover:border-[#3A9EFF]/50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-[#F0F4F8] text-base">
                    {customer.name}
                  </CardTitle>
                  <p className="text-[#8B9CB8] text-sm mt-1">
                    {customer.area || 'No area specified'}
                  </p>
                </div>
                <Badge 
                  variant="outline"
                  className={`text-xs ${
                    customer.last_outcome === 'interested'
                      ? 'border-[#2ECC71] text-[#2ECC71]'
                      : customer.last_outcome === 'progressive'
                      ? 'border-[#3A9EFF] text-[#3A9EFF]'
                      : customer.last_outcome === 'not_interested'
                      ? 'border-[#E74C5E] text-[#E74C5E]'
                      : 'border-[#8B9CB8] text-[#8B9CB8]'
                  }`}
                >
                  {customer.last_outcome || 'New'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
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
                  <span className="text-[#8B9CB8]">
                    {customer.territory_name}
                  </span>
                </div>

                {type === 'recurring' ? (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B9CB8] text-xs">Monthly Volume</span>
                      <span className="text-[#2ECC71] font-semibold">
                        {pipelineData?.monthly_sales?.reduce(
                          (s: number, b: any) => s + (b.monthlySales || 0), 
                          0
                        ) || 0} tons
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B9CB8] text-xs">Construction</span>
                      <span className="text-[#D4A843] font-semibold">
                        {pipelineData?.construction_stage_percent || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[#8B9CB8] text-xs">Cement Needed</span>
                      <span className="text-[#2ECC71] font-semibold">
                        {pipelineData?.cement_requirement_tons || 0} tons
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                className="w-full mt-4 text-[#3A9EFF] hover:text-[#F0F4F8] hover:bg-[#3A9EFF]/10"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
