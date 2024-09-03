// import express
const express = require("express");
const app = express();
app.use(express.json());

// configuration de dotenv
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRETKEY);

// import cors
const cors = require("cors");
app.use(cors());

// import mongoose
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

// import de cloudinary
const cloudinary = require("cloudinary").v2;

// configuration de cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_APIKEY,
  api_secret: process.env.CLOUD_APISECRET,
});

// import de mes routeurs
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

// utilisation de mes routers
app.use(userRoutes);
app.use(offerRoutes);

app.post("/payment", async (req, res) => {
  try {
    const { title, amount } = req.body;
    // On crée une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction
      amount: Number(amount * 100),
      // Devise de la transaction
      currency: "eur",
      // Description du produit
      description: title,
    });
    // On renvoie les informations de l'intention de paiement au client
    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
