const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const knex = require("knex");
const app = express();

app.use(bodyParser.json());

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "Kr5n@78cai",
    database: "smart_brain",
  },
});

app.get("/", (req, res) => {
  res.json("Success");
});

app.listen(3001, () => {
  console.log("Server is running!");
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch((err) => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { email, password, name } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.commit);
  }).catch((err) => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({ id })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("Not found");
      }
    })
    .catch((err) => res.status(400).json("Error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      res.json(entries[0]);
    })
    .catch((err) => res.status(400).json("Error getting entries"));
});

// bcrypt.hash(password, null, null, function (err, hash) {
//   console.log(hash);
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function (err, res) {
//   // res == true
// });
// bcrypt.compare("veggies", hash, function (err, res) {
//   // res = false
// });

/*
root route --> this is working
/signin --> POST success/fail ...because we posting data or user info we will need to use
/register --> POST user ...because we want to store the data for future singins etc
/profile/:userId --> GET = user
/image --> PUT --> user 

*/
