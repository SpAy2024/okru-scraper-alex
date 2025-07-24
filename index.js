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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Simular navegador real
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    const url = `https://ok.ru/feed?st.query=${encodeURIComponent(titulo)}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 40000 });

    // Scroll hacia abajo para cargar más resultados
    await autoScroll(page);

    const resultados = await page.$$eval("div.video-card_n", videos =>
      videos.map(v => {
        const anchor = v.querySelector("a.video-card_n-link");
        const title = v.querySelector(".video-card_n-title")?.innerText.trim();
        const thumbnail = v.querySelector("img")?.src;
        return {
          titulo: title || "Sin título",
          enlace: anchor ? anchor.href : null,
          thumbnail: thumbnail || null
        };
      })
    );

    await browser.close();

    if (resultados.length === 0) {
      return res.status(404).json({ error: "No se encontraron resultados" });
    }

    res.json(resultados);
  } catch (error) {
    console.error("❌ Error en /buscar:", error.message);
    res.status(500).json({ error: "Error al buscar en OK.ru" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend OK.ru activo.");
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`)
);

// Función para hacer scroll automático
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}
