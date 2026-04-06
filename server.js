/********************************************************************************
*  WEB422 – Assignment 3
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Manav Dhameliya  Student ID: 184861235  Date: __________________
*
*  Published URL (of the API) on Vercel:  _________________________________
*
********************************************************************************/

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dataService = require("./data-service.js");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");

const app = express();
const HTTP_PORT = 8080;

// JWT Strategy Setup
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
  secretOrKey: process.env.JWT_SECRET,
};

const strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  if (jwt_payload) {
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
    });
  } else {
    next(null, false);
  }
});

passport.use(strategy);

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.json({
    message: "A3 – Secured API Listening",
    term: "Winter 2026",
    student: "Manav Dhameliya",
    learnID: "mddhameliya1",
  });
});


app.get("/api/sites", async (req, res) => {
  try {
    const {
      page,
      perPage,
      name,
      description,
      year,
      town,
      provinceOrTerritoryCode,
    } = req.query;

    const sites = await dataService.getAllSites(
      page,
      perPage,
      name,
      description,
      year ? Number(year) : undefined,
      town,
      provinceOrTerritoryCode
    );

    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sites/:id", async (req, res) => {
  try {
    const site = await dataService.getSiteById(req.params.id);

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post(
  "/api/sites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const newSite = await dataService.addNewSite(req.body);
      res.status(201).json(newSite);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put(
  "/api/sites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const result = await dataService.updateSiteById(req.body, req.params.id);

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Site not found" });
      }

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.delete(
  "/api/sites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const result = await dataService.deleteSiteById(req.params.id);

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Site not found" });
      }

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.post("/api/user/register", (req, res) => {
  dataService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.post("/api/user/login", (req, res) => {
  dataService
    .checkUser(req.body)
    .then((user) => {
      const payload = {
        _id: user._id,
        userName: user.userName,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET);

      res.json({
        message: "login successful",
        token: token,
      });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dataService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dataService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dataService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

dataService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on port ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log("Failed to start server:", err);
  });