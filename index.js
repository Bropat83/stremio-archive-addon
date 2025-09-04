const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const manifest = {
  id: "org.archive",
  version: "1.0.3",
  name: "Archive.org Addon",
  description: "Películas y series gratis desde Archive.org (Español y Catalán)",
  resources: ["catalog", "meta", "stream"],
  types: ["movie", "series"],
  idPrefixes: ["archive"],
  catalogs: [
    { type: "movie", id: "archive-movies-es", name: "Archive.org Películas (Español)" },
    { type: "series", id: "archive-series-es", name: "Archive.org Series (Español)" },
    { type: "movie", id: "archive-movies-ca", name: "Archive.org Películas (Catalán)" },
    { type: "series", id: "archive-series-ca", name: "Archive.org Series (Catalán)" }
  ]
};

const builder = new addonBuilder(manifest);

// Catálogo por idioma
builder.defineCatalogHandler(async ({ type, id }) => {
  let lang = "";
  if (id.includes("-es")) lang = "spanish";
  if (id.includes("-ca")) lang = "catalan";

  const mediaType = type === "series" ? "tv" : "movies";
  const url = `https://archive.org/advancedsearch.php?q=mediatype:${mediaType}+language:${lang}&fl[]=identifier&fl[]=title&rows=20&page=1&output=json`;
  const res = await fetch(url);
  const data = await res.json();

  const metas = data.response.docs.map(item => ({
    id: "archive:" + item.identifier,
    type,
    name: item.title,
    poster: "https://archive.org/services/img/" + item.identifier
  }));

  return { metas };
});

// Metadata
builder.defineMetaHandler(async ({ id }) => {
  const identifier = id.split(":")[1];
  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetch(url);
  const data = await res.json();

  const isSeries = (data.metadata.mediatype || "").toLowerCase().includes("tv");

  const meta = {
    id: "archive:" + identifier,
    type: isSeries ? "series" : "movie",
    name: data.metadata.title || identifier,
    poster: "https://archive.org/services/img/" + identifier,
    description: data.metadata.description || "Sin descripción"
  };

  // Si es serie añadimos episodios
  if (isSeries && data.files) {
    meta.videos = data.files
      .filter(f => f.format && f.format.includes("MPEG4"))
      .map((f, i) => ({
        id: `${identifier}:${i}`,
        title: f.name,
        season: 1,
        episode: i + 1,
        released: data.metadata.date || null
      }));
  }

  return { meta };
});

// Streams
builder.defineStreamHandler(async ({ id }) => {
  const parts = id.split(":");
  const identifier = parts[1];
  const episodeIndex = parts[2];

  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetch(url);
  const data = await res.json();

  let file;
  if (episodeIndex !== undefined) {
    file = data.files.filter(f => f.format && f.format.includes("MPEG4"))[episodeIndex];
  } else {
    file = data.files.find(f => f.format && f.format.includes("MPEG4"));
  }

  const streams = file
    ? [{ title: "Archive.org", url: `https://archive.org/download/${identifier}/${file.name}` }]
    : [];

  return { streams };
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });
console.log(`Addon Archive.org corriendo en http://localhost:${port}`);
