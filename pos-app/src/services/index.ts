// Switch between mock and real API via env variable
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

async function loadServices() {
  if (USE_MOCK) {
    const [auth, product, order, customer, inventory, report] = await Promise.all([
      import("./mock/authService"),
      import("./mock/productService"),
      import("./mock/orderService"),
      import("./mock/customerService"),
      import("./mock/inventoryService"),
      import("./mock/reportService"),
    ]);
    return {
      authService:      auth.authService,
      productService:   product.productService,
      orderService:     order.orderService,
      customerService:  customer.customerService,
      inventoryService: inventory.inventoryService,
      reportService:    report.reportService,
      settingsService:  null as any, // mock: uses local Zustand only
    };
  }
  // Real API services
  const [auth, product, order, customer, inventory, report, settings] = await Promise.all([
    import("./api/authService"),
    import("./api/productService"),
    import("./api/orderService"),
    import("./api/customerService"),
    import("./api/inventoryService"),
    import("./api/reportService"),
    import("./api/settingsService"),
  ]);
  return {
    authService:      auth.authService,
    productService:   product.productService,
    orderService:     order.orderService,
    customerService:  customer.customerService,
    inventoryService: inventory.inventoryService,
    reportService:    report.reportService,
    settingsService:  settings.settingsService,
  };
}

// Singleton promise so services load once
let servicesPromise: ReturnType<typeof loadServices> | null = null;
export const getServices = () => {
  if (!servicesPromise) servicesPromise = loadServices();
  return servicesPromise;
};
