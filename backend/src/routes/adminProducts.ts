import { Router } from "express";
import { createProduct, deleteProduct, getProducts } from "../services/admin/products.js";

export const adminProductsRouter = Router();

adminProductsRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await getProducts();
    res.json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.post("/products", async (req, res, next) => {
  try {
    const { name, category, price, stock } = req.body as {
      category?: string;
      name?: string;
      price?: number;
      stock?: number;
    };

    if (!name || !category) {
      res.status(400).json({ ok: false, message: "Product name and category are required." });
      return;
    }

    const products = await createProduct({ category, name, price, stock });
    res.status(201).json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.delete("/products/:productId", async (req, res, next) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ ok: false, message: "A valid product id is required." });
    return;
  }

  try {
    const result = await deleteProduct(productId);

    if (!result.ok && result.reason === "not_found") {
      res.status(404).json({ ok: false, message: "Product not found." });
      return;
    }

    if (!result.ok && result.reason === "referenced") {
      res.status(409).json({
        ok: false,
        message: "This product cannot be deleted because it is referenced by existing orders.",
      });
      return;
    }

    res.json({ ok: true, products: result.products });
  } catch (error) {
    next(error);
  }
});
