import { useEffect, useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import type { Customer } from "@/types";

const schema = z.object({
  name:    z.string().min(2, "Name must be at least 2 characters"),
  phone:   z.string().min(8, "Phone number required"),
  email:   z.string().email("Invalid email").or(z.literal("")),
  address: z.string().optional(),
  memberTier: z.enum(["bronze","silver","gold","platinum"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const TIER_OPTIONS = [
  { value: "bronze",   label: "🥉 Bronze" },
  { value: "silver",   label: "🥈 Silver" },
  { value: "gold",     label: "🥇 Gold" },
  { value: "platinum", label: "💎 Platinum" },
] as const;

export function CustomerForm({ customer, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const notify  = useNotification();
  const isEdit  = !!customer;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: customer
      ? { name: customer.name, phone: customer.phone, email: customer.email ?? "", address: customer.address ?? "", memberTier: customer.memberTier }
      : { name: "", phone: "", email: "", address: "", memberTier: "bronze" },
  });

  useEffect(() => {
    if (customer) reset({ name: customer.name, phone: customer.phone, email: customer.email ?? "", address: customer.address ?? "", memberTier: customer.memberTier });
  }, [customer, reset]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      try {
        const { customerService } = await getServices();
        if (isEdit && customer) {
          await customerService.updateCustomer(customer.id, data);
          notify.success("Customer updated");
        } else {
          await customerService.createCustomer(data);
          notify.success("Customer added");
        }
        onSuccess();
      } catch (err: any) {
        notify.error(err.message ?? "Failed to save customer");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" placeholder="e.g. Somchai Jaidee"
          error={errors.name?.message} {...register("name")} />
        <Input label="Phone *" placeholder="e.g. 0812345678"
          error={errors.phone?.message} {...register("phone")} />
      </div>
      <Input label="Email" placeholder="email@example.com (optional)"
        type="email" error={errors.email?.message} {...register("email")} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea rows={2} placeholder="Address (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          {...register("address")} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Member Tier</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register("memberTier")}>
          {TIER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {isPending ? "Saving..." : isEdit ? "Update Customer" : "Add Customer"}
        </button>
      </div>
    </form>
  );
}
