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
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    await page.waitForSelector('a[href^="/video/"]', { timeout: 15000 });

    const resultados = await page.$$eval('a[href^="/video/"]', links =>
      links.map(link => {
        const title = link.innerText || link.textContent || "Sin título";
        return {
          titulo: title.trim(),
          enlace: "https://ok.ru" + link.getAttribute("href")
        };
      })
    );

    res.json(resultados);
  } catch (error) {
    console.error("Error en /buscar:", error);
    res.status(500).json({ error: "Error al buscar en OK.ru", detalle: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`✅ Backend OK.ru activo en puerto ${PORT}`));


