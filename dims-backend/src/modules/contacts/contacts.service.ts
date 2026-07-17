import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Contact } from "./entities/contact.entity";
import csvParser from "csv-parser";
import { Readable } from "stream";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BATCH_SIZE = 500;

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async search(ownerId: string, query: string, limit = 10) {
    if (!query) return [];
    return this.contactRepo.find({
      where: [
        { ownerId, name: ILike(`%${query}%`) },
        { ownerId, email: ILike(`%${query}%`) },
      ],
      take: limit,
      order: { name: "ASC" },
    });
  }

  async importCsv(ownerId: string, fileBuffer: Buffer): Promise<{ imported: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      Readable.from(fileBuffer)
        .pipe(
          csvParser({
            // csv-parser is strict about headers; relax it
            strict: false,
            skipLines: 0,
          }),
        )
        .on("data", (row: any) => results.push(row))
        .on("end", async () => {
          try {
            let imported = 0;
            let skipped = 0;

            // Collect valid contacts from all rows
            const validContacts: Array<{ name: string; email: string }> = [];

            for (const row of results) {
              // ── Extract email using all known column names ──
              const rawEmail =
                row["E-mail 1 - Value"] ||
                row["E-mail 2 - Value"] ||
                row.email ||
                row.Email ||
                row.EMAIL ||
                row.email_address ||
                row["Email Address"] ||
                "";

              const email = String(rawEmail).trim().substring(0, 254);

              // Skip rows with no valid email
              if (!email || !EMAIL_REGEX.test(email)) {
                skipped++;
                continue;
              }

              // ── Extract name using all known column names ──
              let firstName =
                row["First Name"] ||
                row["first_name"] ||
                row["firstname"] ||
                row.name ||
                row.Name ||
                "";

              let lastName =
                row["Last Name"] ||
                row["last_name"] ||
                row["lastname"] ||
                "";

              firstName = String(firstName).trim().replace(/^'+|'+$/g, ""); // strip surrounding quotes
              lastName = String(lastName).trim().replace(/^'+|'+$/g, "");

              let name = firstName;
              if (lastName) {
                name = name ? `${name} ${lastName}` : lastName;
              }
              name = name.trim().substring(0, 255) || email;

              validContacts.push({ name, email });
            }

            // ── Batch save in chunks to avoid DB parameter limits ──
            for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
              const chunk = validContacts.slice(i, i + BATCH_SIZE);
              try {
                // Use upsert to skip duplicates (same owner + email)
                await this.contactRepo
                  .createQueryBuilder()
                  .insert()
                  .into(Contact)
                  .values(
                    chunk.map((c) => ({
                      ownerId,
                      name: c.name,
                      email: c.email,
                    })),
                  )
                  .orIgnore() // skip on duplicate key violation
                  .execute();

                imported += chunk.length;
              } catch (chunkError: any) {
                // If orIgnore fails (e.g., non-unique constraint), fall back to individual saves
                this.logger.warn(`Chunk insert failed, falling back to individual inserts: ${chunkError.message}`);
                for (const contact of chunk) {
                  try {
                    const entity = this.contactRepo.create({
                      ownerId,
                      name: contact.name,
                      email: contact.email,
                    });
                    await this.contactRepo.save(entity);
                    imported++;
                  } catch {
                    skipped++;
                  }
                }
              }
            }

            this.logger.log(`CSV import complete: ${imported} imported, ${skipped} skipped`);
            resolve({ imported, skipped });
          } catch (error: any) {
            this.logger.error("CSV Import Error:", error?.message, error?.stack);
            reject(new BadRequestException("Error processing contacts file"));
          }
        })
        .on("error", (err: Error) => {
          this.logger.error("CSV parse error:", err.message);
          reject(new BadRequestException("Invalid CSV format"));
        });
    });
  }
}
