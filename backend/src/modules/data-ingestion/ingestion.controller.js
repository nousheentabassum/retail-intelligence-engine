import { ingestSalesBatch } from "./ingestion.service.js";

export async function ingestSales(req, res, next) {
  try {
    const { rows } = req.body;
    const result = await ingestSalesBatch(rows);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

