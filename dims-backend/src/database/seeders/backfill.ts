import { AppDataSource } from "src/typeorm.config";

async function run() {
    try {
        // 1. Connect to the database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log("Database connected!");
    
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            await queryRunner.query(`
            UPDATE threads t
            SET last_activity_at = sub.max_date
            FROM (
                SELECT thread_id, MAX(COALESCE(sent_at, created_at)) as max_date
                FROM messages
                GROUP BY thread_id
            ) sub
            WHERE t.id = sub.thread_id
            `);

            await queryRunner.commitTransaction();
            console.log("Seeding completed successfully!");
            
        } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
        } finally {
        await queryRunner.release();
        }

    } catch (error) {
        console.error("Error during seeding:", error);
    }finally {
        await AppDataSource.destroy();
    }
};


run();