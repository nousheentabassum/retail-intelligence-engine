import * as inventoryService from "./inventory.service.js";

export async function createProduct(req, res, next) {
  try {
    const product = await inventoryService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function getProducts(req, res, next) {
  try {
    const { limit, offset, category } = req.query;
    const products = await inventoryService.getAllProducts({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      category
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await inventoryService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await inventoryService.updateProduct(productId, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await inventoryService.deleteProduct(productId);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getInventory(req, res, next) {
  try {
    const { productId } = req.params;
    const view = await inventoryService.buildInventoryView(productId);
    res.json(view);
  } catch (err) {
    next(err);
  }
}

export async function getStockLevels(req, res, next) {
  try {
    const { productId } = req.params;
    const stock = await inventoryService.getStockLevels(productId);
    res.json(stock);
  } catch (err) {
    next(err);
  }
}

export async function adjustStock(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity, transactionType, referenceId, notes } = req.body;
    
    if (!quantity || !transactionType) {
      return res.status(400).json({ 
        error: 'quantity and transactionType are required' 
      });
    }
    
    const newStock = await inventoryService.adjustStock(
      productId, 
      Number(quantity), 
      transactionType, 
      referenceId, 
      notes
    );
    
    res.json({ newStock, message: 'Stock adjusted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getLowStockAlerts(req, res, next) {
  try {
    const alerts = await inventoryService.getLowStockAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function getInventoryHistory(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit, offset } = req.query;
    
    const history = await inventoryService.getInventoryHistory(productId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    
    res.json(history);
  } catch (err) {
    next(err);
  }
}

