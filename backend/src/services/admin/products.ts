import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPool } from "../../config/database.js";
import type { AdminCategoryOption, AdminProduct } from "./types.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const productUploadDir = path.join(backendRoot, "uploads", "products");
const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_DIMENSION = 4096;

function normalizeProductStatus(stock: number) {
  if (stock <= 0) return "Out of Stock";
  if (stock < 15) return "Low Stock";
  return "Active";
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readImageDimensions(extension: string, buffer: Buffer) {
  if (extension === "png" && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (extension === "gif" && buffer.length >= 10) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (extension === "webp" && buffer.length >= 30) {
    if (buffer.subarray(12, 16).toString("ascii") === "VP8X") {
      return {
        width: buffer.readUIntLE(24, 3) + 1,
        height: buffer.readUIntLE(27, 3) + 1,
      };
    }
  }

  if (extension === "jpg") {
    return readJpegDimensions(buffer);
  }

  return null;
}

function assertSafeImageDimensions(extension: string, buffer: Buffer) {
  const dimensions = readImageDimensions(extension, buffer);

  if (!dimensions) {
    throw new Error("Product photo dimensions could not be verified.");
  }

  if (
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    dimensions.width > MAX_PRODUCT_IMAGE_DIMENSION ||
    dimensions.height > MAX_PRODUCT_IMAGE_DIMENSION
  ) {
    throw new Error(`Product photo dimensions must be ${MAX_PRODUCT_IMAGE_DIMENSION}px or smaller.`);
  }
}

let productImageColumnsReady = false;

async function ensureProductImageColumns() {
  if (productImageColumnsReady) return;

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'PRODUCT'
        AND COLUMN_NAME IN ('image_url', 'product_image')
    `,
  );
  const columnNames = new Set(rows.map((row) => String(row.COLUMN_NAME)));

  if (!columnNames.has("image_url")) {
    await dbPool.query("ALTER TABLE PRODUCT ADD COLUMN image_url VARCHAR(500) NULL");
  }

  if (!columnNames.has("product_image")) {
    await dbPool.query("ALTER TABLE PRODUCT ADD COLUMN product_image LONGTEXT NULL");
  }

  productImageColumnsReady = true;
}

async function saveProductImage(input: string | undefined) {
  const trimmed = input?.trim() ?? "";
  if (!trimmed) return null;

  if (trimmed.startsWith("/api/uploads/products/")) {
    return trimmed;
  }

  const match = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const imageBuffer = Buffer.from(match[2], "base64");

  if (imageBuffer.length > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Product photo must be 2 MB or smaller.");
  }

  const signatures: Record<string, (buffer: Buffer) => boolean> = {
    gif: (buffer) => buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a",
    jpg: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9,
    png: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    webp: (buffer) => buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP",
  };

  if (!signatures[extension]?.(imageBuffer)) {
    throw new Error("Product photo content does not match the declared image type.");
  }
  assertSafeImageDimensions(extension, imageBuffer);

  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  await mkdir(productUploadDir, { recursive: true });
  await writeFile(path.join(productUploadDir, filename), imageBuffer);
  return `/api/uploads/products/${filename}`;
}

async function ensureCategoryAndSubcategory(categoryName: string, subcategoryName: string) {
  const normalizedCategoryName = categoryName.trim();
  const normalizedSubcategoryName = subcategoryName.trim();

  if (!normalizedCategoryName || !normalizedSubcategoryName) {
    throw new Error("Category and subcategory are required.");
  }

  const category = await dbPool.query<RowDataPacket[]>(
    "SELECT category_id FROM CATEGORY WHERE category_name = ? LIMIT 1",
    [normalizedCategoryName],
  );

  let categoryId = category[0][0]?.category_id as number | undefined;

  if (!categoryId) {
    const insertCategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO CATEGORY (category_name, category_description) VALUES (?, ?)",
      [normalizedCategoryName, null],
    );
    categoryId = insertCategory[0].insertId;
  }

  const subcategory = await dbPool.query<RowDataPacket[]>(
    "SELECT subcategory_id FROM SUBCATEGORY WHERE category_id = ? AND subcategory_name = ? LIMIT 1",
    [categoryId, normalizedSubcategoryName],
  );

  let subcategoryId = subcategory[0][0]?.subcategory_id as number | undefined;

  if (!subcategoryId) {
    const insertSubcategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO SUBCATEGORY (category_id, subcategory_name, subcategory_description) VALUES (?, ?, ?)",
      [categoryId, normalizedSubcategoryName, null],
    );
    subcategoryId = insertSubcategory[0].insertId;
  }

  return subcategoryId;
}

async function ensureSubSubcategory(subcategoryId: number, subSubcategoryName: string) {
  const trimmed = subSubcategoryName.trim();
  if (!trimmed) return null;

  const [rows] = await dbPool.query<RowDataPacket[]>(
    "SELECT sub_subcategory_id FROM SUB_SUBCATEGORY WHERE subcategory_id = ? AND sub_subcategory_name = ? LIMIT 1",
    [subcategoryId, trimmed],
  );

  const existingId = rows[0]?.sub_subcategory_id as number | undefined;
  if (existingId) return existingId;

  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO SUB_SUBCATEGORY (subcategory_id, sub_subcategory_name, sub_subcategory_description) VALUES (?, ?, ?)",
    [subcategoryId, trimmed, null],
  );

  return result.insertId;
}

export async function getCategoryOptions(): Promise<AdminCategoryOption[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      c.category_id,
      c.category_name,
      s.subcategory_id,
      s.subcategory_name,
      ss.sub_subcategory_id,
      ss.sub_subcategory_name
    FROM CATEGORY c
    LEFT JOIN SUBCATEGORY s ON s.category_id = c.category_id
    LEFT JOIN SUB_SUBCATEGORY ss ON ss.subcategory_id = s.subcategory_id
    ORDER BY c.category_name ASC, s.subcategory_name ASC, ss.sub_subcategory_name ASC
  `);

  const categoryMap = new Map<number, AdminCategoryOption>();

  for (const row of rows) {
    const categoryId = Number(row.category_id);
    const existing = categoryMap.get(categoryId);
    const category =
      existing ??
      {
        id: categoryId,
        name: String(row.category_name),
        subcategories: [],
      };

    if (!existing) {
      categoryMap.set(categoryId, category);
    }

    if (row.subcategory_id) {
      const subcategoryId = Number(row.subcategory_id);
      let subcategory = category.subcategories.find((item) => item.id === subcategoryId);

      if (!subcategory) {
        subcategory = {
          id: subcategoryId,
          name: String(row.subcategory_name),
          subSubcategories: [],
        };
        category.subcategories.push(subcategory);
      }

      if (row.sub_subcategory_id) {
        subcategory.subSubcategories.push({
          id: Number(row.sub_subcategory_id),
          name: String(row.sub_subcategory_name),
        });
      }
    }
  }

  return Array.from(categoryMap.values());
}

export async function createCategoryWithSubcategory(input: {
  categoryName: string;
  subcategoryName: string;
}) {
  await ensureCategoryAndSubcategory(input.categoryName, input.subcategoryName);
  return getCategoryOptions();
}

export async function createSubSubcategory(input: {
  subcategoryId: number;
  subSubcategoryName: string;
}) {
  const [subcategoryRows] = await dbPool.query<RowDataPacket[]>(
    "SELECT subcategory_id FROM SUBCATEGORY WHERE subcategory_id = ? LIMIT 1",
    [input.subcategoryId],
  );

  if (!subcategoryRows[0]) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await ensureSubSubcategory(input.subcategoryId, input.subSubcategoryName);
  return {
    ok: true as const,
    categories: await getCategoryOptions(),
  };
}

export async function deleteSubSubcategory(subSubcategoryId: number) {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [subSubcategoryRows] = await connection.query<RowDataPacket[]>(
      "SELECT sub_subcategory_id FROM SUB_SUBCATEGORY WHERE sub_subcategory_id = ? LIMIT 1",
      [subSubcategoryId],
    );

    if (!subSubcategoryRows[0]) {
      await connection.rollback();
      return { ok: false as const, reason: "not_found" as const };
    }

    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM PRODUCT WHERE sub_subcategory_id = ?",
      [subSubcategoryId],
    );

    if (Number(productRows[0]?.count ?? 0) > 0) {
      await connection.rollback();
      return { ok: false as const, reason: "referenced" as const };
    }

    await connection.query("DELETE FROM SUB_SUBCATEGORY WHERE sub_subcategory_id = ?", [
      subSubcategoryId,
    ]);
    await connection.commit();

    return {
      ok: true as const,
      categories: await getCategoryOptions(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteSubcategory(subcategoryId: number) {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [subcategoryRows] = await connection.query<RowDataPacket[]>(
      "SELECT subcategory_id FROM SUBCATEGORY WHERE subcategory_id = ? LIMIT 1",
      [subcategoryId],
    );

    if (!subcategoryRows[0]) {
      await connection.rollback();
      return { ok: false as const, reason: "not_found" as const };
    }

    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM PRODUCT WHERE subcategory_id = ?",
      [subcategoryId],
    );

    if (Number(productRows[0]?.count ?? 0) > 0) {
      await connection.rollback();
      return { ok: false as const, reason: "referenced" as const };
    }

    await connection.query("DELETE FROM SUB_SUBCATEGORY WHERE subcategory_id = ?", [subcategoryId]);
    await connection.query("DELETE FROM SUBCATEGORY WHERE subcategory_id = ?", [subcategoryId]);
    await connection.commit();

    return {
      ok: true as const,
      categories: await getCategoryOptions(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteCategory(categoryId: number) {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [categoryRows] = await connection.query<RowDataPacket[]>(
      "SELECT category_id FROM CATEGORY WHERE category_id = ? LIMIT 1",
      [categoryId],
    );

    if (!categoryRows[0]) {
      await connection.rollback();
      return { ok: false as const, reason: "not_found" as const };
    }

    const [productRows] = await connection.query<RowDataPacket[]>(
      `
        SELECT COUNT(*) AS count
        FROM PRODUCT p
        INNER JOIN SUBCATEGORY s ON s.subcategory_id = p.subcategory_id
        WHERE s.category_id = ?
      `,
      [categoryId],
    );

    if (Number(productRows[0]?.count ?? 0) > 0) {
      await connection.rollback();
      return { ok: false as const, reason: "referenced" as const };
    }

    await connection.query(
      `
        DELETE ssc
        FROM SUB_SUBCATEGORY ssc
        INNER JOIN SUBCATEGORY s ON s.subcategory_id = ssc.subcategory_id
        WHERE s.category_id = ?
      `,
      [categoryId],
    );
    await connection.query("DELETE FROM SUBCATEGORY WHERE category_id = ?", [categoryId]);
    await connection.query("DELETE FROM CATEGORY WHERE category_id = ?", [categoryId]);
    await connection.commit();

    return {
      ok: true as const,
      categories: await getCategoryOptions(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProducts(): Promise<AdminProduct[]> {
  await ensureProductImageColumns();

  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      p.product_id,
      p.product_name,
      p.product_description,
      p.image_url,
      p.product_image,
      c.category_name,
      s.subcategory_name,
      ss.sub_subcategory_name,
      p.price,
      COALESCE(i.stock_quantity, 0) AS stock_quantity
    FROM PRODUCT p
    INNER JOIN SUBCATEGORY s ON s.subcategory_id = p.subcategory_id
    INNER JOIN CATEGORY c ON c.category_id = s.category_id
    LEFT JOIN SUB_SUBCATEGORY ss
      ON ss.subcategory_id = p.subcategory_id
      AND ss.sub_subcategory_id = p.sub_subcategory_id
    LEFT JOIN INVENTORY i ON i.product_id = p.product_id
    ORDER BY p.product_id DESC
  `);

  return rows.map((row) => {
    const stock = Number(row.stock_quantity ?? 0);

    return {
      id: `PRD-${String(row.product_id).padStart(3, "0")}`,
      dbId: Number(row.product_id),
      name: String(row.product_name),
      category: String(row.category_name),
      subcategory: String(row.subcategory_name),
      subSubcategory: String(row.sub_subcategory_name ?? ""),
      description: String(row.product_description ?? ""),
      image: String(row.image_url ?? row.product_image ?? ""),
      price: Number(row.price),
      stock,
      status: normalizeProductStatus(stock),
    };
  });
}

export async function createProduct(input: {
  category: string;
  subcategory: string;
  subSubcategory?: string;
  description?: string;
  image?: string;
  name: string;
  price?: number;
  stock?: number;
}) {
  await ensureProductImageColumns();

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const price = Number(input.price);
  const stock = Number(input.stock);

  if (!name) {
    throw new Error("Product name is required.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Product price must be greater than zero.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Product stock must be a non-negative integer.");
  }

  const subcategoryId = await ensureCategoryAndSubcategory(input.category, input.subcategory);
  const subSubcategoryId = input.subSubcategory?.trim()
    ? await ensureSubSubcategory(subcategoryId, input.subSubcategory)
    : null;
  const imageUrl = await saveProductImage(input.image);
  const [productResult] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO PRODUCT (subcategory_id, sub_subcategory_id, product_name, product_description, image_url, price, product_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      subcategoryId,
      subSubcategoryId,
      name,
      description,
      imageUrl,
      price,
      null,
    ],
  );

  await dbPool.query<ResultSetHeader>(
    "INSERT INTO INVENTORY (product_id, stock_quantity, status, last_updated) VALUES (?, ?, ?, NOW())",
    [
      productResult.insertId,
      stock,
      normalizeProductStatus(stock),
    ],
  );

  return getProducts();
}

export async function updateProduct(
  productId: number,
  input: {
    category: string;
    subcategory: string;
    subSubcategory?: string;
    description?: string;
    image?: string;
    name: string;
    price?: number;
    stock?: number;
  },
) {
  await ensureProductImageColumns();

  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const price = Number(input.price);
  const stock = Number(input.stock);

  if (!name) {
    throw new Error("Product name is required.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Product price must be greater than zero.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Product stock must be a non-negative integer.");
  }

  const subcategoryId = await ensureCategoryAndSubcategory(input.category, input.subcategory);
  const subSubcategoryId = input.subSubcategory?.trim()
    ? await ensureSubSubcategory(subcategoryId, input.subSubcategory)
    : null;
  const imageUrl = await saveProductImage(input.image);
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT product_id FROM PRODUCT WHERE product_id = ? LIMIT 1",
      [productId],
    );

    if (!productRows[0]) {
      await connection.rollback();
      return { ok: false as const, reason: "not_found" as const };
    }

    await connection.query(
      `
        UPDATE PRODUCT
        SET subcategory_id = ?,
            sub_subcategory_id = ?,
            product_name = ?,
            product_description = ?,
            image_url = ?,
            price = ?,
            product_image = NULL
        WHERE product_id = ?
      `,
      [
        subcategoryId,
        subSubcategoryId,
        name,
        description,
        imageUrl,
        price,
        productId,
      ],
    );

    const [inventoryResult] = await connection.query<ResultSetHeader>(
      `
        UPDATE INVENTORY
        SET stock_quantity = ?,
            status = ?,
            last_updated = NOW()
        WHERE product_id = ?
      `,
      [stock, normalizeProductStatus(stock), productId],
    );

    if (inventoryResult.affectedRows === 0) {
      await connection.query(
        "INSERT INTO INVENTORY (product_id, stock_quantity, status, last_updated) VALUES (?, ?, ?, NOW())",
        [productId, stock, normalizeProductStatus(stock)],
      );
    }

    await connection.commit();

    return {
      ok: true as const,
      products: await getProducts(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteProduct(productId: number) {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query<RowDataPacket[]>(
      "SELECT product_id FROM PRODUCT WHERE product_id = ? LIMIT 1",
      [productId],
    );

    if (!productRows[0]) {
      await connection.rollback();
      return { ok: false as const, reason: "not_found" as const };
    }

    const [orderItemRows] = await connection.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM order_item WHERE product_id = ?",
      [productId],
    );

    const orderItemCount = Number(orderItemRows[0]?.count ?? 0);

    if (orderItemCount > 0) {
      await connection.rollback();
      return { ok: false as const, reason: "referenced" as const };
    }

    await connection.query("DELETE FROM CART_ITEM WHERE product_id = ?", [productId]);
    await connection.query("DELETE FROM INVENTORY WHERE product_id = ?", [productId]);
    await connection.query("DELETE FROM PRODUCT WHERE product_id = ?", [productId]);

    await connection.commit();

    return {
      ok: true as const,
      products: await getProducts(),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
