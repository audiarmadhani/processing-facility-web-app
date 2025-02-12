const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// Route for creating target metrics data
router.post('/targets', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      type, 
      processingType,
      productLine,
      producer, 
      quality, 
      metric, 
      timeFrame, 
      targetValue, 
      startDate, 
      endDate 
    } = req.body;

    // Validate required fields
    if (!type || !processingType || !quality || !metric || !timeFrame || !targetValue || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Save the target metrics data
    const [TargetMetrics] = await sequelize.query(
      `INSERT INTO "TargetMetrics" 
       (type, "processingType", "productLine", producer, quality, metric, "timeFrame", "targetValue", "startDate", "endDate", "createdAt", "updatedAt") 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING *`,
      {
        replacements: [
          type, 
          processingType, 
          productLine,
          producer,
          quality, 
          metric, 
          timeFrame, 
          targetValue, 
          startDate, 
          endDate, 
          new Date(), 
          new Date()
        ],
        transaction: t,
      }
    );

    // Commit the transaction
    await t.commit();

    // Respond with success
    res.status(201).json({
      message: 'Target metrics created successfully',
    });
  } catch (err) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error creating target metrics data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Route for fetching all target metrics data
router.get('/targets', async (req, res) => {
  try {
    // Fetch all records for filtering purposes
    const [allRows] = await sequelize.query('SELECT * FROM "TargetMetrics"');
    res.json(allRows);
  } catch (err) {
    console.error('Error fetching target metrics data:', err);
    res.status(500).json({ message: 'Failed to fetch target metrics data.' });
  }
});

const calculateDateRanges = (type) => {
  const today = new Date();
  let start, end;

  if (type === 'this-week') {
    const dayOfWeek = today.getDay() || 7; // Convert Sunday (0) to 7 for ISO week
    start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek + 1); // Start of this week (Monday)
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6); // End of this week (Sunday)
    end.setHours(23, 59, 59, 999);
  } else if (type === 'this-month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1); // Start of the month
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of the month
  } else if (type === 'next-week') {
    const dayOfWeek = today.getDay() || 7;
    start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek + 8); // Start of next week (Monday)
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6); // End of next week (Sunday)
    end.setHours(23, 59, 59, 999);
  } else if (type === 'next-month') {
    start = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Start of next month
    end = new Date(today.getFullYear(), today.getMonth() + 2, 0); // End of next month
  } else if (type === 'previous-week') {
    const dayOfWeek = today.getDay() || 7;
    start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek - 6); // Start of previous week (Monday)
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6); // End of previous week (Sunday)
    end.setHours(23, 59, 59, 999);
  } else if (type === 'previous-month') {
    start = new Date(today.getFullYear(), today.getMonth() - 1, 1); // Start of previous month
    end = new Date(today.getFullYear(), today.getMonth(), 0); // End of previous month
  }

  return { start, end };
};

// Generic route for fetching target metrics data within a specific range
router.get('/targets/:range', async (req, res) => {
  const range = req.params.range;
  const { start, end } = calculateDateRanges(range);

  if (!start || !end) {
    return res.status(400).json({ message: 'Invalid range parameter.' });
  }

  try {
    const query = `WITH metric AS (SELECT id, type, "processingType", "productLine", producer, quality, metric, CASE WHEN metric = 'Average Cherry Cost' THEN AVG("targetValue") ELSE SUM("targetValue") END AS "targetValue", "columnName" FROM "TargetMetrics" WHERE "startDate" <= ? AND "endDate" >= ? GROUP BY id, type, "processingType" ,"productLine", producer, quality, metric, "columnName"), ttw AS (SELECT type, "processingType", "productLine", producer, quality, 'Total Weight Produced' AS metric, COALESCE(SUM(weight), 0) AS achievement FROM "PostprocessingData" WHERE "storedDate" BETWEEN ? AND ? GROUP BY type, "processingType", "productLine", producer, quality) SELECT a.id, a.type, a."processingType", a."productLine", a.producer, a.quality, a.metric, a."targetValue", COALESCE(b.achievement, 0) as achievement, a."columnName" FROM metric a LEFT JOIN ttw b ON LOWER(a.type) = LOWER(b.type) AND LOWER(a."processingType") = LOWER(b."processingType") AND LOWER(a."productLine") = LOWER(b."productLine") AND LOWER(a.producer) = LOWER(b.producer) AND LOWER(a.quality) = LOWER(b.quality) AND LOWER(a.metric) = LOWER(b.metric);`;

    const values = [end, start, start, end];
    const result = await sequelize.query(query, {
      replacements: values,
      type: sequelize.QueryTypes.SELECT,
    });

    if (result.length === 0) {
      return res.status(404).json({ message: 'No data found for the specified range.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching target metrics:', err);
    res.status(500).json({ message: 'Failed to fetch data.' });
  }
});

// Route for updating the column name of a target metric
router.put('/targets/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      type, 
      processingType,
      productLine,
      producer, 
      quality, 
      metric, 
      timeFrame, 
      targetValue, 
      startDate, 
      endDate 
    } = req.body;

    // Validate required fields
    if (!type || !processingType || !quality || !metric || !timeFrame || !targetValue || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Save the target metrics data
    const [TargetMetrics] = await sequelize.query(
      `UPDATE "TargetMetrics" 
       SET type = ?, "processingType" = ?, "productLine" = ?, producer = ?, quality = ?, metric = ?, "timeFrame" = ?, "targetValue" = ?, "startDate" = ?, "endDate" = ?, "updatedAt" = ? WHERE id = ?`,
      {
        replacements: [
          type, 
          processingType, 
          productLine,
          producer,
          quality, 
          metric, 
          timeFrame, 
          targetValue, 
          startDate, 
          endDate, 
          new Date(), 
          id,
        ],
        transaction: t,
      }
    );

    // Commit the transaction
    await t.commit();

    // Respond with success
    res.status(201).json({
      message: 'Target metrics updated successfully',
    });
  } catch (err) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error updating target metrics data:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Route for deleting a calendar event
router.delete('/targets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await sequelize.query('DELETE FROM "TargetMetrics" WHERE id = ?', {
      replacements: [id],
    });

    res.status(200).json({ message: 'Target deleted successfully' });
  } catch (err) {
    console.error('Error deleting target:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;