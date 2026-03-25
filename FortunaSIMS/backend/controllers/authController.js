
// =========================
// SIGNUP
// =========================
const pool = require("../config/db");
const bcrypt = require("bcrypt");
// const { v4: uuidv4 } = require("uuid");
exports.signup = async (req, res) => {

  try {
    console.log("Signup Body:", req.body);
    const { full_name, email, password, terms_accepted } = req.body;

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("HASHED PASSWORD:", hashedPassword);
    const masterUser = await pool.query(
      "SELECT * FROM user_master WHERE email=$1",
      [email]
    );

    if(masterUser.rows.length === 0){
      return res.json({
        success:false,
        message:"You are not authorized. Contact administrator."
      });
    }

    const checkUser = await pool.query(
      "SELECT * FROM users_signup WHERE email=$1",
      [email]
    );

    if(checkUser.rows.length > 0){
      return res.json({
        success:false,
        message:"User already registered"
      });
    }

    const result = await pool.query(
      `INSERT INTO users_signup
      (full_name,email,password,terms_accepted)
      VALUES($1,$2,$3,$4)
      RETURNING *`,
      [full_name,email,hashedPassword,terms_accepted]
    );

    res.json({
      success:true,
      user:result.rows[0]
    });

  } catch (error) {

    console.log("Signup Error:", error);

    res.status(500).json({
      success:false,
      message:"Server error"
    });

  }

};



// =========================
// LOGIN
// =========================

exports.login = async (req,res)=>{

  const { email,password } = req.body;

  try{

    // STEP 1 → Check user exists in user_master
    const masterUser = await pool.query(
      "SELECT * FROM user_master WHERE email=$1",
      [email]
    );

    if(masterUser.rows.length === 0){

      return res.json({
        success:false,
        message:"Not a valid SIMS user"
      });

    }

    // STEP 2 → Check signup table
    const user = await pool.query(
      "SELECT * FROM users_signup WHERE email=$1",
      [email]
    );

    if(user.rows.length === 0){

      return res.json({
        success:false,
        message:"Please signup first"
      });

    }

    // STEP 3 → Validate password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

if(!isMatch){
  return res.json({
    success:false,
    message:"Invalid password"
  });
}

    // STEP 4 → Login success
    res.json({
      success:true,
      user:{
        full_name:user.rows[0].full_name,
        email:user.rows[0].email
      }
    });

  }catch(err){

    console.log("Login Error:",err)

    res.status(500).json({
      success:false,
      message:"Server error"
    })

  }

};

