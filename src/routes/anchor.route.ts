import { Router } from 'express';

const router = Router();

router.get('/anchors', (req, res) => {
  res.send('List of Anchors');
});

router.post('/anchors', (req, res) => {
    console.log(req.body);
    res.send('POST List of Anchors');
  });

export default router;
