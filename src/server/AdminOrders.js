const express = require("express");
const bodyParser = require("body-parser");
const auth = require("./auth");
const Purchase = require("./Purchase");
const userDb = require("./userSchema");
const router = express.Router();
router.use(bodyParser.json());
router.get("/payments", auth.AdminCheck, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const data = await Purchase.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 });
    const total = await Purchase.countDocuments();

    res.json({
      data,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
router.patch("/payments", auth.AdminCheck, async (req, res) => {
  const { data } = req.body;

  try {
    const Get_Purchase = await Purchase.findById(data.id);
    const User = await userDb.findById(Get_Purchase.user_id);
    if (data.pending == "Accept") {
      User.coins = User.coins + Get_Purchase.amount_Coins;
      Get_Purchase.state = "Success";
      await User.save();
      await Get_Purchase.save();
      return res.sendStatus(200);
    } else if (data.pending == "Failed") {
      Get_Purchase.state = "Failed";
      await Get_Purchase.save();
      return res.sendStatus(200);
    } else if (data.pending == "Returned") {
      User.coins = User.coins - Get_Purchase.amount_Coins;
      Get_Purchase.state = "Mistake";
      await User.save();
      await Get_Purchase.save();
      return res.sendStatus(200);
    } else {
      console.log("uknown Pending");
    }
  } catch (error) {
    console.log(error);
    console.log("error on webhook create add coin on user account ");
  }
});
module.exports = router;
