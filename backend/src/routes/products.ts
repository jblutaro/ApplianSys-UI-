import { Router } from "express";
import { getCategoryOptions, getProducts } from "../services/admin/products.js";

export const productsRouter = Router();

productsRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await getProducts();
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await getCategoryOptions();
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ ok: true, categories });
  } catch (error) {
    next(error);
  }
});
