import { Router, type Request } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isAdminUser } from "../auth/users.js";
import {
  createCategoryWithSubcategory,
  createProduct,
  createSubSubcategory,
  deleteCategory,
  deleteProduct,
  deleteSubcategory,
  deleteSubSubcategory,
  getCategoryOptions,
  getProducts,
  updateProduct,
} from "../services/admin/products.js";

export const adminProductsRouter = Router();

async function requireAdminActor(req: Request) {
  const session = readSession(req);
  const user = session ? await findUserById(session.userId) : null;
  return user && isAdminUser(user) ? user : null;
}

function isAllowedProductImageValue(value: string) {
  return (
    !value ||
    value.startsWith("data:image/") ||
    value.startsWith("/api/uploads/products/")
  );
}

adminProductsRouter.get("/products", async (_req, res, next) => {
  try {
    const products = await getProducts();
    res.json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await getCategoryOptions();
    res.json({ ok: true, categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.post("/categories", async (req, res, next) => {
  try {
    const user = await requireAdminActor(req);

    if (!user) {
      res.status(403).json({ ok: false, message: "Only admins can create categories." });
      return;
    }

    const { categoryName, subcategoryName } = req.body as {
      categoryName?: string;
      subcategoryName?: string;
    };

    if (!categoryName?.trim() || !subcategoryName?.trim()) {
      res.status(400).json({ ok: false, message: "Category and subcategory are required." });
      return;
    }

    const categories = await createCategoryWithSubcategory({
      categoryName: categoryName.trim(),
      subcategoryName: subcategoryName.trim(),
    });

    res.status(201).json({ ok: true, categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.post("/subcategories/:subcategoryId/sub-subcategories", async (req, res, next) => {
  const subcategoryId = Number(req.params.subcategoryId);

  if (!Number.isInteger(subcategoryId) || subcategoryId <= 0) {
    res.status(400).json({ ok: false, message: "A valid subcategory id is required." });
    return;
  }

  try {
    const user = await requireAdminActor(req);

    if (!user) {
      res.status(403).json({ ok: false, message: "Only admins can create sub-subcategories." });
      return;
    }

    const { subSubcategoryName } = req.body as {
      subSubcategoryName?: string;
    };

    if (!subSubcategoryName?.trim()) {
      res.status(400).json({ ok: false, message: "Sub-subcategory is required." });
      return;
    }

    const result = await createSubSubcategory({
      subcategoryId,
      subSubcategoryName: subSubcategoryName.trim(),
    });

    if (!result.ok) {
      res.status(404).json({ ok: false, message: "Subcategory not found." });
      return;
    }

    res.status(201).json({ ok: true, categories: result.categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.delete("/categories/:categoryId", async (req, res, next) => {
  const categoryId = Number(req.params.categoryId);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ ok: false, message: "A valid category id is required." });
    return;
  }

  try {
    const user = await requireAdminActor(req);

    if (!user) {
      res.status(403).json({ ok: false, message: "Only admins can delete categories." });
      return;
    }

    const result = await deleteCategory(categoryId);

    if (!result.ok && result.reason === "not_found") {
      res.status(404).json({ ok: false, message: "Category not found." });
      return;
    }

    if (!result.ok && result.reason === "referenced") {
      res.status(409).json({
        ok: false,
        message: "This category cannot be deleted while products are assigned to it.",
      });
      return;
    }

    res.json({ ok: true, categories: result.categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.delete("/subcategories/:subcategoryId", async (req, res, next) => {
  const subcategoryId = Number(req.params.subcategoryId);

  if (!Number.isInteger(subcategoryId) || subcategoryId <= 0) {
    res.status(400).json({ ok: false, message: "A valid subcategory id is required." });
    return;
  }

  try {
    const user = await requireAdminActor(req);

    if (!user) {
      res.status(403).json({ ok: false, message: "Only admins can delete subcategories." });
      return;
    }

    const result = await deleteSubcategory(subcategoryId);

    if (!result.ok && result.reason === "not_found") {
      res.status(404).json({ ok: false, message: "Subcategory not found." });
      return;
    }

    if (!result.ok && result.reason === "referenced") {
      res.status(409).json({
        ok: false,
        message: "This subcategory cannot be deleted while products are assigned to it.",
      });
      return;
    }

    res.json({ ok: true, categories: result.categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.delete("/sub-subcategories/:subSubcategoryId", async (req, res, next) => {
  const subSubcategoryId = Number(req.params.subSubcategoryId);

  if (!Number.isInteger(subSubcategoryId) || subSubcategoryId <= 0) {
    res.status(400).json({ ok: false, message: "A valid sub-subcategory id is required." });
    return;
  }

  try {
    const user = await requireAdminActor(req);

    if (!user) {
      res.status(403).json({ ok: false, message: "Only admins can delete sub-subcategories." });
      return;
    }

    const result = await deleteSubSubcategory(subSubcategoryId);

    if (!result.ok && result.reason === "not_found") {
      res.status(404).json({ ok: false, message: "Sub-subcategory not found." });
      return;
    }

    if (!result.ok && result.reason === "referenced") {
      res.status(409).json({
        ok: false,
        message: "This sub-subcategory cannot be deleted while products are assigned to it.",
      });
      return;
    }

    res.json({ ok: true, categories: result.categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.post("/products", async (req, res, next) => {
  try {
    const { name, category, subcategory, subSubcategory, description, image, price, stock } = req.body as {
      category?: string;
      subcategory?: string;
      subSubcategory?: string;
      description?: string;
      image?: string;
      name?: string;
      price?: number;
      stock?: number;
    };

    if (!name || !category || !subcategory) {
      res.status(400).json({ ok: false, message: "Product name, category, and subcategory are required." });
      return;
    }

    const normalizedImage = typeof image === "string" ? image.trim() : "";
    if (!isAllowedProductImageValue(normalizedImage)) {
      res.status(400).json({ ok: false, message: "Product photo must be an image file." });
      return;
    }

    if (normalizedImage.length > 3_000_000) {
      res.status(400).json({ ok: false, message: "Product photo must be 2 MB or smaller." });
      return;
    }

    const products = await createProduct({
      category,
      subcategory,
      subSubcategory,
      description: description ?? "",
      image: normalizedImage,
      name,
      price,
      stock,
    });
    res.status(201).json({ ok: true, products });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.put("/products/:productId", async (req, res, next) => {
  const productId = Number(req.params.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({ ok: false, message: "A valid product id is required." });
    return;
  }

  try {
    const { name, category, subcategory, subSubcategory, description, image, price, stock } = req.body as {
      category?: string;
      subcategory?: string;
      subSubcategory?: string;
      description?: string;
      image?: string;
      name?: string;
      price?: number;
      stock?: number;
    };

    if (!name || !category || !subcategory) {
      res.status(400).json({ ok: false, message: "Product name, category, and subcategory are required." });
      return;
    }

    const normalizedImage = typeof image === "string" ? image.trim() : "";
    if (!isAllowedProductImageValue(normalizedImage)) {
      res.status(400).json({ ok: false, message: "Product photo must be an image file." });
      return;
    }

    if (normalizedImage.length > 3_000_000) {
      res.status(400).json({ ok: false, message: "Product photo must be 2 MB or smaller." });
      return;
    }

    const result = await updateProduct(productId, {
      category,
      subcategory,
      subSubcategory,
      description: description ?? "",
      image: normalizedImage,
      name,
      price,
      stock,
    });

    if (!result.ok) {
      res.status(404).json({ ok: false, message: "Product not found." });
      return;
    }

    res.json({ ok: true, products: result.products });
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
