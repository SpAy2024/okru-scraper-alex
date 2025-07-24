const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/buscar", async (req, res) => {
  try {
    const titulo = req.query.titulo;
    if (!titulo) return res.status(400).json({ error: "Falta parámetro 'titulo'" });

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // NECESARIO para Render y Railway
    });

    const page = await browser.newPage();
    const url = `https://ok.ru/video/showcase?st.query=${encodeURIComponent(titulo)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

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
  } catch (error) {
    console.error("Error en /buscar:", error.message);
    res.status(500).json({ error: "Error al buscar en OK.ru" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend OK.ru activo.");
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`)
);

