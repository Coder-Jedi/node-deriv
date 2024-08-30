import { Router } from 'express';

const router = Router();

router.get('/users', (req, res) => {
  res.send('List of users');
});

router.post('/users', (req, res) => {
    console.log(req.body);
    res.send('POST List of users');
  });

export default router;
