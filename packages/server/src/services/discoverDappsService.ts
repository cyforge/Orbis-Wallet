import { db } from '../utils/db';
import { discoverDappsTable } from '../db/schema';
import { generateSlug } from '../utils/slugGenerator';
import { eq, ilike, and, SQL } from 'drizzle-orm';
import type { CreateDiscoverDappInput, UpdateDiscoverDappInput } from '../validations/discoverDappsSchema';

export class DiscoverDappsService {
    /**
     * Create a new dapp entry. The slug is auto-generated from the title.
     */
    async createDapp(data: CreateDiscoverDappInput) {
        const slug = generateSlug(data.title);

        const existing = await this.getDappBySlug(slug);
        if (existing) {
            throw new Error('A dapp with a similar title already exists');
        }

        const result = await db
            .insert(discoverDappsTable)
            .values({
                title: data.title,
                status: data.status,
                categoryId: data.categoryId ?? null,
                description: data.description ?? null,
                logo: data.logo ?? null,
                link: data.link,
                slug,
            })
            .returning();

        return result[0];
    }

    /**
     * Retrieve all dapps, with optional filtering by status, categoryId, or title search.
     */
    async getAllDapps(options?: {
        status?: string;
        categoryId?: string;
        search?: string;
    }) {
        const conditions: SQL[] = [];

        if (options?.status) {
            conditions.push(eq(discoverDappsTable.status, options.status));
        }
        if (options?.categoryId) {
            conditions.push(eq(discoverDappsTable.categoryId, options.categoryId));
        }
        if (options?.search) {
            conditions.push(ilike(discoverDappsTable.title, `%${options.search}%`));
        }

        if (conditions.length > 0) {
            return await db
                .select()
                .from(discoverDappsTable)
                .where(and(...conditions));
        }

        return await db.select().from(discoverDappsTable);
    }

    /**
     * Retrieve a single dapp by its UUID.
     */
    async getDappById(id: string) {
        const result = await db
            .select()
            .from(discoverDappsTable)
            .where(eq(discoverDappsTable.id, id));
        return result[0] ?? null;
    }

    /**
     * Retrieve a single dapp by its slug.
     */
    async getDappBySlug(slug: string) {
        const result = await db
            .select()
            .from(discoverDappsTable)
            .where(eq(discoverDappsTable.slug, slug));
        return result[0] ?? null;
    }

    /**
     * Update an existing dapp. Re-generates the slug if the title changes.
     */
    async updateDapp(id: string, data: UpdateDiscoverDappInput) {
        const dapp = await this.getDappById(id);
        if (!dapp) {
            throw new Error('Dapp not found');
        }

        let slug = dapp.slug;
        if (data.title) {
            slug = generateSlug(data.title);
            const existing = await this.getDappBySlug(slug);
            if (existing && existing.id !== id) {
                throw new Error('A dapp with a similar title already exists');
            }
        }

        const result = await db
            .update(discoverDappsTable)
            .set({
                title: data.title ?? dapp.title,
                status: data.status ?? dapp.status,
                categoryId: data.categoryId !== undefined ? data.categoryId : dapp.categoryId,
                description: data.description !== undefined ? data.description : dapp.description,
                logo: data.logo !== undefined ? data.logo : dapp.logo,
                link: data.link ?? dapp.link,
                slug,
                updatedAt: new Date(),
            })
            .where(eq(discoverDappsTable.id, id))
            .returning();

        return result[0];
    }

    /**
     * Delete a dapp by its UUID.
     */
    async deleteDapp(id: string) {
        const dapp = await this.getDappById(id);
        if (!dapp) {
            throw new Error('Dapp not found');
        }

        await db.delete(discoverDappsTable).where(eq(discoverDappsTable.id, id));
        return { success: true, message: 'Dapp deleted successfully' };
    }
}

export const discoverDappsService = new DiscoverDappsService();
