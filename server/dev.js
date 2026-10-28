// Servidor para desarrollo local. En Vercel se usa api/index.js.
import app from "./app.js";

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`🧵 API de Reed en http://localhost:${port}`);
});
