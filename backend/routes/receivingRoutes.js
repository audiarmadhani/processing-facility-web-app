const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// Route for creating receiving data (NO AUTHENTICATION)
router.post('/receiving', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { farmerID, farmerName, weight, totalBags, notes, type, bagPayload, createdBy, updatedBy, rfid } = req.body;

        // Basic validation (you should have more robust validation, even without auth)
        if (!farmerID || !farmerName || weight === undefined || !totalBags || !type || !createdBy || !updatedBy) {
            await t.rollback();
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        if (!rfid) { //check if rfid is available
          await t.rollback();
          return res.status(400).json({ error: 'RFID tag is required.' });
        }

        // Retrieve or initialize the latest batch number (CORRECTED)
        const [latestBatchResults] = await sequelize.query(
          'SELECT latest_batch_number FROM latest_batch LIMIT 1',
          { transaction: t, type: sequelize.QueryTypes.SELECT }
        );
        let latestBatch;

        // Correctly handle both an array and a single object return
        if (Array.isArray(latestBatchResults) && latestBatchResults.length > 0) {
          // We got an array (even if it's a single-element array)
          latestBatch = latestBatchResults[0];
        } else if (latestBatchResults && latestBatchResults.latest_batch_number) {
          // We got a single object directly
          latestBatch = latestBatchResults;
        } else {
          // No records exist, initialize
          await sequelize.query(
              'INSERT INTO latest_batch (latest_batch_number) VALUES (:initialValue)',
              { replacements: { initialValue: '1970-01-01-0000' }, transaction: t, type: sequelize.QueryTypes.INSERT }
          );
          latestBatch = { latest_batch_number: '1970-01-01-0000' };
        }

        console.log("latestBatchResults:", latestBatchResults);
        console.log("latestBatchResults.length:", latestBatchResults.length);
        console.log("latestBatchResults.length:", latestBatchResults.latest_batch_number);
        console.log("latestBatchResults[0]:", latestBatchResults[0]);
        console.log("latestBatch:", latestBatch);

        // Get current date and format it
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        const currentBatchDate = `${year}-${month}-${day}`;

        // Calculate the new batch number
        const parts = latestBatch.latest_batch_number.split('-');
        const lastBatchDate = parts.slice(0, 3).join('-');
        const lastSeqNumber = parseInt(parts[3], 10);

        let sequenceNumber = (lastBatchDate === currentBatchDate) ? lastSeqNumber + 1 : 1;
        const batchNumber = `${currentBatchDate}-${String(sequenceNumber).padStart(4, '0')}`;

        // Insert ReceivingData (raw SQL)
        const [receivingData, metadata] = await sequelize.query(`
            INSERT INTO "ReceivingData" (
                "batchNumber", "farmerID", "farmerName", weight, "totalBags", notes, type,
                "receivingDate", "createdAt", "updatedAt", "createdBy", "updatedBy", "rfid", "currentAssign"
            ) VALUES (
                :batchNumber, :farmerID, :farmerName, :weight, :totalBags, :notes, :type,
                :receivingDate, :createdAt, :updatedAt, :createdBy, :updatedBy, :rfid, :currentAssign
            ) RETURNING *;
        `, {
            replacements: {
                batchNumber,
                farmerID,
                farmerName,
                weight,
                totalBags,
                notes,
                type,
                receivingDate: currentDate,
                createdAt: currentDate,
                updatedAt: currentDate,
                createdBy,  // From req.body
                updatedBy,   // From req.body
                rfid: rfid, // Include RFID from the request, allow null
                currentAssign: 1,
            },
            transaction: t,
            type: sequelize.QueryTypes.INSERT  // Corrected: INSERT query type
        });


        // Insert BagData (raw SQL)
        if (Array.isArray(bagPayload) && bagPayload.length > 0) {
            const bagInsertQuery = `
                INSERT INTO "BagData" ("batchNumber", "bagNumber", weight, "createdAt", "updatedAt")
                VALUES ${bagPayload.map(() => '(?, ?, ?, ?, ?)').join(', ')} RETURNING *;
            `;
            const bagData = bagPayload.flatMap(bag => [batchNumber, bag.bagNumber, bag.weight, currentDate, currentDate]);
            await sequelize.query(bagInsertQuery, {
                replacements: bagData,
                transaction: t,
                type: sequelize.QueryTypes.INSERT // Corrected query type
            });
        }

        // Update latest_batch (raw SQL)
        await sequelize.query(
            'UPDATE latest_batch SET latest_batch_number = :batchNumber',
            {
                replacements: { batchNumber },
                transaction: t,
                type: sequelize.QueryTypes.UPDATE // Corrected query type
            }
        );

        // Commit the transaction
        await t.commit();
        // console.log("Receiving Data:", receivingData);
        // Respond with success and return all data
        res.status(201).json({
          message: `Batch ${batchNumber} created successfully`,
          receivingData: receivingData[0], // Return created record.
        });


    } catch (err) {
        await t.rollback();
        console.error('Error creating receiving data:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Route for fetching all Receiving data
router.get('/receiving', async (req, res) => {
    try {
        // Fetch all records for filtering purposes
        const [allRows] = await sequelize.query(
          `SELECT a.*, DATE("receivingDate") as "receivingDateTrunc" FROM "ReceivingData" a;`
        );

        // Fetch the latest records ordered by QC date
        const [todayData] = await sequelize.query(
          `SELECT a.*, DATE("receivingDate") as "receivingDateTrunc" FROM "ReceivingData" a WHERE TO_CHAR("receivingDate", 'YYYY-MM-DD') = TO_CHAR(NOW(), 'YYYY-MM-DD') AND "batchNumber" NOT IN (SELECT unnest(regexp_split_to_array("batchNumber", ',')) FROM "TransportData") ORDER BY "receivingDate";`
        );

        res.json({ allRows, todayData });
    } catch (err) {
        console.error('Error fetching Receiving data:', err);
        res.status(500).json({ message: 'Failed to fetch Receiving data.' });
    }
});

// Route to get receiving data by batch number (always returns an array)
router.get('/receiving/:batchNumber', async (req, res) => {
  let { batchNumber } = req.params;
  batchNumber = batchNumber.trim(); // Trim just once

  try {
      const [rows] = await sequelize.query(
          `
          WITH qc AS (
              SELECT "batchNumber", MIN(DATE("qcDate")) AS "qcDateTrunc"
              FROM "QCData"
              GROUP BY "batchNumber"
          )
          SELECT 
              a.*, DATE("receivingDate") as "receivingDateTrunc", 
              "qcDateTrunc"
          FROM "ReceivingData" a 
          LEFT JOIN qc b ON a."batchNumber" = b."batchNumber" 
          WHERE LOWER(a."batchNumber") = LOWER(:batchNumber);
          `,
          {
              replacements: { batchNumber },
              type: sequelize.QueryTypes.SELECT,
          }
      );

      // Ensure response is always an array
      if (!Array.isArray(rows)) {
          return res.status(200).json(rows ? [rows] : []); // Wrap object in an array
      }

      if (rows.length === 0) {
          return res.status(404).json({ message: 'No receiving data found for this batch number.' });
      }

      res.json(rows);
  } catch (err) {
      console.error('Error fetching receiving data by batch number:', err);
      res.status(500).json({ message: 'Failed to fetch receiving data by batch number.' });
  }
});

// Route to get receiving data by rfid (always returns an array)
router.get('/receivingrfid/:rfid', async (req, res) => {
  let { rfid } = req.params;
  rfid = rfid.trim(); // Trim just once

  try {
      const [rows] = await sequelize.query(
          `
          WITH qc AS (
            SELECT "batchNumber", MIN(DATE("qcDate")) AS "qcDateTrunc"
            FROM "QCData"
            GROUP BY "batchNumber"
          )
            
          SELECT 
            a.*, DATE("receivingDate") as "receivingDateTrunc", 
            "qcDateTrunc"
          FROM "ReceivingData" a 
          LEFT JOIN qc b ON a."batchNumber" = b."batchNumber" 
          WHERE UPPER(a."rfid") = UPPER(:rfid)
          AND "currentAssign" = 1;
          `,
          {
              replacements: { rfid },
              type: sequelize.QueryTypes.SELECT,
          }
      );

      // Ensure response is always an array
      if (!Array.isArray(rows)) {
          return res.status(200).json(rows ? [rows] : []); // Wrap object in an array
      }

      if (rows.length === 0) {
          return res.status(404).json({ message: 'No receiving data found for this batch number.' });
      }

      res.json(rows);
  } catch (err) {
      console.error('Error fetching receiving data by batch number:', err);
      res.status(500).json({ message: 'Failed to fetch receiving data by batch number.' });
  }
});

module.exports = router;