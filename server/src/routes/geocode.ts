import { Router, Request, Response } from 'express';
import { geocode } from '../services/geocode';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.query as string | undefined)?.trim();

  if (!query) {
    res.status(400).json({ error: '검색어를 입력해주세요.' });
    return;
  }

  if (query.length > 100) {
    res.status(400).json({ error: '검색어는 100자 이내로 입력해주세요.' });
    return;
  }

  try {
    const results = await geocode(query);
    if (results.length === 0) {
      res.status(404).json({ error: '검색 결과가 없습니다.', results: [] });
      return;
    }
    res.json({ results });
  } catch (err) {
    console.error('[geocode]', err);
    res.status(503).json({ error: '주소 검색 서비스에 일시적인 오류가 발생했습니다.' });
  }
});

export default router;
