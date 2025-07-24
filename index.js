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

    // Navegar a la URL de búsqueda con el título
    const url = `https://ok.ru/video/showcase?st.query=${encodeURIComponent(titulo)}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Esperar que aparezcan las tarjetas de video
    await page.waitForSelector('div.video-card_n', { timeout: 15000 });

    // Extraer datos de cada video
    const resultados = await page.$$eval('div.video-card_n', videos =>
      videos.map(v => {
        const anchor = v.querySelector("a.video-card_n-link");
        const title = v.querySelector(".video-card_n-title")?.innerText.trim() || "Sin título";
        const thumbnail = v.querySelector("img")?.src || null;
        return {
          titulo: title,
          enlace: anchor ? anchor.href : null,
          thumbnail
        };
      })
    );

    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar en OK.ru", detalle: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`✅ Backend OK.ru activo en puerto ${PORT}`));

