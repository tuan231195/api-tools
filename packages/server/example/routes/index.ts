import { Router } from 'express';

export default function initRoute(router: Router) {
	router.get('/hello', (req, res) => res.send('ok'));
}
