const express = require("express");
const os = require("os");
const path = require("path");
const NodeRSA = require("node-rsa");
const multer = require("multer");
const wordExtractor = require("word-extractor");
const fs = require("fs");
const bodyParse = require("body-parser");
const { json } = require("express");
const mongoose = require("mongoose");
const { Console } = require("console");
const validator = require("validator");
const usermodel = require("./models/UserModel");
const keydisModel = require("./models/KeyDistriModel");
const KeyModel = require("./models/KeyModel");
const CipherTextModel = require("./models/CipherTextModel");
const base64topdf = require("base64topdf");
// var LocalStorage = require('node-localstorage').LocalStorage,
// localStorage = new LocalStorage('./scratch');

mongoose.connect("mongodb://localhost:27017/eq", (error) => {
  if (error) {
    console.log(`error=>${error}`);
  } else {
    //  console.log("Okay ");
  }
});

const app = express();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploaded");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    const ext = file.originalname.split(".")[1];

    cb(null, Date.now() + "." + ext);
  },
});

const upload = multer({
  storage: diskStorage,
});

app.use(
  bodyParse.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 50000,
  })
);

app.use(bodyParse.json({ limit: "50mb" }));

app.use("/public", express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/index.html"));
});

app.get("/examinerhomepage", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/mainpage.html"));
});

app.get("/addlecturer", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/addlecturer.html"));
});

app.get("/keyrepoadmin", async (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/adminkeyrepo.html"));
});

app.get("/viewlectures", async (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/lectuers.html"));
});

app.get("/fetchusers", async (req, res) => {
  let allUsers = await usermodel.find({ role: { $ne: "examiner" } });
  res.json(allUsers);
  // allUsers.map(result=>{
  //   res.json({result})
  // })
});

app.get("/secured", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/securedquestions.html"));
});

app.get("/fetchciphers", async (req, res) => {
  let allciphers = await CipherTextModel.find({});
  res.json(allciphers);
  // allciphers.map(result=>{
  //   res.json({result})
  // })
});

app.post("/deleteuser", async (req, res) => {
  let uid = req.body.uid;
  let deleted = await usermodel.deleteOne({ _id: uid });
  console.log(deleted);
});

app.get("/fetchkeys", async (req, res) => {
  let allKeys = await KeyModel.find({});
  res.json(allKeys);
  // allKeys.map(result=>{
  //   res.json({result})
  // })
});

app.post("/distribute", async (req, res) => {
  let public_key = req.body.public_k;
  let private_key = req.body.private_k;

  let date = new Date();
  let getAllUsers = await usermodel.find({ role: { $ne: "examiner" } });
  getAllUsers.map((value) => {
    const sharedTo = {
      first_name: value.first_name,
      last_name: value.last_name,
      date_of_dis:
        date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(),
      public_key: public_key,
      user_confirmed: 0,
    };

    const saveKeyPair = {
      public_key,
      private_key,
      date_of_gen:
        date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(),
    };

    const fillKeyDistTable = new keydisModel(sharedTo);
    fillKeyDistTable.save((error, doc) => {
      if (!error) {
        const fillRepo = new KeyModel(saveKeyPair);
        fillRepo.save();

        // res.json({status:true})
      } else {
        console.log(error);
      }
    });
    //  res.json({status:true})
  });
  res.json({ status: true });
});

app.get("/key", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/generate.html"));
});

app.get("/encryptquestion", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/encryption.html"));
});

app.get("/decryptquestion", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/decryption.html"));
});

app.post("/deletecipher", async (req, res) => {
  let id = req.body.uid;
  let deleted = await CipherTextModel.deleteOne({ _id: id });
  if (deleted.acknowledged) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.post("/fetchsinglepersonkeys", async (req, res) => {
  let email = req.body.email;
  // console.log(email)
  let getUser = await usermodel.findOne({ email: email });
  let dbFirstname = getUser.first_name;
  let dbLastname = getUser.last_name;
  // console.log(dbFirstname)
  // console.log(dbLastname)

  let keys = await keydisModel.find({
    first_name: dbFirstname,
    last_name: dbLastname,
  });

  if (keys.length > 0) {
    res.json({ status: true, info: keys });
  } else {
    res.json({ status: false });
  }
});

app.post("/deletekeyformoneuser", async (req, res) => {
  let remove = await keydisModel.deleteOne({ _id: req.body.id });
  if (remove.acknowledged) {
    res.json({ deleted: true });
  } else {
    res.json({ deleted: false });
  }
});

app.get("/lecturerhomepage", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/lecturerhomepage.html"));
});

app.post("/sendcipher", async (req, res) => {
  let userEmail = req.body.user_email;
  let ciphertext = req.body.cipher;
  let date = new Date();
  let date_sent = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
  let time_sent = `${date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })} `;
  let getUser = await usermodel.findOne({ email: userEmail });
  let first_name = getUser.first_name;
  let last_name = getUser.last_name;

  const addCipher = {
    first_name,
    last_name,
    date_sent,
    time_sent,
    ciphertext,
  };

  const insertCipher = new CipherTextModel(addCipher);
  insertCipher.save((error, doc) => {
    if (!error) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  });
});

app.get("/testingapi", (req, res) => {
  const key = new NodeRSA({ b: 1024 });
  var public_key = key.exportKey("public");
  var private_key = key.exportKey("private");

  res.json({ private_key, public_key });
});

app.post("/plaintext", upload.single("file"), (req, res) => {
  // let privateKey = "-----BEGIN RSA PRIVATE KEY-----"+
  // "MIICXAIBAAKBgQCOy0OzptJOX9zeZBxNzdvXVUVorEd4mbfJEspIRxY1csUp6/0+\n"+
  // "vAiEltogFoMp5wdPre4YYvKCpV7PlzPkApZYEV5z5m6Fa5W4di9oDFFoRfo1ktjO\n"+
  // "oQxLMdXUuIuxVMZzTSU2ihUenoh6Igmu52pDPJ29pqPp9ct0FI8W47H4tQIDAQAB\n"+
  // "AoGAR08KyDSO4cTNr+GeoNwk5SwYNWWTa46YUTmo+t9FH/voqj7HgQS13EDZPR0A\n"+
  // "83QEGq5pMJR5NvUOm+yOZVdFbIaHt55ZvIOIkF7QcJxBoEdI4DpXlIFRRd8cPGDu\n"+
  // "Hc4sv2ik8tWNiDsPTQLKmP4zoNvQkvBenkUsZ3XcKi9eSCECQQDBDCnjpQ1GHarv\n"+
  // "Wm7s4XYwhXPW/xVTyeiHHsPLlzoutCq5Lmqwi1RvVO30EXuK6Flm9Xq9BZaiY+Vs\n"+
  // "G7dGX7mDAkEAvVvgtb6vDBX3EQ6MRAboMIrpoeH+MP3+6sbe4vxcJQzbtykUm0WZ\n"+
  // "Tr5XaUuF1K45j6+HrThWLLYd8LKzUGlHZwJAVtNFs+F0SujlDKo74ca2BbTAGR65\n"+
  // "VOom7z7jCRqHTKIz5P3/dk/0Ne6Y54FFc4B1VV1rSsDMs1UCxtDgaYJ8SQJAM2p2\n"+
  // "KoM7PpncOyprFbGWbE/bvlQB1EWzaQZU0OdbEchbBHHIIZ0VUpdGXtXd4fDoukYc\n"+
  // "HgG1DHDq0keDfusHMwJBAKtCnr1PpX1JtVL65lKQ3Iyli/o1vmQ7REHb77B4G2cF\n"+
  // "a9ssEBhAVu01PCoNO3en3qx5Mt5GAKjv9QaXr3gUxQM=\n"+
  // "-----END RSA PRIVATE KEY-----"

  // let publickey = "-----BEGIN PUBLIC KEY-----"+
  // "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCOy0OzptJOX9zeZBxNzdvXVUVo\n"+
  // "rEd4mbfJEspIRxY1csUp6/0+vAiEltogFoMp5wdPre4YYvKCpV7PlzPkApZYEV5z\n"+
  // "5m6Fa5W4di9oDFFoRfo1ktjOoQxLMdXUuIuxVMZzTSU2ihUenoh6Igmu52pDPJ29\n"+
  // "pqPp9ct0FI8W47H4tQIDAQAB\n"+
  // "-----END PUBLIC KEY-----"

  // let private_key = new NodeRSA(privateKey)
  // let public_key = new NodeRSA(publickey)

  // console.log(req.file.filename)

  var data = "";
  const extractor = new wordExtractor();
  const extracted = extractor.extract(`uploaded/${req.file.filename}`);
  extracted
    .then((doc) => {
      data = doc._body;
      res.json({ read: data, filedir: `uploaded/${req.file.filename}` });
    })
    .catch((error) => {
      console.log(error);
    });

  // let tempHolder = ""
  // filePath = path.resolve(__dirname, `uploaded/${req.file.filename}`)
  // console.log(filePath)

  //  fs.readFile(filePath,"base64",(error, doc)=>{
  //   // console.log(doc)
  //   let cipherText = public_key.encrypt(doc, "base64")
  //   console.log(cipherText)

  //   let reserved_text = private_key.decrypt(cipherText, 'utf8')
  //   console.log(reserved_text)
  //   base64topdf.base64Decode(reserved_text, "test.doc")
  //   console.log(error)

  //  })
});

app.post("/deletekey", async (req, res) => {
  let key = req.body.key;
  let deleted = await KeyModel.deleteOne({ public_key: key });
  console.log(deleted);
});

app.post("/signin", async (req, res) => {
  //    console.log(req.body)

  let option = req.body.option;
  let password = req.body.password;
  let email = req.body.email;
  let user = await usermodel.findOne({ email, email });
  //  console.log(option.toLowerCase())

  if (user) {
    console.log(user);
    //  console.log(email, result.email)
    //  console.log(password, result.password)
    //   if(user.email === email && user.password === password )
    //   {
    //     console.log(user.role)
    //     if( user.role === "examiner"){
    //        res.json({redirect_to:"examiner"})
    //     }else if (user.role === "lecturer"){
    //       res.json({redirect_to:"lecturer"})
    //     }else if(option.toLowerCase() === ""){
    //       res.json({redirect_to:"empty"})
    //     }
    //   }else{
    //     res.json({status:false})
    //   }

    // }else{
    //   res.json({status:false})
  }
});

app.get("/keyrepolecturer", (req, res) => {
  res.sendFile(path.resolve(__dirname, "pages/lectuerskeyrepo.html"));
});

app.post("/adminadduser", (req, res) => {
  // console.log(req.body)
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let email = req.body.email;
  let role = req.body.role;
  let password = req.body.password;

  if (
    first_name.toLowerCase() !== "" &&
    last_name.toLowerCase() !== "" &&
    role.toLowerCase() !== "" &&
    password.toLowerCase() !== ""
  ) {
    if (validator.isEmail(email)) {
      // ##### Add new user
      let newUser = new usermodel({
        first_name,
        last_name,
        email,
        role,
        password,
      });
      newUser.save((error, doc) => {
        if (error) {
          res.json({ internalError: true });
        } else {
          res.json({ success: true });
        }
      });

      // ##end
    } else {
      res.json({ emailError: true });
    }
  } else {
    res.json({ incomplete: true });
  }

  // if(
  //   validator.isEmpty(first_name.toLowerCase()) &&
  //   validator.isEmpty(last_name.toLowerCase())
  //   ){
  //   console.log("yes")
  // }else{
  //   console.log("xsc")
  // }
});

app.post("/uploadPublicKey", upload.single("publickey"), (req, res) => {
  //console.log(req.file.filename)
  const file = path.resolve(__dirname, `uploaded/${req.file.filename}`);
  fs.readFile(file, "utf-8", (err, data) => {
    if (!err) {
      res.json({ publickey: data });
    } else {
      console.log(err);
    }
  });

  // fs.unlink(file,(err)=>{
  //     if(err){throw err}
  //  })
});

app.post("/encrypt", (req, res) => {
  let key_public = new NodeRSA(req.body.publickey);
  // const plaintext = req.body.plaintext
  // let encryptedString = key_public.encrypt(plaintext, "base64");
  // res.json({result:encryptedString})

  let filePath = req.body.plaintext;

  fs.readFile(filePath, "base64", (error, doc) => {
    // console.log(doc)
    let cipherText = key_public.encrypt(doc, "base64");
    res.json({ result: cipherText });
    //console.log(cipherText)

    //let reserved_text = private_key.decrypt(cipherText, 'utf8')
    //console.log(reserved_text)
    //base64topdf.base64Decode(reserved_text, "test.doc")
    // console.log(error)
  });

  // console.log(req.body)
});

// Decryption Section
app.post("/uploadPrivateKey", upload.single("privatekey"), (req, res) => {
  const privateKeyPath = path.resolve(
    __dirname,
    `uploaded/${req.file.filename}`
  );
  fs.readFile(privateKeyPath, "utf-8", (error, doc) => {
    if (!error) {
      res.json({ message: doc });
    }
  });

  fs.unlink(privateKeyPath, (err) => {
    if (err) {
      throw err;
    }
  });
});

app.post("/decrypt", (req, res) => {
  let privatekey = req.body.privateKey;
  let ciphertext = req.body.ciphertext;

  // res.json({privatekey, ciphertext})
  // console.log({privatekey, ciphertext})

  let key_private = new NodeRSA(privatekey);
  let decryted_text = key_private.decrypt(ciphertext, "utf8");
  let date = new Date();
  let generateFile = date.getTime();
  // console.log(date.getTime())
  base64topdf.base64Decode(
    decryted_text,
    `public/uploaded/decrypted_exam_quest_${generateFile}.doc`
  );

  // console.log({de:decryted_text})
  if (decryted_text) {
    var data = "";
    const extractor = new wordExtractor();
    const extracted = extractor.extract(
      `public/uploaded/decrypted_exam_quest_${generateFile}.doc`
    );
    extracted
      .then((doc) => {
        data = doc._body;
        res.json({
          decrypted: data,
          status: true,
          filedir: `public/uploaded/decrypted_exam_quest_${generateFile}.doc`,
        });
        // console.log(data)
      })
      .catch((error) => {
        console.log(error);
      });
    //res.json({decrypted:decryted_text, status:true, filedir:`uploaded/decrypted_exam_quest_${date.getTime()}.doc`})
  } else {
    res.json({ status: false });
  }
});

app.post("/uploadCiphertext", upload.single("cipherfile"), (req, res) => {
  //   console.log({cipher:req.file})
  const cipherFile = path.resolve(__dirname, `uploaded/${req.file.filename}`);
  fs.readFile(cipherFile, "utf-8", (error, data) => {
    if (!error) {
      res.json({ cipher: data });
    }
  });

  fs.unlink(cipherFile, (err) => {
    if (err) {
      throw err;
    }
  });
});

app.listen(3000, () => {
  // console.log("App is currently running on port 3000");
});
