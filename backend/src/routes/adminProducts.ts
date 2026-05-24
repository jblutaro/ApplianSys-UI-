import { Router, type Request } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isAdminUser } from "../auth/users.js";
import { logAuditEvent } from "../services/audit/auditLog.js";
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
  const session = await readSession(req);
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

function parseProductPayload(body: Record<string, unknown> | null | undefined) {
  const source = body ?? {};
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const category = typeof source.category === "string" ? source.category.trim() : "";
  const subcategory = typeof source.subcategory === "string" ? source.subcategory.trim() : "";
  const subSubcategory = typeof source.subSubcategory === "string" ? source.subSubcategory.trim() : "";
  const description = typeof source.description === "string" ? source.description.trim() : "";
  const image = typeof source.image === "string" ? source.image.trim() : "";
  const price = Number(source.price);
  const stock = Number(source.stock);

  if (!name || !category || !subcategory) {
    return { ok: false as const, message: "Product name, category, and subcategory are required." };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false as const, message: "Product price must be greater than zero." };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false as const, message: "Product stock must be a non-negative integer." };
  }

  if (!isAllowedProductImageValue(image)) {
    return { ok: false as const, message: "Product photo must be an image file." };
  }

  if (image.length > 3_000_000) {
    return { ok: false as const, message: "Product photo must be 2 MB or smaller." };
  }

  return {
    ok: true as const,
    product: {
      category,
      subcategory,
      subSubcategory,
      description,
      image,
      name,
      price,
      stock,
    },
  };
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
    await logAuditEvent({
      action: "admin.category.create",
      details: { categoryName: categoryName.trim(), subcategoryName: subcategoryName.trim() },
      entityType: "category",
      req,
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

    await logAuditEvent({
      action: "admin.sub_subcategory.create",
      details: { subSubcategoryName: subSubcategoryName.trim(), subcategoryId },
      entityId: subcategoryId,
      entityType: "subcategory",
      req,
    });
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

    await logAuditEvent({
      action: "admin.category.delete",
      entityId: categoryId,
      entityType: "category",
      req,
    });
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

    await logAuditEvent({
      action: "admin.subcategory.delete",
      entityId: subcategoryId,
      entityType: "subcategory",
      req,
    });
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

    await logAuditEvent({
      action: "admin.sub_subcategory.delete",
      entityId: subSubcategoryId,
      entityType: "sub_subcategory",
      req,
    });
    res.json({ ok: true, categories: result.categories });
  } catch (error) {
    next(error);
  }
});

adminProductsRouter.post("/products", async (req, res, next) => {
  try {
    const payload = parseProductPayload(req.body as Record<string, unknown>);
    if (!payload.ok) {
      res.status(400).json({ ok: false, message: payload.message });
      return;
    }

    const products = await createProduct(payload.product);
    await logAuditEvent({
      action: "admin.product.create",
      details: {
        category: payload.product.category,
        name: payload.product.name,
        price: payload.product.price,
        stock: payload.product.stock,
      },
      entityType: "product",
      req,
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
    const payload = parseProductPayload(req.body as Record<string, unknown>);
    if (!payload.ok) {
      res.status(400).json({ ok: false, message: payload.message });
      return;
    }

    const result = await updateProduct(productId, payload.product);

    if (!result.ok) {
      res.status(404).json({ ok: false, message: "Product not found." });
      return;
    }

    await logAuditEvent({
      action: "admin.product.update",
      details: {
        category: payload.product.category,
        name: payload.product.name,
        price: payload.product.price,
        stock: payload.product.stock,
      },
      entityId: productId,
      entityType: "product",
      req,
    });
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

    await logAuditEvent({
      action: "admin.product.delete",
      entityId: productId,
      entityType: "product",
      req,
    });
    res.json({ ok: true, products: result.products });
  } catch (error) {
    next(error);
  }
});
