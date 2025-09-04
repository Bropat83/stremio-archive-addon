const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const manifest = {
  id: "org.archive",
  version: "1.0.0",
  name: "Archive.org Addon",
  description: "Películas gratis desde Archive.org",
  resources: ["catalog", "meta", "stream"],
  types: ["movie"],
  idPrefixes: ["archive"],
  catalogs: [
    {
      type: "movie",
      id: "archive-catalog",
      name: "Archive.org Movies"
    }
  ]
};

const builder = new addonBuilder(manifest);

// Catálogo
builder.defineCatalogHandler(async () => {
  const url = "https://archive.org/advancedsearch.php?q=mediatype:movies&fl[]=identifier&fl[]=title&rows=20&page=1&output=json";
  const res = await fetch(url);
  const data = await res.json();

  const metas = data.response.docs.map(item => ({
    id: "archive:" + item.identifier,
    type: "movie",
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

  return {
    meta: {
      id: "archive:" + identifier,
      type: "movie",
      name: data.metadata.title || identifier,
      poster: "https://archive.org/services/img/" + identifier,
      description: data.metadata.description || "Sin descripción"
    }
  };
});

// Streams
builder.defineStreamHandler(async ({ id }) => {
  const identifier = id.split(":")[1];
  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetch(url);
  const data = await res.json();

  const streams = (data.files || [])
    .filter(f => f.format && f.format.includes("MPEG4"))
    .map(f => ({
      title: "Archive.org",
      url: `https://archive.org/download/${identifier}/${f.name}`
    }));

  return { streams };
});

const port = process.env.PORT || 7000;
builder.getInterface().serveHTTP(port);
console.log(`Addon Archive.org corriendo en http://localhost:${port}`);
