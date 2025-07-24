const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/buscar", async (req, res) => {
  const titulo = req.query.titulo;
  if (!titulo) return res.status(400).json({ error: "Falta parámetro 'titulo'" });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = `https://ok.ru/video/showcase?st.query=${encodeURIComponent(titulo)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const resultados = await page.$$eval("div.video-card_n", videos =>
    videos.map(v => {
      const anchor = v.querySelector("a.video-card_n-link");
      const title = v.querySelector(".video-card_n-title")?.innerText.trim();
      return {
        titulo: title || "Sin título",
        enlace: anchor ? anchor.href : null
      };
    })
  );

  await browser.close();
  res.json(resultados);
});

app.get("/", (req, res) => {
  res.send("Backend OK.ru activo.");
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));