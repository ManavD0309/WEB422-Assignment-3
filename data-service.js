const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const siteSchema = require("./modules/siteSchema");
const userSchema = require("./modules/userSchema");

let mongoDBConnectionString = process.env.MONGO_URL;

let Site;
let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    const db = mongoose.createConnection(mongoDBConnectionString);

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      Site = db.model("sites", siteSchema);
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.addNewSite = async function (data) {
  const newSite = new Site(data);
  await newSite.save();
  return newSite;
};

module.exports.getAllSites = async function (
  page,
  perPage,
  name,
  description,
  year,
  town,
  provinceOrTerritoryCode
) {
  let findBy = {};

  if (name) {
    findBy = {
      ...findBy,
      siteName: { $regex: name, $options: "i" },
    };
  }

  if (description) {
    findBy = {
      ...findBy,
      description: { $regex: description, $options: "i" },
    };
  }

  if (year) {
    findBy = {
      ...findBy,
      "dates.year": year,
    };
  }

  if (town) {
    findBy = {
      ...findBy,
      "location.town": { $regex: town, $options: "i" },
    };
  }

  if (provinceOrTerritoryCode) {
    findBy = {
      ...findBy,
      "provinceOrTerritory.code": provinceOrTerritoryCode,
    };
  }

  if (+page && +perPage) {
    return Site.find(findBy)
      .sort({ siteName: 1 })
      .skip((page - 1) * +perPage)
      .limit(+perPage)
      .exec();
  }

  return Promise.reject(
    new Error("page and perPage query parameters must be valid numbers")
  );
};

module.exports.getSiteById = async function (id) {
  return Site.findById(id).exec();
};

module.exports.updateSiteById = async function (data, id) {
  return Site.updateOne({ _id: id }, { $set: data }).exec();
};

module.exports.deleteSiteById = async function (id) {
  return Site.deleteOne({ _id: id }).exec();
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          const newUser = new User({
            userName: userData.userName,
            password: hash,
            favourites: [],
          });

          newUser
            .save()
            .then(() => {
              resolve(
                "User " + userData.userName + " successfully registered"
              );
            })
            .catch((err) => {
              if (err.code == 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => reject(err.message || err));
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.findOne({ userName: userData.userName })
      .exec()
      .then((user) => {
        if (!user) {
          reject("Unable to find user " + userData.userName);
          return;
        }

        bcrypt.compare(userData.password, user.password).then((res) => {
          if (res === true) {
            resolve(user);
          } else {
            reject("Incorrect password for user " + userData.userName);
          }
        });
      })
      .catch(() => {
        reject("Unable to find user " + userData.userName);
      });
  });
};

module.exports.getFavourites = function (id) {
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        if (!user) {
          reject(`Unable to get favourites for user with id: ${id}`);
        } else {
          resolve(user.favourites || []);
        }
      })
      .catch(() => {
        reject(`Unable to get favourites for user with id: ${id}`);
      });
  });
};

module.exports.addFavourite = function (id, favId) {
  return new Promise(function (resolve, reject) {
    User.findById(id)
      .exec()
      .then((user) => {
        if (!user) {
          reject(`Unable to update favourites for user with id: ${id}`);
          return;
        }

        if ((user.favourites || []).length < 50) {
          User.findByIdAndUpdate(
            id,
            { $addToSet: { favourites: favId } },
            { new: true }
          )
            .exec()
            .then((updatedUser) => {
              resolve(updatedUser.favourites || []);
            })
            .catch(() => {
              reject(`Unable to update favourites for user with id: ${id}`);
            });
        } else {
          reject(`Unable to update favourites for user with id: ${id}`);
        }
      })
      .catch(() => {
        reject(`Unable to update favourites for user with id: ${id}`);
      });
  });
};

module.exports.removeFavourite = function (id, favId) {
  return new Promise(function (resolve, reject) {
    User.findByIdAndUpdate(
      id,
      { $pull: { favourites: favId } },
      { new: true }
    )
      .exec()
      .then((user) => {
        if (!user) {
          reject(`Unable to update favourites for user with id: ${id}`);
        } else {
          resolve(user.favourites || []);
        }
      })
      .catch(() => {
        reject(`Unable to update favourites for user with id: ${id}`);
      });
  });
};