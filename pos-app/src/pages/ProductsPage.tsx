import { useDeferredValue, useEffect, useState, useTransition, useCallback } from "react";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import { formatCurrency } from "@/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductImage } from "@/components/products/ProductImage";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Search, Edit2, Trash2, Package, BarChart2, Filter } from "lucide-react";
import type { Category, Product } from "@/types";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
  const notify = useNotification();
  const { isMobile } = useMobileLayout();

  const load = useCallback(async () => {
    setLoading(true);
    const { productService } = await getServices();
    const [productPage, categoryList] = await Promise.all([
      productService.getProducts({ page: 1, pageSize: 500, includeInactive: true }),
      productService.getCategories(),
    ]);

    setProducts(productPage.data);
    setCategories(categoryList);
    setLoading(false);
  }, [setProducts, setCategories, setLoading]); // Dependencies

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = products.filter((product) => {
    const query = deferredSearch.toLowerCase();
    const matchesSearch = !query
      || product.name.toLowerCase().includes(query)
      || product.barcode.includes(query);
    const matchesCategory = catFilter === "all" || product.categoryId === catFilter;
    const matchesStatus = statusFilter === "all" 
      || (statusFilter === "active" && product.isActive)
      || (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    startTransition(async () => {
      const { productService } = await getServices();
      await productService.deleteProduct(deleteTarget.id);
      notify.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await load();
    });
  };

  const handleToggleActive = async (product: Product) => {
    startTransition(async () => {
      try {
        const { productService } = await getServices();
        await productService.updateProduct(product.id, { isActive: !product.isActive });
        notify.success(`"${product.name}" ${!product.isActive ? "activated" : "deactivated"}`);
        await load();
      } catch (err: any) {
        notify.error("Failed to update status");
      }
    });
  };

  const openCreate = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const onFormSuccess = async () => {
    setModalOpen(false);
    await load();
  };

  const getCategoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? id;
  const lowStockCount = products.filter((product) => product.stock <= product.minStock).length;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} products · {lowStockCount > 0 && <span className="font-medium text-orange-600">{lowStockCount} low stock</span>}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:flex"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="min-w-48 flex-1">
          <Input
            placeholder="Search by name or barcode..."
            prefix={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={catFilter}
            onChange={(event) => setCatFilter(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          </div>

          <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as any)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          </select>
          </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="No products found"
          description="Try adjusting your search or add a new product"
          action={
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Product
            </button>
          }
        />
      ) : isMobile ? (
        <div className="grid grid-cols-1 gap-3 pb-20">
          {filtered.map((product) => {
            const isLow = product.stock <= product.minStock;

            return (
              <div key={product.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <ProductImage product={product} className="h-14 w-14 shrink-0 border border-gray-100 bg-white" iconClassName="h-6 w-6" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{product.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">{product.barcode}</p>
                    </div>
                    <Badge label={product.isActive ? "Active" : "Inactive"} variant={product.isActive ? "success" : "neutral"} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-bold text-blue-600">{formatCurrency(product.price)}</span>
                    <span className={`flex items-center gap-1 ${isLow ? "font-medium text-orange-600" : "text-gray-500"}`}>
                      {isLow && <BarChart2 className="h-3 w-3" />}
                      {product.stock} {product.unit}
                    </span>
                    <span className="text-xs text-gray-400">{getCategoryName(product.categoryId)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => handleToggleActive(product)} 
                    className={`p-1 rounded-md transition-colors ${product.isActive ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                    title={product.isActive ? "Deactivate" : "Activate"}>
                    <Package className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => openEdit(product)} className="text-gray-400 transition-colors hover:text-blue-600" aria-label={`Edit ${product.name}`}>
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(product)} className="text-gray-400 transition-colors hover:text-red-600" aria-label={`Delete ${product.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  {["Product", "Barcode", "Category", "Price", "Cost", "Stock", "Status", "Actions"].map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((product) => (
                  <tr key={product.id} className="group hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} className="h-12 w-12 shrink-0 border border-gray-100 bg-white" iconClassName="h-5 w-5" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && <div className="max-w-xs truncate text-xs text-gray-400">{product.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.barcode}</td>
                    <td className="px-4 py-3 text-gray-600">{getCategoryName(product.categoryId)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatCurrency(product.cost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={product.stock <= product.minStock ? "font-semibold text-red-600" : "text-gray-700"}>{product.stock}</span>
                        <span className="text-xs text-gray-400">{product.unit}</span>
                        {product.stock <= product.minStock && <BarChart2 className="h-3.5 w-3.5 text-orange-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={product.isActive ? "Active" : "Inactive"} variant={product.isActive ? "success" : "neutral"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-100 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={() => handleToggleActive(product)}
                          className={`rounded-lg p-2 transition-colors ${product.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                          title={product.isActive ? "Deactivate" : "Activate"}>
                          <Package className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => openEdit(product)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${product.name}`}>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(product)} className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${product.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={openCreate}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 sm:hidden"
        aria-label="Add Product"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? "Edit Product" : "Add New Product"} size="lg">
        <ProductForm
          product={editProduct}
          categories={categories}
          onSuccess={onFormSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This hides it from POS and product lists.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

