// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  set,
  orderByChild,
  equalTo,
  query,
  get,
} = require("firebase/database");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyTBYa6vYwVMK_4ZbVrssScG_M648IHqw",
  authDomain: "aaass-45476.firebaseapp.com",
  databaseURL: "https://aaass-45476-default-rtdb.firebaseio.com",
  projectId: "aaass-45476",
  storageBucket: "aaass-45476.appspot.com",
  messagingSenderId: "247585851340",
  appId: "1:247585851340:web:b447992565ea9758fcff69",
  measurementId: "G-NFJ5TKJ995",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

 async function setData(path, data) {
  await set(ref(db, path), {
    data,
  })
   
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
module.exports = { db, setData, searchForGames, GetGame };
