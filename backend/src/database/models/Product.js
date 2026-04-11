export class Product {
  constructor({ id, sku, name, leadTimeDays = 7 }) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.leadTimeDays = leadTimeDays;
  }
}

