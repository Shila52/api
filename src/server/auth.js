const { Admin } = require("./firebase");
const gamesdb = require("./GamesSchema");
function userAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    Admin.auth()
      .verifyIdToken(token)
      .then((decodedToken) => {
        const user = decodedToken;
        if (user) {
          req.user = user;
          next();
        } else {
          res.sendStatus(401);
        }
      })
      .catch((error) => {
        // Handle error
      });
  } else {
    res.sendStatus(401);
  }
}

function addUserToAuthList(req, res, next) {
  if (userList[req.session.id] !== undefined) {
    res.status(403).send("user already exist");
  } else {
    for (sessionid in userList) {
      const name = userList[sessionid];
      if (name === req.body) {
        res.status(403).send("user name already exist");
        return;
      }
    }
    userList[req.session.id] = req.body;
    next();
  }
}

function removeUserFromAuthList(req, res, next) {
  if (userList[req.session.id] === undefined) {
    res.status(403).send("user does not exist");
  } else {
    delete userList[req.session.id];
    next();
  }
}
async function getgamemiddleware(req, res, next) {
  let game;
  try {
    game = await gamesdb.findById(req.params.id);
    if (game == null) {
      return res.status(404).json({ msd: "not found .." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error });
  }
  res.game = game;
  next();
}

function getUserInfo(id) {
  return { name: userList[id] };
}

module.exports = {
  userAuthentication,
  addUserToAuthList,
  removeUserFromAuthList,
  getUserInfo,
  getgamemiddleware,
};
