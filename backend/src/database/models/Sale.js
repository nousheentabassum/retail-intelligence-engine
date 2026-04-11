export class Sale {
  constructor({ id, productId, quantity, price, soldAt }) {
    this.id = id;
    this.productId = productId;
    this.quantity = quantity;
    this.price = price;
    this.soldAt = soldAt;
  }
}

