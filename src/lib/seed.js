import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

const schemaPath = path.resolve(process.cwd(), 'src/lib/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('Running schema...');
db.exec(schema);

console.log('Seeding data...');

// 1. Roles & Users
db.prepare("INSERT INTO roles (id, name, description) VALUES (1, 'director', 'Директор (Admin)'), (2, 'sales', 'Менеджер продаж'), (3, 'production', 'Начальник производства'), (4, 'accounting', 'Бухгалтер')").run();

const salt = bcrypt.genSaltSync(10);
const password_hash = bcrypt.hashSync('123456', salt);

const insertUser = db.prepare("INSERT INTO users (role_id, full_name, login, password_hash) VALUES (?, ?, ?, ?)");
insertUser.run(1, 'Евгений Гальченко', 'admin', password_hash);
insertUser.run(1, 'Евгений Гальченко (Директор)', 'director', password_hash); // keeping director for backwards compatibility with my prev msg
insertUser.run(2, 'Менеджер Один', 'manager1', password_hash);
insertUser.run(2, 'Менеджер Два', 'manager2', password_hash);
insertUser.run(3, 'Начальник Производства', 'prod', password_hash);
insertUser.run(4, 'Главный Бухгалтер', 'acc', password_hash);

// 2. Clients
const insertClient = db.prepare("INSERT INTO clients (name, contact_info, assigned_manager_id) VALUES (?, ?, ?)");
const clients = [
    { name: 'ТОО "Мерусар и К"', contact_info: 'БИН: 123456789012, г. Павлодар, ул. Торговая 5', manager: 3 },
    { name: 'ТОО "Атриум ПКО"', contact_info: 'БИН: 098765432109, г. Павлодар, ул. Ленина 10', manager: 4 },
    { name: 'Сеть кофеен "Brew"', contact_info: 'ИП Искаков, г. Астана, пр. Мангилик Ел 15', manager: 3 },
    { name: 'ИП "Дәмді Нан"', contact_info: 'Пекарня, г. Караганда, ул. Строителей 2', manager: 4 },
    { name: 'ТОО "КазТрейд Маркет"', contact_info: 'Супермаркет, г. Алматы, пр. Абая 50', manager: 3 },
    { name: 'ТОО "Magnum Cash&Carry"', contact_info: 'БИН: 112233445566, г. Алматы, мкр. Аксай 1', manager: 3 },
    { name: 'Сеть супермаркетов "Small"', contact_info: 'БИН: 998877665544, г. Астана, ул. Достык 18', manager: 4 },
    { name: 'ИП "Айсулу"', contact_info: 'Магазин одежды, г. Шымкент, пр. Тауке хана 11', manager: 3 },
    { name: 'АО "Келет"', contact_info: 'БИН: 554433221100, г. Алматы, ул. Рыскулова 22', manager: 4 },
    { name: 'ТОО "Павлодар-Опт"', contact_info: 'БИН: 776655443322, г. Павлодар, ул. Камзина 55', manager: 4 }
];
for (const client of clients) {
    insertClient.run(client.name, client.contact_info, client.manager);
}

// 3. Products
db.prepare("INSERT INTO products_catalog (name, type, weight_formula) VALUES ('Пакет Майка (ПНД)', 'П/М', 'dynamic'), ('Рукав (ПВД)', 'Рукав', 'manual'), ('Полурукав (ПВД)', 'Полурукав', 'manual')").run();

// 4. Raw Materials
db.prepare("INSERT INTO raw_materials (id, name, type, critical_limit) VALUES (1, 'ПНД', 'ПНД', 500), (2, 'ПВД', 'ПВД', 300)").run();

// 5. Inventory Transactions (Income history)
const insertInv = db.prepare("INSERT INTO inventory_transactions (raw_material_id, transaction_type, weight, created_at, created_by) VALUES (?, ?, ?, ?, ?)");
insertInv.run(1, 'INCOME', 1000, '2025-01-10 10:00:00', 1);
insertInv.run(2, 'INCOME', 500, '2025-01-10 10:00:00', 1);
insertInv.run(1, 'INCOME', 2000, '2025-05-15 10:00:00', 1);
insertInv.run(2, 'INCOME', 1000, '2025-05-15 10:00:00', 1);
insertInv.run(1, 'INCOME', 3000, '2025-08-10 10:00:00', 1);
insertInv.run(1, 'INCOME', 5000, '2025-11-15 10:00:00', 1);
insertInv.run(2, 'INCOME', 2000, '2025-11-15 10:00:00', 1);
insertInv.run(1, 'INCOME', 2000, '2026-07-01 10:00:00', 1);
insertInv.run(2, 'INCOME', 1000, '2026-07-01 10:00:00', 1);

// 6. Orders, Items, Payments & History
const insertOrder = db.prepare("INSERT INTO orders (id, client_id, manager_id, order_date, total_amount, is_fully_paid) VALUES (?, ?, ?, ?, ?, ?)");
const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, total_weight, total_cost, raw_material_id) VALUES (?, ?, ?, ?, ?, ?)");
const insertPayment = db.prepare("INSERT INTO payments (order_id, amount, payment_type, payment_date, created_by) VALUES (?, ?, ?, ?, ?)");
const insertHistory = db.prepare("INSERT INTO order_status_history (order_id, status_code, changed_at, changed_by) VALUES (?, ?, ?, ?)");

const orders = [
    // Спокойные месяцы
    { id: 1, client_id: 1, manager_id: 3, date: '2025-01-15 12:00:00', amount: 85000, paid: 1, prod_id: 2, qty: 1, weight: 50, rm_id: 2, status: 'SHIPPED', payments: [{amt: 85000, type: 'cashless'}] },
    { id: 2, client_id: 3, manager_id: 3, date: '2025-03-10 12:00:00', amount: 167000, paid: 1, prod_id: 1, qty: 10000, weight: 100, rm_id: 1, status: 'SHIPPED', payments: [{amt: 167000, type: 'cashless'}] },
    { id: 3, client_id: 4, manager_id: 4, date: '2025-05-20 12:00:00', amount: 255000, paid: 1, prod_id: 2, qty: 1, weight: 150, rm_id: 2, status: 'SHIPPED', payments: [{amt: 255000, type: 'cash'}] },
    
    // Первый пик
    { id: 4, client_id: 7, manager_id: 4, date: '2025-08-15 12:00:00', amount: 2400000, paid: 1, prod_id: 1, qty: 150000, weight: 1500, rm_id: 1, status: 'SHIPPED', payments: [{amt: 2400000, type: 'cashless'}] },
    { id: 5, client_id: 6, manager_id: 3, date: '2025-09-05 12:00:00', amount: 3800000, paid: 1, prod_id: 1, qty: 250000, weight: 2500, rm_id: 1, status: 'SHIPPED', payments: [{amt: 3800000, type: 'cashless'}] },
    
    // Второй пик
    { id: 6, client_id: 9, manager_id: 4, date: '2025-11-20 12:00:00', amount: 3300000, paid: 1, prod_id: 1, qty: 200000, weight: 2000, rm_id: 1, status: 'SHIPPED', payments: [{amt: 3300000, type: 'cashless'}] },
    { id: 7, client_id: 10, manager_id: 4, date: '2025-12-05 12:00:00', amount: 5500000, paid: 1, prod_id: 1, qty: 350000, weight: 3500, rm_id: 1, status: 'SHIPPED', payments: [{amt: 5500000, type: 'cash'}] },
    
    // Текущие заказы
    { id: 8, client_id: 5, manager_id: 3, date: '2026-07-01 12:00:00', amount: 340000, paid: 1, prod_id: 3, qty: 1, weight: 200, rm_id: 2, status: 'SHIPPED', status_date: '2026-07-03 12:00:00', payments: [{amt: 340000, type: 'cashless'}] },
    { id: 9, client_id: 1, manager_id: 3, date: '2026-07-10 12:00:00', amount: 170000, paid: 0, prod_id: 2, qty: 1, weight: 100, rm_id: 2, status: 'READY', payments: [{amt: 85000, type: 'cash'}] },
    { id: 10, client_id: 6, manager_id: 3, date: '2026-07-12 12:00:00', amount: 1670000, paid: 0, prod_id: 1, qty: 100000, weight: 1000, rm_id: 1, status: 'CAST', payments: [{amt: 1000000, type: 'cashless'}] },
    { id: 11, client_id: 3, manager_id: 3, date: '2026-07-16 12:00:00', amount: 835000, paid: 0, prod_id: 1, qty: 50000, weight: 500, rm_id: 1, status: 'RECEIVED', payments: [] }
];

for (const o of orders) {
    insertOrder.run(o.id, o.client_id, o.manager_id, o.date, o.amount, o.paid);
    insertItem.run(o.id, o.prod_id, o.qty, o.weight, o.amount, o.rm_id);
    
    // Reserve raw material
    insertInv.run(o.rm_id, 'RESERVE', -o.weight, o.date, o.manager_id);
    
    for (const p of o.payments) {
        insertPayment.run(o.id, p.amt, p.type, o.date, o.manager_id);
    }

    // Status History
    insertHistory.run(o.id, 'RECEIVED', o.date, o.manager_id);
    if (o.status === 'CAST' || o.status === 'READY' || o.status === 'SHIPPED') {
        insertHistory.run(o.id, 'CAST', o.date, 5); // prod manager
    }
    if (o.status === 'READY' || o.status === 'SHIPPED') {
        insertHistory.run(o.id, 'READY', o.date, 5);
    }
    if (o.status === 'SHIPPED') {
        insertHistory.run(o.id, 'SHIPPED', o.status_date || o.date, o.manager_id);
    }
}

console.log('Seeding complete!');
