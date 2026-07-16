import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'director' && session.role !== 'production')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'add_production') {
      const materialUsed = parseFloat(body.materialUsed);
      const producedQty = parseInt(body.producedQty, 10);
      const defectKg = parseFloat(body.defectKg || 0);

      if (isNaN(materialUsed) || materialUsed <= 0 || isNaN(producedQty) || producedQty < 0) {
        return NextResponse.json({ error: 'Неверные параметры выпуска' }, { status: 400 });
      }

      const transaction = db.transaction(() => {
        const insertLog = db.prepare(`
          INSERT INTO production_logs (material_used_kg, produced_qty, defect_kg, operator_id, date)
          VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
        `);
        insertLog.run(materialUsed, producedQty, defectKg, session.id);

        const updatePVD = db.prepare("UPDATE materials SET stock_kg = stock_kg - ? WHERE name LIKE '%ПВД%'");
        updatePVD.run(materialUsed);

        if (defectKg > 0) {
          const updateSecondary = db.prepare("UPDATE materials SET stock_kg = stock_kg + ? WHERE name LIKE '%Вторичка%'");
          updateSecondary.run(defectKg);
        }
      });

      transaction();
      return NextResponse.json({ success: true });

    } else if (action === 'add_incoming') {
      const materialId = parseInt(body.materialId, 10);
      const amountKg = parseFloat(body.amountKg);

      if (isNaN(materialId) || materialId <= 0 || isNaN(amountKg) || amountKg <= 0) {
        return NextResponse.json({ error: 'Неверные параметры прихода' }, { status: 400 });
      }

      const transaction = db.transaction(() => {
        const insertLog = db.prepare(`
          INSERT INTO incoming_logs (material_id, amount_kg, operator_id, date)
          VALUES (?, ?, ?, datetime('now', 'localtime'))
        `);
        insertLog.run(materialId, amountKg, session.id);

        const updateStock = db.prepare("UPDATE materials SET stock_kg = stock_kg + ? WHERE id = ?");
        updateStock.run(amountKg, materialId);
      });

      transaction();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  } catch (error) {
    console.error('Production API error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
