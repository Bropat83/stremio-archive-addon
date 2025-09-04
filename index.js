const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
  id: "org.archive.fixed",
  version: "1.0.1",
  name: "Archive.org Addon (ES/CA ampliado)",
  description: "Películas y series de Archive.org con catálogo fijo ampliado en Español y Catalán",
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

// 🎬 Catálogos fijos ampliados
const catalogData = {
  "archive-movies-es": [
    { id: "archive:Nosferatu1922Español", type: "movie", name: "Nosferatu (1922)", poster: "https://archive.org/services/img/Nosferatu1922Español" },
    { id: "archive:lavidaessueno1967", type: "movie", name: "La vida es sueño (1967)", poster: "https://archive.org/services/img/lavidaessueno1967" },
    { id: "archive:Carmen1943Español", type: "movie", name: "Carmen (1943)", poster: "https://archive.org/services/img/Carmen1943Español" },
    { id: "archive:ReinaSanta1947", type: "movie", name: "La Reina Santa (1947)", poster: "https://archive.org/services/img/ReinaSanta1947" }
  ],
  "archive-series-es": [
    { id: "archive:don-quijote-de-la-mancha-dibujos-animados", type: "series", name: "Don Quijote de la Mancha (1979)", poster: "https://archive.org/services/img/don-quijote-de-la-mancha-dibujos-animados" },
    { id: "archive:ElChapulinColorado1973", type: "series", name: "El Chapulín Colorado (1973)", poster: "https://archive.org/services/img/ElChapulinColorado1973" }
  ],
  "archive-movies-ca": [
    { id: "archive:BolaDeDracZCatalan", type: "series", name: "Bola de Drac Z", poster: "https://archive.org/services/img/BolaDeDracZCatalan" },
    { id: "archive:MortadeloIFilemonCat", type: "movie", name: "Mortadel·lo i Filemó (Pel·lícula)", poster: "https://archive.org/services/img/MortadeloIFilemonCat" }
  ],
  "archive-series-ca": [
    { id: "archive:TV3_Arxiu_Catalan", type: "series", name: "TV3 Arxiu", poster: "https://archive.org/services/img/TV3_Arxiu_Catalan" },
    { id: "archive:ElsLunnisCat", type: "series", name: "Els Lunnis", poster: "https://archive.org/services/img/ElsLunnisCat" },
    { id: "archive:BolaDeDracOriginalCAT", type: "series", name: "Bola de Drac (original)", poster: "https://archive.org/services/img/BolaDeDracOriginalCAT" }
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

// Streams (intenta reproducir {identificador}.mp4)
builder.defineStreamHandler(async ({ id }) => {
  const identifier = id.split(":")[1];
  const url = `https://archive.org/download/${identifier}/${identifier}.mp4`;
  return { streams: [{ title: "Archive.org", url }] };
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`Addon fijo corriendo en http://localhost:${port}`);
