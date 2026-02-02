import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTeam } from '@/hooks/useTeam';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';
import type { Customer } from '@/types';

interface AssignCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: Customer | null;
    onSuccess?: () => void;
}

export function AssignCustomerDialog({
    open,
    onOpenChange,
    customer,
    onSuccess
}: AssignCustomerDialogProps) {
    const { user } = useAuthStore();
    const { data: teamMembers, isLoading } = useTeam();
    const [selectedRepId, setSelectedRepId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAssign = async () => {
        if (!customer || !selectedRepId || !user) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    assigned_to: selectedRepId,
                    assigned_by: user.id,
                    assigned_at: new Date().toISOString(),
                    // Optionally update territory if the rep has a primary territory and customer doesn't?
                    // For now, just assign the rep.
                })
                .eq('id', customer.id);

            if (error) throw error;

            toast.success('Customer assigned successfully');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error assigning customer:', error);
            toast.error('Failed to assign customer');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter for Sales Reps only
    const salesReps = teamMembers?.filter(m => m.role === 'sales_rep') || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#0A2A5C] border-white/10 text-[#F0F4F8]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-[#3A9EFF]" />
                        Assign Customer
                    </DialogTitle>
                    <DialogDescription className="text-[#8B9CB8]">
                        Assign <strong>{customer?.name}</strong> to a Sales Representative.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="rep" className="text-[#F0F4F8]">Sales Representative</Label>
                        <select
                            value={selectedRepId}
                            onChange={(e) => setSelectedRepId(e.target.value)}
                            disabled={isLoading}
                            className="flex h-10 w-full rounded-md border border-white/10 bg-[#051C42] px-3 py-2 text-sm text-[#F0F4F8] focus:outline-none focus:ring-2 focus:ring-[#3A9EFF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" disabled>
                                {isLoading ? "Loading team..." : "Select Sales Rep"}
                            </option>
                            {salesReps.length === 0 ? (
                                <option value="" disabled>No sales reps found in your team</option>
                            ) : (
                                salesReps.map((rep) => (
                                    <option key={rep.id} value={rep.id} className="bg-[#0A2A5C] text-[#F0F4F8]">
                                        {rep.full_name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-white/10 text-[#F0F4F8] hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedRepId || isSubmitting}
                        className="bg-[#3A9EFF] hover:bg-[#2A8EEF] text-white"
                    >
                        {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
