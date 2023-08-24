// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const admin = require("firebase-admin");
const {
  getDatabase,
  ref,
  set,
  orderByChild,
  equalTo,
  query,
  get,
  remove,
} = require("firebase/database");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxct_-uPjAI-Fl_5Bns1re_oFg8khR7rE",
  authDomain: "newone-e378f.firebaseapp.com",
  databaseURL: "https://newone-e378f-default-rtdb.firebaseio.com",
  projectId: "newone-e378f",
  storageBucket: "newone-e378f.appspot.com",
  messagingSenderId: "785873579144",
  appId: "1:785873579144:web:ac4f4313a938d2c361c33d",
  measurementId: "G-FHZS1L963L",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const Admin = admin.initializeApp(firebaseConfig);
const db = getDatabase(app);

async function setData(path, data) {
  await set(ref(db, path), {
    data,
  });
}
async function GetGames() {
  const gamesRef = ref(db, "games");
  const gamesArray = [];
  const queryRef = query(gamesRef, orderByChild("data/active"), equalTo(false));
  return await get(queryRef).then((snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach((gameSnapshot) => {
        const gameData = gameSnapshot.val();

        gamesArray.push(gameData); // Push each game data object to the array
      });

      return gamesArray;
    } else {
      return [];
    }
  });
}
async function GetGame(id) {
  const gamesRef = ref(db, "games/" + id);
  let data;
  await get(gamesRef).then((snapshot) => {
    data = snapshot.val().data;
  });
  return data;
}
async function searchForGames(id) {
  const playerIdToSearch = id; // The player ID you're searching for

  const gamesRef = ref(db, "games");
  const queryRef = query(gamesRef, orderByChild("data/active"), equalTo(false));

  return await get(queryRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const matchedGames = [];
        snapshot.forEach((gameSnapshot) => {
          const gameData = gameSnapshot.val().data;

          if (gameData.players.length === 1) {
            const matchingPlayer = gameData.players.find(
              (player) => player.id !== playerIdToSearch
            );
            //searching for ghames that have one player inside and not have his inside
            if (matchingPlayer) {
              if (matchedGames.length == 0) {
                matchedGames.push({ id: gameSnapshot.key, ...gameData });
              }
            }
          }
        });
        return matchedGames;
      } else {
        return [];
      }
    })
    .catch((error) => {
      console.error("Error retrieving data:", error);
    });
}
async function Deleteold(id) {
  const gamesRef = ref(db, "games");
  const queryRef = query(
    gamesRef,
    orderByChild("data/createdBy"),
    equalTo(parseInt(id))
  );

  return await get(queryRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((gameSnapshot) => {
          const gameData = gameSnapshot.val().data;

          if (gameData.players.length === 1) {
            const gameRef = ref(db, `games/${gameData.id}`);
            remove(gameRef).then(() => {
              console.log("done");
            });
          }
        });
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => {
      console.error("Error retrieving data:", error);
    });
}
module.exports = {
  db,
  setData,
  searchForGames,
  GetGame,
  Deleteold,
  GetGames,
  Admin,
};
