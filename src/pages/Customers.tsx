// ============================================================
// AMAN CEMENT CRM — Customers List Page
// ============================================================

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { useCustomerRecentSales } from '@/hooks/useConversions';
import { CustomerForm } from '@/components/CustomerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Store,
  Building2,
  Filter,
  TrendingUp,
  Briefcase,
  UserPlus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { AssignCustomerDialog } from '@/components/AssignCustomerDialog';
import type { Customer } from '@/types';

export function Customers() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recurring');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [customerToAssign, setCustomerToAssign] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: customers, isLoading, refetch } = useCustomers({
    salesRepId: user?.role === 'sales_rep' ? user.id : undefined,
    pipeline: activeTab as 'recurring' | 'one_time',
    status: 'active',
  });

  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers?.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(false);
    setShowCustomerForm(true);
  };

  const handleDeleteRequest = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDetails(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer.mutateAsync(customerToDelete.id);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  const handleFormSuccess = () => {
    refetch();
    setShowCustomerForm(false);
    setShowDetails(false);
  };

  const isCountryHead = user?.role === 'country_head';

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
        <Button
          onClick={() => {
            setSelectedCustomer(null);
            setShowCustomerForm(true);
          }}
          className="bg-[#C41E3A] hover:bg-[#9B1830]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        customer={selectedCustomer}
        onSuccess={handleFormSuccess}
      />

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <CustomerDetailsDialog
          open={showDetails}
          onOpenChange={setShowDetails}
          customer={selectedCustomer}
          onEdit={() => handleEditCustomer(selectedCustomer)}
          onDelete={isCountryHead ? () => handleDeleteRequest(selectedCustomer) : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#061A3A] border border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#F0F4F8] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Customer Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#8B9CB8]">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[#F0F4F8]">{customerToDelete?.name}</span>?
              This will remove all associated data including visits and records.
              <strong className="block mt-2 text-red-400">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 text-[#8B9CB8] hover:text-[#F0F4F8] bg-transparent"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteCustomer.isPending}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {deleteCustomer.isPending ? 'Deleting...' : 'Yes, Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Customer Dialog */}
      <AssignCustomerDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        customer={customerToAssign}
        onSuccess={() => {
          refetch();
          setShowAssignDialog(false);
        }}
      />

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
            onViewDetails={handleViewDetails}
            userRole={user?.role}
            onAssign={(c) => {
              setCustomerToAssign(c);
              setShowAssignDialog(true);
            }}
            onDelete={isCountryHead ? handleDeleteRequest : undefined}
          />
        </TabsContent>

        <TabsContent value="one_time" className="mt-6">
          <CustomersList
            customers={filteredCustomers}
            isLoading={isLoading}
            type="project"
            onViewDetails={handleViewDetails}
            userRole={user?.role}
            onAssign={(c) => {
              setCustomerToAssign(c);
              setShowAssignDialog(true);
            }}
            onDelete={isCountryHead ? handleDeleteRequest : undefined}
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
  onViewDetails: (customer: Customer) => void;
  userRole?: string;
  onAssign: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

function CustomersList({ customers, isLoading, type, onViewDetails, userRole, onAssign, onDelete }: CustomersListProps) {
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
                    {customer.address || 'No address specified'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${customer.last_visit_outcome === 'interested'
                    ? 'border-[#2ECC71] text-[#2ECC71]'
                    : customer.last_visit_outcome === 'progressive'
                      ? 'border-[#3A9EFF] text-[#3A9EFF]'
                      : customer.last_visit_outcome === 'not_interested'
                        ? 'border-[#E74C5E] text-[#E74C5E]'
                        : 'border-[#8B9CB8] text-[#8B9CB8]'
                    }`}
                >
                  {customer.last_visit_outcome || 'New'}
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
                  <Briefcase className="w-4 h-4 text-[#8B9CB8]" />
                  <span className="text-[#F0F4F8] flex items-center gap-2">
                    {customer.sales_rep_name ? (
                      <>
                        {customer.sales_rep_name}
                        {/* Allow re-assign if manager */}
                        {userRole !== 'sales_rep' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssign(customer);
                            }}
                            className="text-[#3A9EFF] hover:text-[#2A8EEF] text-xs p-1"
                            title="Reassign"
                          >
                            <UserPlus className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="text-yellow-500 italic">Unassigned</span>
                        {userRole !== 'sales_rep' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              onAssign(customer);
                            }}
                            className="h-5 px-2 text-xs bg-[#3A9EFF]/20 text-[#3A9EFF] hover:bg-[#3A9EFF]/30 hover:text-white"
                          >
                            Assign
                          </Button>
                        )}
                      </span>
                    )}
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
                  <span className="text-[#8B9CB8] text-xs font-mono">
                    {customer.lat && customer.lng
                      ? `${customer.lat.toFixed(4)}, ${customer.lng.toFixed(4)}`
                      : 'No GPS data'}
                  </span>
                </div>

                {type === 'recurring' ? (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B9CB8] text-sm">Monthly Volume</span>
                      <span className="text-[#2ECC71] font-semibold">
                        {((customer.monthly_sales_advance || 0) +
                          (customer.monthly_sales_advance_plus || 0) +
                          (customer.monthly_sales_green || 0) +
                          (customer.monthly_sales_basic || 0) +
                          (customer.monthly_sales_classic || 0)).toFixed(1)} tons
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 mt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B9CB8] text-sm">Cement Required</span>
                      <span className="text-[#D4A843] font-semibold">
                        {customer.cement_required || 0} tons
                      </span>
                    </div>
                  </div>
                )}

                {/* Last 30 Days Sales */}
                <CustomerSalesInfo customerId={customer.id} />
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(customer)}
                  className="flex-1 border-white/10 text-[#8B9CB8] hover:text-[#F0F4F8]"
                >
                  View Details
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(customer);
                    }}
                    className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Customer Sales Info Component (Last 30 Days)
function CustomerSalesInfo({ customerId }: { customerId: string }) {
  const { user } = useAuthStore();
  const { summary, isLoading, data, error } = useCustomerRecentSales(customerId);

  // Debug logging
  console.log('CustomerSalesInfo: Rendering for customer:', customerId);
  console.log('CustomerSalesInfo: User authenticated:', !!user, user);
  console.log('CustomerSalesInfo Debug:', {
    customerId,
    isLoading,
    hasData: !!data,
    dataLength: data?.length,
    summary,
    error
  });

  if (isLoading) {
    return (
      <div className="pt-2 mt-2 border-t border-white/10">
        <div className="text-[#8B9CB8] text-xs">Loading sales...</div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading customer sales:', error);
    return null;
  }

  if (summary.total_count === 0) {
    console.log('No sales found for customer:', customerId);
    return null; // Don't show if no sales
  }

  return (
    <div className="pt-2 mt-2 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
          <span className="text-[#8B9CB8] text-xs">Last 30 Days Sales</span>
        </div>
        <span className="text-[#8B9CB8] text-xs">
          {summary.total_count} sale{summary.total_count > 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[#8B9CB8] text-xs">Total Value</div>
          <div className="text-[#2ECC71] font-semibold text-sm">
            {summary.total_value.toLocaleString()} Tk
          </div>
        </div>
        <div>
          <div className="text-[#8B9CB8] text-xs">Total Bags</div>
          <div className="text-[#3A9EFF] font-semibold text-sm">
            {summary.total_volume.toFixed(0)} bags
          </div>
        </div>
      </div>
    </div>
  );
}

// Customer Details Dialog Component
interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onEdit: () => void;
  onDelete?: () => void;
}

function CustomerDetailsDialog({ open, onOpenChange, customer, onEdit, onDelete }: CustomerDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#061A3A] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#F0F4F8] text-2xl">{customer.name}</DialogTitle>
          <DialogDescription className="text-[#8B9CB8]">
            {customer.pipeline === 'recurring' ? 'Recurring Shop' : 'Project Customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <Card className="bg-[#0A2A5C] border-white/10">
            <CardHeader>
              <CardTitle className="text-[#F0F4F8]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#8B9CB8] text-sm">Owner Name</p>
                  <p className="text-[#F0F4F8]">{customer.owner_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#8B9CB8] text-sm">Phone</p>
                  <p className="text-[#F0F4F8]">{customer.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[#8B9CB8] text-sm">Address</p>
                  <p className="text-[#F0F4F8]">{customer.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#8B9CB8] text-sm">GPS Latitude</p>
                  <p className="text-[#F0F4F8] font-mono text-xs">{customer.lat?.toFixed(6) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#8B9CB8] text-sm">GPS Longitude</p>
                  <p className="text-[#F0F4F8] font-mono text-xs">{customer.lng?.toFixed(6) || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Shop Details */}
          {customer.pipeline === 'recurring' && (
            <Card className="bg-[#0A2A5C] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F0F4F8]">Shop Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[#8B9CB8] text-sm mb-2">Monthly Sales (tons)</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {customer.monthly_sales_advance && (
                      <div>Advance: <span className="text-[#2ECC71]">{customer.monthly_sales_advance}</span></div>
                    )}
                    {customer.monthly_sales_basic && (
                      <div>Basic: <span className="text-[#2ECC71]">{customer.monthly_sales_basic}</span></div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[#8B9CB8] text-sm">Credit Practice</p>
                  <p className="text-[#F0F4F8]">
                    {customer.credit_practice || 'N/A'}
                    {customer.credit_days && ` (${customer.credit_days} days)`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Details */}
          {customer.pipeline === 'one_time' && (
            <Card className="bg-[#0A2A5C] border-white/10">
              <CardHeader>
                <CardTitle className="text-[#F0F4F8]">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Built-up Area</p>
                    <p className="text-[#F0F4F8]">{customer.built_up_area || 0} sqft</p>
                  </div>
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Floors</p>
                    <p className="text-[#F0F4F8]">{customer.number_of_floors || 0}</p>
                  </div>
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Structure Type</p>
                    <p className="text-[#F0F4F8]">{customer.structure_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Construction Stage</p>
                    <p className="text-[#D4A843] font-semibold">{customer.construction_stage || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Cement Required</p>
                    <p className="text-[#2ECC71] font-semibold">{customer.cement_required || 0} tons</p>
                  </div>
                  <div>
                    <p className="text-[#8B9CB8] text-sm">Cement Remaining</p>
                    <p className="text-[#2ECC71] font-semibold">{customer.cement_remaining || 0} tons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3">
            <div>
              {onDelete && (
                <Button
                  onClick={onDelete}
                  variant="outline"
                  className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Customer
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 text-[#8B9CB8]"
              >
                Close
              </Button>
              <Button
                onClick={onEdit}
                className="bg-[#3A9EFF] hover:bg-[#2D7FCC]"
              >
                Edit Customer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
