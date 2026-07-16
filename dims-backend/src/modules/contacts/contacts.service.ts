import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { Contact } from "./entities/contact.entity";
import * as csvParser from "csv-parser";
import { Readable } from "stream";

@Injectable()
export class ContactsService {
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

  async importCsv(ownerId: string, fileBuffer: Buffer) {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      Readable.from(fileBuffer)
        .pipe(csvParser())
        .on("data", (data: any) => results.push(data))
        .on("end", async () => {
          try {
            const contacts = results
              .map((row) => {
                // extract name and email using common column headers
                const name =
                  row.name || row.Name || row.NAME || row.fullname || "";
                const email =
                  row.email ||
                  row.Email ||
                  row.EMAIL ||
                  row.email_address ||
                  "";
                if (!email) return null;

                return this.contactRepo.create({
                  ownerId,
                  name,
                  email,
                });
              })
              .filter(Boolean);

            if (contacts.length > 0) {
              await this.contactRepo.save(contacts);
            }
            resolve({ imported: contacts.length });
          } catch (error) {
            reject(new BadRequestException("Error saving contacts"));
          }
        })
        .on("error", () =>
          reject(new BadRequestException("Invalid CSV format")),
        );
    });
  }
}
