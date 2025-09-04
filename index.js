const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "org.archive.fixed",
  version: "1.0.0",
  name: "Archive.org Addon (ES/CA fijo)",
  description: "Películas y series de Archive.org con catálogo fijo en Español y Catalán",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  idPrefixes: ["archive"],
  catalogs: [
    { type: "movie", id: "archive-movies-es", name: "Películas (Español)" },
    { type: "series", id: "archive-series-es", name: "Series (Español)" },
    { type: "movie", id: "archive-movies-ca", name: "Películas (Catalán)" },
    { type: "series", id: "archive-series-ca", name: "Series (Catalán)" }
  ]
};

const builder = new addonBuilder(manifest);

// 🎬 Catálogos fijos
const catalogData = {
  "archive-movies-es": [
    { id: "archive:Nosferatu1922Español", type: "movie", name: "Nosferatu (1922)", poster: "https://archive.org/services/img/Nosferatu1922Español" },
    { id: "archive:lavidaessueno1967", type: "movie", name: "La vida es sueño (1967)", poster: "https://archive.org/services/img/lavidaessueno1967" }
  ],
  "archive-series-es": [
    { id: "archive:don-quijote-de-la-mancha-dibujos-animados", type: "series", name: "Don Quijote de la Mancha (1979)", poster: "https://archive.org/services/img/don-quijote-de-la-mancha-dibujos-animados" }
  ],
  "archive-movies-ca": [
    { id: "archive:BolaDeDracZCatalan", type: "series", name: "Bola de Drac Z", poster: "https://archive.org/services/img/BolaDeDracZCatalan" }
  ],
  "archive-series-ca": [
    { id: "archive:TV3_Arxiu_Catalan", type: "series", name: "TV3 Arxiu", poster: "https://archive.org/services/img/TV3_Arxiu_Catalan" },
    { id: "archive:ElsLunnisCat", type: "series", name: "Els Lunnis", poster: "https://archive.org/services/img/ElsLunnisCat" }
  ]
};

// Catálogo
builder.defineCatalogHandler(async ({ id }) => {
  return { metas: catalogData[id] || [] };
});

// Metadata
builder.defineMetaHandler(async ({ id }) => {
  const identifier = id.split(":")[1];
  return {
    meta: {
      id,
      type: id.includes("series") ? "series" : "movie",
      name: identifier,
      poster: "https://archive.org/services/img/" + identifier,
      description: "Contenido desde Archive.org"
    }
  };
});

// Streams
builder.defineStreamHandler(async ({ id }) => {
  const identifier = id.split(":")[1];
  const url = `https://archive.org/download/${identifier}/${identifier}.mp4`;
  return { streams: [{ title: "Archive.org", url }] };
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`Addon fijo corriendo en http://localhost:${port}`);
