const router = require("express").Router();
const Transaction = require("../models/Transaction.model");

router.post("/add", (req, res, next) => {
  const { payer, points, timestamp } = req.body;

  // First we validate that the incoming parameters are correctly formatted

  if (!req.body.hasOwnProperty("payer")) {
    res.json({
      success: false,
      message: "You need to include the key 'payer'",
    });
    return;
  }

  if (!req.body.hasOwnProperty("points")) {
    res.json({
      success: false,
      message: "You need to include the key 'points'",
    });
    return;
  }

  if (!req.body.hasOwnProperty("timestamp")) {
    res.json({
      success: false,
      message: "You need to include the key 'timestamp'",
    });
    return;
  }

  if (typeof payer != "string") {
    res.json({ success: false, message: "'payer' needs to be type string" });
    return;
  }

  if (typeof points != "number") {
    res.json({
      success: false,
      message: "'points' needs to be type number/integer",
    });
    return;
  }

  let timestampcheck = new Date(req.body.timestamp);

  if (!(timestampcheck > 0)) {
    res.json({ success: false, message: "'timestamp' needs to be type date" });
    return;
  }

  function isDateFormat(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(str)) {
      return false;
    } else {
      return true;
    }
  }
  if (!isDateFormat(timestamp)) {
    res.json({
      success: false,
      message: "'timestamp' needs to be formatted as '2020-11-02T14:00:00Z'",
    });
    return;
  }

  Transaction.find().then((result) => {
    // Here we create the object that will hold the total points for each payer
    data = result.reduce(function (r, a) {
      r[a.payer] = r[a.payer] || 0;
      r[a.payer] += Number(a.points);
      return r;
    }, Object.create(null));

    // We check if payer has enough positive points to cover the new transaction in case it's negative
    if (data[payer] + points >= 0 || points > 0) {
      // This is where we add a new transaction to our database
      Transaction.create({ payer, points, timestamp })
        .then((newTransaction) => {
          newTransaction = {
            payer: newTransaction.payer,
            points: newTransaction.points,
            timestamp: newTransaction.timestamp,
          };
          res.json({
            success: true,
            body: newTransaction,
          });
        })
        .catch((err) => {
          res.json({
            error: err,
            success: false,
            message: "Error adding transaction",
          });
        });
    } else {
      res.json({
        success: false,
        message: "Transaction invalid. Payer does not have enough balance",
      });
    }
  });
});

router.post("/spend", (req, res, next) => {
  // This array is where we will keep our promises, and at the end wait until all are resolved before we respond back
  let promises = [];

  // First we get all transactions from our database, sort them from oldest to newest
  Transaction.find().then((result) => {
    result.sort(function (a, b) {
      let dateA = new Date(a.timestamp);
      let dateB = new Date(b.timestamp);
      return dateA - dateB;
    });

    // Now we substract points from the top of our sorted list. If the balance of that transaction goes to 0, we update that in the database
    balance = req.body.points;
    let object = {};
    let spent = true;
    while (spent) {
      spent = false;
      let i = 0;
      while (i < result.length) {
        if (balance >= result[i].points && result[i].points != 0) {
          // What this section does is it creates a new object, using the payer names as key, since we need to return the total points used for each payer
          object[result[i].payer] = object[result[i].payer] || 0;
          object[result[i].payer] -= result[i].points;
          balance -= result[i].points;
          result[i].points = 0;
          spent = true;

          // Here is where we add promises to our promise array
          promises.push(
            Transaction.findByIdAndUpdate(result[i]._id, { points: 0 })
          );
        } else {
          // This happens only when we reach a transactin that has more points than our remaining point balance for this call
          if (balance < result[i].points && balance != 0) {
            object[result[i].payer] = object[result[i].payer] || 0;
            object[result[i].payer] -= balance;
            result[i].points -= balance;
            spent = true;

            // Here we add one last promise to our promise array
            promises.push(
              Transaction.findByIdAndUpdate(result[i]._id, {
                points: result[i].points,
              })
            );

            balance = 0;
          }
        }
        i++;
      }
    }

    // We initialize our response and finalReturn arrays that will contain an array of objects containing the payer name and points substracted
    let response = [];
    let finalReturn = [];

    // Here we build said array by pushing each value inside "Object" and formatting it in the proper way
    for (const key in object) {
      response.push({
        payer: key,
        points: object[key],
      });
    }

    finalReturn = {
      success: true,
      body: response,
    };

    //This is in case there aren't enough points from payers to spend all points
    if (balance)
      finalReturn.message = `There were ${balance} points that couldn't be used`;

    // Now we make our response wait until all pending promises have been resolved
    Promise.all(promises)
      .then(() => {
        res.json(finalReturn);
      })
      .catch((err) => {
        res.json({
          error: err,
          success: false,
          message: "Error performing task",
        });
      });
  });
});

router.get("/balance", (req, res, next) => {
  Transaction.find()
    .then((result) => {
      // Here we create the object that we will return for this call
      response = result.reduce(function (r, a) {
        r[a.payer] = r[a.payer] || 0;
        r[a.payer] += Number(a.points);
        return r;
      }, Object.create(null));
      res.json({
        success: true,
        body: response,
      });
    })
    .catch((err) => {
      res.json({
        error: err,
        success: false,
        message: "Error performing task",
      });
    });
});

module.exports = router;
