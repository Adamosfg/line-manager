const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('./authMiddleware');

// @route   POST api/reports
// @desc    Submit a new daily report
// @access  Private (Chef de Ligne)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      compte_rendu_date,
      segment_famille,
      declaration,
      heures_produites,
      efficience,
      effectif_present,
      absence,
      problem_1_type,
      problem_1_desc,
      problem_2_type,
      problem_2_desc,
      problem_3_type,
      problem_3_desc
    } = req.body;

    const query = `
      INSERT INTO reports (
        user_id, compte_rendu_date, segment_famille, declaration,
        heures_produites, efficience, effectif_present, absence,
        problem_1_type, problem_1_desc, problem_2_type, problem_2_desc, problem_3_type, problem_3_desc
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    
    // We get req.user.id from the authMiddleware
    const values = [
      req.user.id, compte_rendu_date, segment_famille, declaration,
      heures_produites || 0, efficience || 0, effectif_present || 0, absence || 0,
      problem_1_type || null, problem_1_desc || null, 
      problem_2_type || null, problem_2_desc || null, 
      problem_3_type || null, problem_3_desc || null
    ];

    const newReport = await db.query(query, values);
    res.json(newReport.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error while submitting report');
  }
});

// @route   GET api/reports
// @desc    Get all reports (for supervisor dashboard)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT r.id, r.user_id, TO_CHAR(r.compte_rendu_date, 'YYYY-MM-DD') as compte_rendu_date,
             r.segment_famille, r.declaration, r.heures_produites, r.efficience, r.effectif_present, r.absence,
             r.problem_1_type, r.problem_1_desc, r.problem_2_type, r.problem_2_desc, r.problem_3_type, r.problem_3_desc,
             u.username as chef_name
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.compte_rendu_date DESC, r.created_at DESC;
    `;
    const reports = await db.query(query);
    res.json(reports.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error fetching reports');
  }
});

module.exports = router;
