import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import type { AdminProduct } from "./types.js";

function normalizeProductStatus(stock: number) {
  if (stock <= 0) return "Out of Stock";
  if (stock < 15) return "Low Stock";
  return "Active";
}

async function ensureCategoryAndSubcategory(categoryName: string) {
  const category = await dbPool.query<RowDataPacket[]>(
    "SELECT category_id FROM CATEGORY WHERE category_name = ? LIMIT 1",
    [categoryName],
  );

  let categoryId = category[0][0]?.category_id as number | undefined;

  if (!categoryId) {
    const insertCategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO CATEGORY (category_name, category_description) VALUES (?, ?)",
      [categoryName, `${categoryName} appliances`],
    );
    categoryId = insertCategory[0].insertId;
  }

  const subcategory = await dbPool.query<RowDataPacket[]>(
    "SELECT subcategory_id FROM SUBCATEGORY WHERE category_id = ? AND subcategory_name = ? LIMIT 1",
    [categoryId, categoryName],
  );

  let subcategoryId = subcategory[0][0]?.subcategory_id as number | undefined;

  if (!subcategoryId) {
    const insertSubcategory = await dbPool.query<ResultSetHeader>(
      "INSERT INTO SUBCATEGORY (category_id, subcategory_name, subcategory_description) VALUES (?, ?, ?)",
      [categoryId, categoryName, `${categoryName} subcategory`],
    );
    subcategoryId = insertSubcategory[0].insertId;
  }

  return subcategoryId;
}

export async function getProducts(): Promise<AdminProduct[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(`
    SELECT
      p.product_id,
      p.product_name,
      c.category_name,
      p.price,
      COALESCE(i.stock_quantity, 0) AS stock_quantity
    FROM PRODUCT p
    INNER JOIN SUBCATEGORY s ON s.subcategory_id = p.subcategory_id
    INNER JOIN CATEGORY c ON c.category_id = s.category_id
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
      price: Number(row.price),
      stock,
      status: normalizeProductStatus(stock),
    };
  });
}

export async function createProduct(input: {
  category: string;
  name: string;
  price?: number;
  stock?: number;
}) {
  const subcategoryId = await ensureCategoryAndSubcategory(input.category);
  const [productResult] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO PRODUCT (subcategory_id, product_name, product_description, price, product_image) VALUES (?, ?, ?, ?, ?)",
    [subcategoryId, input.name, "", Number(input.price ?? 0), ""],
  );

  await dbPool.query<ResultSetHeader>(
    "INSERT INTO INVENTORY (product_id, stock_quantity, status, last_updated) VALUES (?, ?, ?, NOW())",
    [
      productResult.insertId,
      Number(input.stock ?? 0),
      normalizeProductStatus(Number(input.stock ?? 0)),
    ],
  );

  return getProducts();
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
      "SELECT COUNT(*) AS count FROM ORDER_ITEM WHERE product_id = ?",
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
