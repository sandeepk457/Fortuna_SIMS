const pool = require("../config/db");

const findUserInMaster = async (email) => {

  const result = await pool.query(
    "SELECT * FROM user_master WHERE email=$1",
    [email]
  );

  return result.rows[0];
};

const findUserSignup = async (email) => {

  const result = await pool.query(
    "SELECT * FROM users_signup WHERE email=$1",
    [email]
  );

  return result.rows[0];
};

const createSignup = async (email,password) => {

  const result = await pool.query(
    `INSERT INTO users_signup(email,password)
     VALUES($1,$2)
     RETURNING *`,
    [email,password]
  );

  return result.rows[0];
};

module.exports = {
  findUserInMaster,
  findUserSignup,
  createSignup
};