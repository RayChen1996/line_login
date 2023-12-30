const express = require("express");
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");
const env = require("dotenv");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://findbreakfast-b0b94.appspot.com",
});

const storage = admin.storage();
const bucket = storage.bucket();

const app = express();

// 加载环境变量
env.config();

// 读取端口时考虑默认值
const port = process.env.PORT || 3002;

// 设置存储引擎和文件名
const storageEngine = multer.memoryStorage();
const upload = multer({ storage: storageEngine });
// app.get("/images", async (req, res) => {
//   try {
//     // Fetch images from Firebase Storage
//     const bucket = storage.bucket("findbreakfast-b0b94.appspot.com");
//     const [files] = await bucket.getFiles();

//     const imageUrls = files.map((file) => {
//       // Use file.publicUrl() to generate a URL with the correct format
//       return file.publicUrl();
//     });

//     res.json({ images: imageUrls });
//   } catch (error) {
//     console.error("Error fetching images:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/images", async (req, res) => {
  try {
    const bucket = storage.bucket("findbreakfast-b0b94.appspot.com");
    const [files] = await bucket.getFiles();

    const imageUrls = files.map((file) => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/findbreakfast-b0b94.appspot.com/o/${encodeURIComponent(
        file.name
      )}?alt=media`;
      return imageUrl;
    });
    // https://firebasestorage.googleapis.com/v0/b/findbreakfast-b0b94.appspot.com/o/1703911627979.jfif?alt=media&token=eb0562a2-ae6d-4caf-b5e1-ca1782da04d9
    res.json({ images: imageUrls });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image Upload</title>
      <!-- Add Bootstrap CDN link here -->
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
      <div class="container mt-5">
        <h1 class="mb-4">Image Upload</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <div class="form-group">
            <label for="image">Choose Image:</label>
            <input type="file" class="form-control" name="image" accept="image/*" required>
          </div>
          <button type="submit" class="btn btn-primary">Upload Image</button>
        </form>
      </div>
      <!-- Add Bootstrap JS and Popper.js CDN links here (if needed) -->
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>
    </html>
  `);
});

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

    stream.on("finish", async () => {
      console.log("File uploaded to Firebase Storage.");
      await file.makePublic();
      res.status(200).send("File uploaded successfully.");
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
