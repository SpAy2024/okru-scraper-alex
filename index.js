const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // 👈 ¡IMPORTANTE!

app.get("/buscar", async (req, res) => {
  const titulo = req.query.titulo;
  if (!titulo) return res.status(400).json({ error: "Falta el parámetro 'titulo'" });

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = `https://ok.ru/video?st.query=${encodeURIComponent(titulo)}&st.mode=SearchVideo`;

    await page.goto(url, { timeout: 60000 });
    await page.waitForSelector('div.video-card_cnt', { timeout: 15000 });

    const resultados = await page.$$eval('div.video-card_cnt', cards =>
      cards.map(card => {
        const titulo = card.querySelector('.video-card_title')?.textContent?.trim() || "";
        const enlace = card.closest('a')?.href || "";
        const thumbnail = card.closest('a')?.querySelector('img')?.src || "";
        return { titulo, enlace, thumbnail };
      })
    );

    await browser.close();
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar en OK.ru", detalle: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Backend OK.ru activo en puerto ${PORT}`));
