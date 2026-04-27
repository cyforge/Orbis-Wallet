import { Hono } from 'hono';
import { discoverDappsService } from '../services/discoverDappsService';
import { createDiscoverDappSchema, updateDiscoverDappSchema } from '../validations/discoverDappsSchema';
import { rbacAdminMiddleware } from '../middlewares/rbacMiddleware';

const discoverDappsController = new Hono();

/**
 * GET /api/discover-dapps
 * List all dapps. Supports optional query filters: status, categoryId, search.
 */
discoverDappsController.get('/', async (c) => {
    const { status, categoryId, search } = c.req.query();
    const dapps = await discoverDappsService.getAllDapps({
        status: status || undefined,
        categoryId: categoryId || undefined,
        search: search || undefined,
    });
    return c.json(dapps);
});

/**
 * GET /api/discover-dapps/:id
 * Get a single dapp by UUID.
 */
discoverDappsController.get('/:id', async (c) => {
    const id = c.req.param('id');
    const dapp = await discoverDappsService.getDappById(id);

    if (!dapp) {
        return c.json({ error: 'Dapp not found' }, 404);
    }

    return c.json(dapp);
});

/**
 * POST /api/discover-dapps
 * Create a new dapp entry (admin only). Slug is auto-generated from title.
 */
discoverDappsController.post('/', rbacAdminMiddleware, async (c) => {
    const body = await c.req.json();

    const validationResult = createDiscoverDappSchema.safeParse(body);
    if (!validationResult.success) {
        return c.json(
            {
                error: 'Validation failed',
                details: validationResult.error.format(),
            },
            400,
        );
    }

    try {
        const dapp = await discoverDappsService.createDapp(validationResult.data);
        return c.json(dapp, 201);
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            return c.json({ error: error.message }, 409);
        }
        return c.json({ error: 'Failed to create dapp' }, 500);
    }
});

/**
 * PUT /api/discover-dapps/:id
 * Update an existing dapp (admin only). Slug is regenerated if title changes.
 */
discoverDappsController.put('/:id', rbacAdminMiddleware, async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const validationResult = updateDiscoverDappSchema.safeParse(body);
    if (!validationResult.success) {
        return c.json(
            {
                error: 'Validation failed',
                details: validationResult.error.format(),
            },
            400,
        );
    }

    try {
        const dapp = await discoverDappsService.updateDapp(id, validationResult.data);
        return c.json(dapp);
    } catch (error: any) {
        if (error.message === 'Dapp not found') {
            return c.json({ error: 'Dapp not found' }, 404);
        }
        if (error.message?.includes('already exists')) {
            return c.json({ error: error.message }, 409);
        }
        return c.json({ error: 'Failed to update dapp' }, 500);
    }
});

/**
 * DELETE /api/discover-dapps/:id
 * Delete a dapp by UUID (admin only).
 */
discoverDappsController.delete('/:id', rbacAdminMiddleware, async (c) => {
    const id = c.req.param('id');

    try {
        const result = await discoverDappsService.deleteDapp(id);
        return c.json(result);
    } catch (error: any) {
        if (error.message === 'Dapp not found') {
            return c.json({ error: 'Dapp not found' }, 404);
        }
        return c.json({ error: 'Failed to delete dapp' }, 500);
    }
});

export default discoverDappsController;
