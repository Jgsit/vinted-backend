// import express
const express = require("express");
const router = express.Router();

// import cloudinary
const cloudinary = require("cloudinary").v2;

// import nos models
const Offer = require("../models/Offer");
const User = require("../models/User");

// immport de nos middlewares
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");

// fonction permetant de convertir nos images reçu en base64 pour cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// route pour creer une offre
router.post("/publish", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    console.log(req.files);

    if (!title) {
      return res.status(400).json({ message: "Le titre est obligatoire" });
    }
    if (!price) {
      return res.status(400).json({ message: "Le prix est obligatoire" });
    }
    if (!city) {
      return res.status(400).json({ message: "Le lieux est obligatoire" });
    }
    if (description.length > 500) {
      return res.status(416).json({
        message: "La description doit faire moins de 500 caractères",
      });
    }
    if (title.length > 50) {
      return res
        .status(416)
        .json({ message: "Le titre doit faire moins de 50 caractères" });
    }
    if (price > 100_000) {
      return res
        .status(416)
        .json({ message: "Le prix ne peut pas dépasser 100 000€" });
    }
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        { TAILLE: size },
        { ETAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });
    if (req.files) {
      if (req.files.picture) {
        const pictureConverted = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          { folder: `/vinted/offers/${newOffer._id}` }
        );
        newOffer.product_image = pictureConverted;
      }
      if (req.files.pictures) {
        const picturesConverted = [];
        for (let i = 0; i < req.files.pictures.length; i++) {
          const picture = await cloudinary.uploader.upload(
            convertToBase64(req.files.pictures[i]),
            { folder: `/vinted/offers/${newOffer._id}` }
          );
          picturesConverted.push(picture);
        }
        newOffer.product_pictures = picturesConverted;
      }
    }
    await newOffer.save();
    const responseObj = {
      _id: newOffer._id,
      product_name: newOffer.product_name,
      product_description: newOffer.product_description,
      product_price: newOffer.product_price,
      product_details: {
        MARQUE: newOffer.product_details[0].MARQUE,
        TAILLE: newOffer.product_details[1].TAILLE,
        ETAT: newOffer.product_details[2].ETAT,
        COULEUR: newOffer.product_details[3].COULEUR,
        EMPLACEMENT: newOffer.product_details[4].EMPLACEMENT,
      },
      owner: {
        account: {
          username: req.user.account.username,
          avatar: req.user.account.avatar,
        },
        _id: req.user._id,
      },
      product_image: newOffer.product_image,
      product_pictures: newOffer.product_pictures,
    };
    res.status(201).json(responseObj);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// route pour modifier une offre
router.put(
  "offers/modify/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerToModify = await Offer.findById(req.params.id); // on recupère l'offre
      if (offerToModify === null) {
        // on test si offerToModify renvoie null
        return res.status(400).json({ message: "L'offre n'existe pas" });
      }
      if (offerToModify.owner._id !== req.user._id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { title, description, price, condition, color, city } = req.body;
      const { picture, pictures } = req.files;

      if (title) {
        if (title.length > 50) {
          return res
            .status(416)
            .json({ message: "Le titre doit faire moins de 50 caractères" });
        }
        offerToModify.product_name = title;
      }
      if (description) {
        if (description.length > 500) {
          return res.status(416).json({
            message: "La description doit faire moins de 500 caractères",
          });
        }
        offerToModify.product_description = description;
      }
      if (price) {
        if (price > 100_000) {
          return res
            .status(416)
            .json({ message: "Le prix ne peut pas dépasser 100 000€" });
        }
        offerToModify.product_price = price;
      }
      if (condition) {
        offerToModify.product_details[2].ETAT = condition;
      }
      if (color) {
        offerToModify.product_details[3].COULEUR = color;
      }
      if (city) {
        offerToModify.product_details[4].EMPLACEMENT = city;
      }
      if (picture) {
        const pictureConverted = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          { folder: `/vinted/offers/${offerToModify._id}` }
        );
        offerToModify.product_image = pictureConverted;
      }
      if (pictures) {
        const picturesConverted = [];
        for (let i = 0; i < pictures.length; i++) {
          const pictureConverted = await cloudinary.uploader.upload(
            convertToBase64(req.files.pictures[i]),
            { folder: `vinted/offers/${offerToModify._id}` }
          );
          picturesConverted.push(pictureConverted);
        }
        offerToModify.product_pictures = picturesConverted;
      }
      offerToModify.markModified("product_details");
      await offerToModify.save(); // on sauvegarde les modifications
      const result = {
        _id: offerToModify._id,
        product_name: offerToModify.product_name,
        product_description: offerToModify.product_description,
        product_price: offerToModify.product_price,
        product_details: {
          MARQUE: offerToModify.product_details[0].MARQUE,
          TAILLE: offerToModify.product_details[1].TAILLE,
          ETAT: offerToModify.product_details[2].ETAT,
          COULEUR: offerToModify.product_details[3].COULEUR,
          EMPLACEMENT: offerToModify.product_details[4].EMPLACEMENT,
        },
        owner: {
          account: {
            username: req.user.account.username,
            avatar: req.user.account.avatar,
          },
          _id: req.user._id,
        },
        product_image: offerToModify.product_image,
      };
      res.status(202).json(result);
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

// route pour supprimer une offre
router.delete(
  "/offers/delete/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (await Offer.findByIdAndDelete(req.params.id)) {
        res.json({ message: "Deleted" });
      } else {
        res.status(400).json({ message: "L'offre n'existe pas" });
      }
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

// route pour récupérer les offres
router.get("/offers", async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page, limit } = req.query;
    const filter = {};
    if (title) {
      filter.product_name = new RegExp(`${title}`, "i");
    }
    if (priceMin) {
      filter.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = priceMax;
      } else {
        filter.product_price = { $lte: priceMax };
      }
    }
    const count = await Offer.countDocuments(filter);
    let query = Offer.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate({
        path: "owner",
        select: "account.username account.avatar.secure_url",
      });
    if (sort) {
      query = query.sort({ product_price: sort.split("-")[1] });
    }
    console.log(query);

    const offers = await query;
    let arrayOffers = [];
    count - (page - 1) * limit > limit
      ? (indexMax = limit)
      : (indexMax = count - (page - 1) * limit);
    for (let i = 0; i < indexMax; i++) {
      arrayOffers[i] = {
        product_details: offers[i].product_details,
        product_image: offers[i].product_image,
        _id: offers[i]._id,
        product_name: offers[i].product_name,
        product_description: offers[i].product_description,
        product_price: offers[i].product_price,
        owner: offers[i].owner,
        product_pictures: offers[i].product_pictures,
        __v: offers[i].__v,
      };
    }
    let result = { count: count, offers: arrayOffers };
    res.json(result);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// route pour récupérer une offre par son id
router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    if (offer) {
      let result = {
        product_details: offer.product_details,
        product_pictures: [],
        _id: offer._id,
        product_name: offer.product_name,
        product_description: offer.product_description,
        product_price: offer.product_price,
        owner: offer.owner,
        product_image: offer.product_image,
        __v: offer.__v,
      };
      return res.json(result);
    } else {
      return res.status(400).json({ message: "No offer with this id" });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = router;
