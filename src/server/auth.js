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
        res.sendStatus(401);
      });
  } else {
    res.sendStatus(401);
  }
}




async function getgamemiddleware(req, res, next) {
  let game;
  try {
    game = await gamesdb.findById(req.params.id);
    
    if (game == null) {
      return res.status(404).json({ msg: "not found .." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error });
  }
 
  res.game = game;

  next();
}



module.exports = {
  userAuthentication,
  getgamemiddleware,
};
