const express = require("express");
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://findbreakfast-b0b94.appspot.com",
});

const storage = admin.storage();
const bucket = storage.bucket();

const app = express();
const port = 3001;

// 设置存储引擎和文件名
const storageEngine = multer.memoryStorage();
const upload = multer({ storage: storageEngine });

// 处理根路径请求，输出包含表单的 HTML
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image Upload</title>
    </head>
    <body>
      <h1>Image Upload</h1>
      <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="image" accept="image/*" required>
        <button type="submit">Upload Image</button>
      </form>
    </body>
    </html>
  `);
});

// 处理上传请求
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    // 创建一个唯一的文件名
    const fileName = Date.now() + path.extname(req.file.originalname);

    // 上传文件到 Firebase Storage
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (err) => {
      console.error("Error uploading to Firebase Storage:", err);
      res.status(500).send("Internal Server Error");
    });

    stream.on("finish", () => {
      console.log("File uploaded to Firebase Storage.");
      res.status(200).send("File uploaded successfully.");
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.listen(process.env.PORT, () => {
  console.log(`listening on http://localhost:${process.env.PORT}`);
});
