import { AppDataSource } from "src/typeorm.config";

async function run() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("Database connected!");

    const rows = await AppDataSource.query(`
      SELECT
        m.id AS message_id,
        m.thread_id,
        m.sender_id,
        m.subject,
        m.sent_at,
        COALESCE(recipient_counts.recipient_count, 0) AS recipient_count
      FROM messages m
      LEFT JOIN (
        SELECT message_id, COUNT(*)::int AS recipient_count
        FROM message_recipients
        GROUP BY message_id
      ) recipient_counts ON recipient_counts.message_id = m.id
      WHERE m.is_draft = false
        AND COALESCE(recipient_counts.recipient_count, 0) = 0
      ORDER BY COALESCE(m.sent_at, m.created_at) DESC
    `);

    console.log(
      JSON.stringify(
        {
          orphanCount: rows.length,
          note: "These messages were saved without recipient rows. They cannot be reconstructed from the DB alone.",
          messages: rows,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("Error auditing orphan messages:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
