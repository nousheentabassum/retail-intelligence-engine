import { Router } from "express";
import { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct,
  getInventory,
  getStockLevels,
  adjustStock,
  getLowStockAlerts,
  getInventoryHistory
} from "./inventory.controller.js";
import { authMiddleware, requireRole } from "../auth/auth.middleware.js";

export const inventoryRouter = Router();

// Protected routes
inventoryRouter.use(authMiddleware);

// Product management (specific routes first)
inventoryRouter.post("/products", requireRole(['admin', 'manager']), createProduct);
inventoryRouter.get("/products", getProducts);
inventoryRouter.get("/products/:productId", getProduct);
inventoryRouter.put("/products/:productId", requireRole(['admin', 'manager']), updateProduct);
inventoryRouter.delete("/products/:productId", requireRole(['admin']), deleteProduct);

// Stock management (specific routes first)
inventoryRouter.get("/stock/:productId", getStockLevels);
inventoryRouter.post("/stock/:productId/adjust", requireRole(['admin', 'manager']), adjustStock);
inventoryRouter.get("/alerts/low-stock", getLowStockAlerts);
inventoryRouter.get("/history/:productId", getInventoryHistory);

// Public routes (for demo purposes) - must be last
inventoryRouter.get("/:productId", getInventory);

