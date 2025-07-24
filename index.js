const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/buscar", async (req, res) => {
  const titulo = req.query.titulo;
  if (!titulo) return res.status(400).json({ error: "Falta parámetro 'titulo'" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const url = `https://ok.ru/video/kino?st.query=${encodeURIComponent(titulo)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForSelector('a[href^="/video/"]', { timeout: 10000 });

    const resultados = await page.$$eval('a[href^="/video/"]', links => {
      const videos = [];
      const seen = new Set();

      links.forEach(link => {
        const href = link.getAttribute("href");
        const title = link.textContent.trim();

        if (href && !seen.has(href)) {
          seen.add(href);
          videos.push({
            titulo: title || "Sin título",
            enlace: "https://ok.ru" + href
          });
        }
      });

      return videos;
    });

    res.json(resultados);
  } catch (error) {
    console.error("Error en /buscar:", error);
    res.status(500).json({ error: "Error al buscar en OK.ru", detalle: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`✅ Backend OK.ru activo en puerto ${PORT}`));




