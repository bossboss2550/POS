import { useEffect, useMemo, useState, useTransition, type ChangeEvent, type KeyboardEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CameraScanModal } from "@/components/pos/CameraScanModal";
import { ProductImage } from "@/components/products/ProductImage";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import { resolveProductImageUrl } from "@/utils";
import {
  getBarcodeCharacterFromEvent,
  insertBarcodeCharacter,
  normalizeBarcodeValue,
} from "@/utils/barcodeKeyboard";
import type { Category, Product } from "@/types";
import type { ProductUpsertInput } from "@/services/types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  barcode: z.string().min(4, "Barcode required"),
  categoryId: z.string().min(1, "Category required"),
  price: z.coerce.number().positive("Price must be positive"),
  cost: z.coerce.number().min(0, "Cost must be >= 0"),
  stock: z.coerce.number().int().min(0, "Stock must be >= 0"),
  minStock: z.coerce.number().int().min(0),
  unit: z.string().min(1, "Unit required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  product?: Product | null;
  initialValues?: Partial<FormValues>;
  categories: Category[];
  onSuccess: (product: Product) => void | Promise<void>;
  onCancel: () => void;
}

function createDefaultValues(initialValues?: Partial<FormValues>): FormValues {
  return {
    name: initialValues?.name ?? "",
    barcode: initialValues?.barcode ?? "",
    categoryId: initialValues?.categoryId ?? "",
    price: initialValues?.price ?? 0,
    cost: initialValues?.cost ?? 0,
    stock: initialValues?.stock ?? 0,
    minStock: initialValues?.minStock ?? 5,
    unit: initialValues?.unit ?? "pcs",
    description: initialValues?.description ?? "",
    imageUrl: initialValues?.imageUrl ?? "",
    isActive: initialValues?.isActive ?? true,
  };
}

export function ProductForm({ product, initialValues, categories, onSuccess, onCancel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [scanOpen, setScanOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const notify = useNotification();
  const isEdit = !!product;
  const createDefaults = useMemo(() => createDefaultValues(initialValues), [initialValues]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: product ? { ...product, imageUrl: product.imageUrl ?? product.image ?? "" } : createDefaults,
  });

  const barcodeField = register("barcode");
  const watchedName = watch("name");
  const watchedImageUrl = watch("imageUrl");

  useEffect(() => {
    const nextImageUrl = product?.imageUrl ?? product?.image ?? createDefaults.imageUrl ?? "";

    if (product) {
      reset({ ...product, imageUrl: nextImageUrl });
    } else {
      reset(createDefaults);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl(resolveProductImageUrl(nextImageUrl));
  }, [product, reset, createDefaults]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const applyScannedBarcode = (barcode: string) => {
    setValue("barcode", normalizeBarcodeValue(barcode), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setScannedBarcode(null);
    setConfirmReplaceOpen(false);
    setScanOpen(false);
    notify.success(`Scanned barcode: ${barcode}`);
  };

  const handleBarcodeScan = (barcode: string) => {
    const normalizedBarcode = normalizeBarcodeValue(barcode);
    const currentBarcode = normalizeBarcodeValue(getValues("barcode") ?? "");

    if (currentBarcode && currentBarcode !== normalizedBarcode) {
      setScannedBarcode(normalizedBarcode);
      setConfirmReplaceOpen(true);
      return;
    }

    applyScannedBarcode(normalizedBarcode);
  };

  const handleBarcodeInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const character = getBarcodeCharacterFromEvent(event.nativeEvent);

    if (!character || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    event.preventDefault();
    insertBarcodeCharacter(event.currentTarget, character, getValues("barcode") ?? "");
  };

  const handleBarcodeInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    barcodeField.onChange(event);

    const normalizedValue = normalizeBarcodeValue(event.target.value);
    if (normalizedValue !== event.target.value) {
      setValue("barcode", normalizedValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify.error("Please choose an image file");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      notify.error("Image must be 5 MB or smaller");
      event.target.value = "";
      return;
    }

    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreviewUrl(nextPreviewUrl);
    setValue("imageUrl", "", { shouldDirty: true, shouldTouch: true });
    event.target.value = "";
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setValue("imageUrl", "", { shouldDirty: true, shouldTouch: true });
  };

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    startTransition(async () => {
      try {
        const { productService } = await getServices();
        let imageUrl = data.imageUrl?.trim() ?? "";

        if (selectedImageFile) {
          imageUrl = await productService.uploadProductImage(selectedImageFile);
        }

        const payload: ProductUpsertInput = {
          ...data,
          barcode: normalizeBarcodeValue(data.barcode),
          imageUrl,
          image: imageUrl || undefined,
        };

        const savedProduct = isEdit && product
          ? await productService.updateProduct(product.id, payload)
          : await productService.createProduct(payload);

        notify.success(isEdit ? "Product updated successfully" : "Product created successfully");
        await onSuccess(savedProduct);
      } catch (err: any) {
        const apiMsg = err.response?.data?.message;
        const msg = Array.isArray(apiMsg)
          ? apiMsg.join(", ")
          : apiMsg ?? err.message ?? "Failed to save product";
        notify.error(msg);
        console.error("Product save error:", err);
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Product Name *"
            placeholder="e.g. Coca-Cola 330ml"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Input
              label="Barcode *"
              placeholder="e.g. 5000112637922"
              error={errors.barcode?.message}
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              {...barcodeField}
              onChange={handleBarcodeInputChange}
              onKeyDown={handleBarcodeInputKeyDown}
            />
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600"
              aria-label="Scan barcode"
              title="Scan barcode"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Product Photo</label>
            <ProductImage
              product={{ name: watchedName || "Product photo", imageUrl: imagePreviewUrl ?? watchedImageUrl }}
              className="aspect-square w-full border border-gray-200 bg-white"
              iconClassName="h-10 w-10"
            />
            <p className="text-xs text-gray-500">Stored locally on your on-prem server. JPG, PNG, WebP, AVIF up to 5 MB.</p>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600">
              <ImagePlus className="h-4 w-4" />
              <span>{selectedImageFile ? "Replace photo" : imagePreviewUrl ? "Change photo" : "Upload photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {selectedImageFile ? `Ready to upload: ${selectedImageFile.name}` : imagePreviewUrl ? "Using saved product photo" : "No product photo selected"}
            </div>

            {(imagePreviewUrl || watchedImageUrl) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
          <select
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryId ? "border-red-400" : "border-gray-300"
            }`}
            {...register("categoryId")}
          >
            <option value="">Select category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="Selling Price *" type="number" step="0.01" error={errors.price?.message} {...register("price")} />
          <Input label="Cost Price *" type="number" step="0.01" error={errors.cost?.message} {...register("cost")} />
          <Input label="Current Stock *" type="number" error={errors.stock?.message} {...register("stock")} />
          <Input label="Min Stock Alert" type="number" error={errors.minStock?.message} {...register("minStock")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Unit *" placeholder="e.g. pcs, kg, bottle" error={errors.unit?.message} {...register("unit")} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4 rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible on POS)
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={2}
            placeholder="Optional description..."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register("description")}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>

      <CameraScanModal open={scanOpen} onClose={() => setScanOpen(false)} onScan={handleBarcodeScan} />

      <ConfirmDialog
        open={confirmReplaceOpen}
        title="Replace barcode?"
        message={`Replace the current barcode with ${scannedBarcode ?? "the scanned barcode"}?`}
        confirmLabel="Replace"
        onConfirm={() => {
          if (scannedBarcode) {
            applyScannedBarcode(scannedBarcode);
          }
        }}
        onClose={() => {
          setConfirmReplaceOpen(false);
          setScannedBarcode(null);
        }}
      />
    </>
  );
}

