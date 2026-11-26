import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../data/attractions.json');

const router = Router();

async function loadAttractions() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

// GET /api/attractions?search=...&category=...&sort=...
router.get('/', async (req, res, next) => {
  try {
    const attractions = await loadAttractions();
    const { search = '', category = 'All', sort = 'popular' } = req.query;

    const normalizedSearch = String(search).trim().toLowerCase();
    const normalizedCategory = String(category).trim();

    let filtered = attractions.filter((item) => {
      const matchesCategory =
        !normalizedCategory ||
        normalizedCategory === 'All' ||
        item.primaryCategory === normalizedCategory ||
        (Array.isArray(item.categories) && item.categories.includes(normalizedCategory));

      if (!matchesCategory) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.name,
        item.shortName,
        item.neighborhood,
        item.address,
        item.primaryCategory,
        ...(item.categories || []),
        item.bestTime,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    if (sort === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.priceKes - b.priceKes);
    } else if (sort === 'rating-desc') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    } else if (sort === 'nearest') {
      filtered = [...filtered].sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      filtered = [...filtered].sort((a, b) => b.popularityScore - a.popularityScore);
    }

    res.json({
      count: filtered.length,
      total: attractions.length,
      attractions: filtered,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/attractions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const attractions = await loadAttractions();
    const attraction = attractions.find((item) => item.id === req.params.id);

    if (!attraction) {
      return res.status(404).json({
        error: 'Attraction not found',
        id: req.params.id,
      });
    }

    res.json(attraction);
  } catch (err) {
    next(err);
  }
});

export default router;
