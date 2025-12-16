// src/routes/soldes.routes.js
import express from 'express';
import {
  getSoldeMembre,
  getSoldeAllMembres,
  getStatsSoldes,
  checkMembreSolde
} from '../controllers/soldes.controller.js';

const router = express.Router();

router.get('/', getSoldeAllMembres); // GET /api/soldes
router.get('/stats', getStatsSoldes); // GET /api/soldes/stats
router.get('/check/:id', checkMembreSolde); // GET /api/soldes/check/:id
router.get('/:id', getSoldeMembre); // GET /api/soldes/:id

export default router;