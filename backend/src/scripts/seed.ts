import { dbPool } from "../config/database.js";
import { generateAccountId } from "../auth/accountId.js";
import { hashPassword, SEEDED_USER_PASSWORD } from "../auth/password.js";

async function scalarCount(tableName: string) {
  const [rows] = await dbPool.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  const first = (rows as Array<{ count: number }>)[0];
  return Number(first?.count ?? 0);
}

async function seedCategoriesAndSubcategories() {
  const categories = [
    {
      name: "Kitchen",
      description: "Kitchen appliances for cooking and food preparation.",
      subcategories: ["Refrigerators", "Microwaves"],
    },
    {
      name: "Cleaning",
      description: "Cleaning appliances for everyday home care.",
      subcategories: ["Washing Machines", "Vacuum Cleaners"],
    },
    {
      name: "Cooling",
      description: "Cooling and climate control appliances.",
      subcategories: ["Air Conditioners", "Air Coolers"],
    },
    {
      name: "Entertainment",
      description: "Entertainment and media appliances.",
      subcategories: ["Televisions", "Speakers"],
    },
    {
      name: "Home",
      description: "Home comfort and air quality appliances.",
      subcategories: ["Air Purifiers", "Fans"],
    },
  ];

  for (const category of categories) {
    const [categoryResult] = await dbPool.query(
      "INSERT INTO CATEGORY (category_name, category_description) VALUES (?, ?)",
      [category.name, category.description],
    );
    const categoryId = (categoryResult as { insertId: number }).insertId;

    for (const subcategory of category.subcategories) {
      await dbPool.query(
        "INSERT INTO SUBCATEGORY (category_id, subcategory_name, subcategory_description) VALUES (?, ?, ?)",
        [categoryId, subcategory, `${subcategory} under ${category.name}`],
      );
    }
  }
}

async function getSubcategoryIdByName(name: string) {
  const [rows] = await dbPool.query(
    "SELECT subcategory_id FROM SUBCATEGORY WHERE subcategory_name = ? LIMIT 1",
    [name],
  );
  const first = (rows as Array<{ subcategory_id: number }>)[0];
  return first.subcategory_id;
}

async function seedProductsAndInventory() {
  const products = [
    {
      name: "Smart Fridge Master 3000",
      description: "Premium smart refrigerator with inverter cooling and touch controls.",
      subcategory: "Refrigerators",
      price: 72999,
      stock: 45,
      status: "Active",
    },
    {
      name: "HeatWave Microwave Pro",
      description: "Compact microwave oven with multiple cooking presets.",
      subcategory: "Microwaves",
      price: 6499,
      stock: 27,
      status: "Active",
    },
    {
      name: "EcoWash Pro Machine",
      description: "Energy-efficient washing machine built for medium households.",
      subcategory: "Washing Machines",
      price: 32499,
      stock: 12,
      status: "Low Stock",
    },
    {
      name: "DustAway Turbo Vac",
      description: "High-suction vacuum cleaner for quick daily cleaning.",
      subcategory: "Vacuum Cleaners",
      price: 8999,
      stock: 18,
      status: "Active",
    },
    {
      name: "Breeze AC Unit - 1.5HP",
      description: "Split-type inverter air conditioner for bedrooms and offices.",
      subcategory: "Air Conditioners",
      price: 28999,
      stock: 0,
      status: "Out of Stock",
    },
    {
      name: "CoolFlow Air Cooler",
      description: "Portable air cooler with low-noise operation.",
      subcategory: "Air Coolers",
      price: 7399,
      stock: 9,
      status: "Low Stock",
    },
    {
      name: "OLED Evo 65 TV",
      description: "65-inch OLED television with 4K HDR display.",
      subcategory: "Televisions",
      price: 55999,
      stock: 30,
      status: "Active",
    },
    {
      name: "PulseBeat Soundbar X",
      description: "Dolby-ready soundbar with wireless subwoofer.",
      subcategory: "Speakers",
      price: 12499,
      stock: 22,
      status: "Active",
    },
    {
      name: "AirPurify 360",
      description: "Air purifier with HEPA filter for all-day indoor freshness.",
      subcategory: "Air Purifiers",
      price: 10999,
      stock: 33,
      status: "Active",
    },
    {
      name: "WindEase Tower Fan",
      description: "Slim tower fan with remote and timer control.",
      subcategory: "Fans",
      price: 4599,
      stock: 41,
      status: "Active",
    },
  ];

  for (const product of products) {
    const subcategoryId = await getSubcategoryIdByName(product.subcategory);
    const [productResult] = await dbPool.query(
      "INSERT INTO PRODUCT (subcategory_id, product_name, product_description, price, product_image) VALUES (?, ?, ?, ?, ?)",
      [subcategoryId, product.name, product.description, product.price, null],
    );
    const productId = (productResult as { insertId: number }).insertId;

    await dbPool.query(
      "INSERT INTO INVENTORY (product_id, stock_quantity, status, last_updated) VALUES (?, ?, ?, NOW())",
      [productId, product.stock, product.status],
    );
  }
}

async function seedUsersAndOrders() {
  const users = [
    ["John", "", "Doe", "john@example.com", "09170000001", "Active", "customer"],
    ["Jane", "", "Smith", "jane@example.com", "09170000002", "Active", "customer"],
    ["Alice", "", "Johnson", "alice@example.com", "09170000003", "Active", "customer"],
    ["Bob", "", "Brown", "bob@example.com", "09170000004", "Active", "customer"],
    ["Admin", "", "User", "admin@example.com", "09170000000", "Active", "admin"],
  ];

  const createdUserIds: number[] = [];

  for (const user of users) {
    const passwordHash = await hashPassword(SEEDED_USER_PASSWORD);
    const accountId = generateAccountId(user[6]);
    const [result] = await dbPool.query(
      "INSERT INTO `USER` (account_id, fname, mname, lname, email, password, contact_num, status, created_at, last_login, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)",
      [
        accountId,
        user[0],
        user[1],
        user[2],
        user[3],
        passwordHash,
        user[4],
        user[5],
        user[6],
      ],
    );
    const userId = (result as { insertId: number }).insertId;
    createdUserIds.push(userId);

    if (user[6] === "customer") {
      await dbPool.query(
        "INSERT INTO CUSTOMER_USER (user_id, street, barangay, city, province) VALUES (?, ?, ?, ?, ?)",
        [userId, "Sample Street", "Barangay 1", "Legazpi City", "Albay"],
      );
    } else {
      await dbPool.query(
        "INSERT INTO STAFF_USER (user_id, role_type) VALUES (?, ?)",
        [userId, user[6]],
      );
    }
  }

  const payments = [
    [72999, "gcash", "paid"],
    [32499, "gcash", "paid"],
    [12499, "pay_on_pickup", "unpaid"],
    [10999, "gcash", "paid"],
  ];

  const paymentIds: number[] = [];

  for (const payment of payments) {
    const [result] = await dbPool.query(
      "INSERT INTO PAYMENT_DETAILS (payment_amount, payment_method, payment_date, payment_status) VALUES (?, ?, NOW(), ?)",
      payment,
    );
    paymentIds.push((result as { insertId: number }).insertId);
  }

  const orders = [
    {
      row: [createdUserIds[0], null, paymentIds[0], "2026-04-01 09:00:00", 72999, "processing", "delivery"],
      itemName: "Smart Fridge Master 3000",
      quantity: 1,
      price: 72999,
    },
    {
      row: [createdUserIds[1], null, paymentIds[1], "2026-04-03 11:15:00", 32499, "shipped", "delivery"],
      itemName: "EcoWash Pro Machine",
      quantity: 1,
      price: 32499,
    },
    {
      row: [createdUserIds[2], null, paymentIds[2], "2026-04-04 14:20:00", 12499, "ready_for_pickup", "pickup"],
      itemName: "PulseBeat Soundbar X",
      quantity: 1,
      price: 12499,
    },
    {
      row: [createdUserIds[3], null, paymentIds[3], "2026-04-06 16:40:00", 10999, "pending", "delivery"],
      itemName: "AirPurify 360",
      quantity: 1,
      price: 10999,
    },
  ];

  for (const order of orders) {
    const [orderResult] = await dbPool.query(
      "INSERT INTO orders (user_id, promo_id, payment_id, order_date, total_amount, order_status, delivery_method) VALUES (?, ?, ?, ?, ?, ?, ?)",
      order.row,
    );
    const orderId = (orderResult as { insertId: number }).insertId;
    const userId = Number(order.row[0]);
    const orderDate = String(order.row[3]);
    const status = String(order.row[5]);
    const method = String(order.row[6]);
    const [productRows] = await dbPool.query(
      "SELECT product_id FROM PRODUCT WHERE product_name = ? LIMIT 1",
      [order.itemName],
    );
    const productId = (productRows as Array<{ product_id: number }>)[0]?.product_id;

    if (!productId) {
      throw new Error(`Seed product not found: ${order.itemName}`);
    }

    await dbPool.query(
      "INSERT INTO order_item (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [orderId, productId, order.quantity, order.price],
    );

    if (method === "delivery") {
      await dbPool.query(
        `INSERT INTO DELIVERY
          (order_id, user_id, delivery_fee, estimated_date, delivery_status, delivery_address, latitude, longitude)
         VALUES (?, ?, ?, DATE_ADD(DATE(?), INTERVAL 4 DAY), ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          50,
          orderDate,
          status,
          "Sample Street, Barangay 1, Legazpi City, Albay",
          13.1391,
          123.7438,
        ],
      );
    } else {
      await dbPool.query(
        "INSERT INTO PICKUP (order_id, user_id, pickup_date, pickup_status) VALUES (?, ?, DATE_ADD(?, INTERVAL 1 DAY), ?)",
        [orderId, userId, orderDate, status],
      );
    }
  }
}

async function main() {
  const productCount = await scalarCount("PRODUCT");
  const orderCount = await scalarCount("orders");

  if (productCount > 0 || orderCount > 0) {
    console.log("Seed skipped: database already contains products or orders.");
    await dbPool.end();
    return;
  }

  await seedCategoriesAndSubcategories();
  await seedProductsAndInventory();
  await seedUsersAndOrders();

  console.log("Seed completed successfully.");
  await dbPool.end();
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await dbPool.end();
  process.exit(1);
});
