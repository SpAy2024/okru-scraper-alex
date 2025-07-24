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

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    const url = `https://ok.ru/video/showcase?st.query=${encodeURIComponent(titulo)}`;
    console.log("Navegando a:", url);

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    console.log("Esperando selector...");
    await page.waitForSelector('div.video-card_n', { timeout: 15000 });

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

    console.log(`Encontrados ${resultados.length} resultados`);

    res.json(resultados);
  } catch (error) {
    console.error("Error en /buscar:", error);
    res.status(500).json({ error: "Error al buscar en OK.ru", detalle: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`✅ Backend OK.ru activo en puerto ${PORT}`));

