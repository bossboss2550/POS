import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, Printer, Tag, Plus, Minus, Filter } from "lucide-react";
import { getServices } from "@/services";
import { useNotification } from "@/hooks/useNotification";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import { usePrint } from "@/hooks/usePrint";
import { Input } from "@/components/ui/Input";
import { ProductImage } from "@/components/products/ProductImage";
import { PrintablePriceTagSheet, type PriceTagPrintItem } from "@/components/price-tags/PrintablePriceTagSheet";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/utils";
import type { Category, Product } from "@/types";

interface SelectedTagItem {
  product: Product;
  copies: number;
}

export function PriceTagsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedTagItem>>({});
  const deferredSearch = useDeferredValue(search);
  const notify = useNotification();
  const { isMobile } = useMobileLayout();
  const { contentRef, print } = usePrint<HTMLDivElement>({
    documentTitle: "price-tags",
    printStyle: `
      @page { size: A4 portrait; margin: 8mm; }
      .print-sheet { max-width: none !important; padding: 0 !important; }
      .print-tag-grid { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 3mm !important; }
      .print-tag-card { break-inside: avoid; box-shadow: none !important; min-height: 34mm; }
    `,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      const { productService } = await getServices();
      const [productPage, categoryList] = await Promise.all([
        productService.getProducts({ page: 1, pageSize: 500 }),
        productService.getCategories(),
      ]);

      if (!active) {
        return;
      }

      setProducts(productPage.data.filter((product) => product.isActive));
      setCategories(categoryList);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = deferredSearch.toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !query
        || product.name.toLowerCase().includes(query)
        || product.barcode.includes(query);
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, deferredSearch, categoryId]);

  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);

  const printItems = useMemo<PriceTagPrintItem[]>(() => {
    return selectedList.flatMap((item) =>
      Array.from({ length: item.copies }, (_, index) => ({
        product: item.product,
        copyNumber: index + 1,
        totalCopies: item.copies,
      })),
    );
  }, [selectedList]);

  const addProduct = (product: Product) => {
    setSelectedItems((current) => {
      const existing = current[product.id];
      return {
        ...current,
        [product.id]: {
          product,
          copies: existing ? existing.copies + 1 : 1,
        },
      };
    });
  };

  const updateCopies = (productId: string, nextCopies: number) => {
    setSelectedItems((current) => {
      if (nextCopies <= 0) {
        const clone = { ...current };
        delete clone[productId];
        return clone;
      }

      const item = current[productId];
      if (!item) {
        return current;
      }

      return {
        ...current,
        [productId]: { ...item, copies: nextCopies },
      };
    });
  };

  const printTags = () => {
    if (printItems.length === 0) {
      notify.warning("Select at least one product before printing");
      return;
    }

    print();
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Price Tags</h1>
          <p className="mt-1 text-sm text-gray-500">Select products, set copies, preview tags, then print or save as PDF.</p>
        </div>

        <button
          type="button"
          onClick={printTags}
          className="no-print inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          Print / PDF ({printItems.length})
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or barcode..."
                prefix={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
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
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState icon={<Tag className="h-14 w-14" />} title="No products found" description="Try a different search or category." />
          ) : (
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {filteredProducts.map((product) => {
                const selectedCopies = selectedItems[product.id]?.copies ?? 0;
                return (
                  <div key={product.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <ProductImage product={product} className="h-16 w-16 shrink-0 border border-gray-100 bg-white" iconClassName="h-6 w-6" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{product.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">{product.barcode}</p>
                      <p className="mt-1 text-sm font-bold text-blue-600">{formatCurrency(product.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProduct(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4" />
                      {selectedCopies > 0 ? selectedCopies : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm no-print">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Selected Products</h2>
                <p className="text-sm text-gray-500">{selectedList.length} products · {printItems.length} tags</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItems({})}
                disabled={selectedList.length === 0}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedList.length === 0 ? (
                <p className="rounded-xl bg-gray-50 px-3 py-4 text-sm text-gray-500">Add products to build your print sheet.</p>
              ) : (
                selectedList.map((item) => (
                  <div key={item.product.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-400">{item.product.barcode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCopies(item.product.id, 0)}
                        className="text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">Copies</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateCopies(item.product.id, item.copies - 1)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label={`Decrease copies for ${item.product.name}`}>
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-gray-900">{item.copies}</span>
                        <button type="button" onClick={() => updateCopies(item.product.id, item.copies + 1)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label={`Increase copies for ${item.product.name}`}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 no-print">
          <div>
            <h2 className="font-semibold text-gray-900">Preview</h2>
            <p className="text-sm text-gray-500">This is the same sheet used for printing and Save as PDF.</p>
          </div>
        </div>

        {printItems.length === 0 ? (
          <EmptyState icon={<Printer className="h-14 w-14" />} title="No price tags yet" description="Choose products and set copies to generate a preview." />
        ) : (
          <PrintablePriceTagSheet ref={contentRef} items={printItems} />
        )}
      </section>
    </div>
  );
}


