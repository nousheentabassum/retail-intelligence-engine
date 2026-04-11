export class PurchaseOrder {
  constructor({ id, supplierId, productId, quantity, status = "draft" }) {
    this.id = id;
    this.supplierId = supplierId;
    this.productId = productId;
    this.quantity = quantity;
    this.status = status;
  }
}

