const { addonBuilder } = require("stremio-addon-sdk");

const manifest = {
  id: "org.archive.test",
  version: "1.0.0",
  name: "Archive.org Test",
  description: "Addon de prueba desde Archive.org",
  resources: ["catalog"],
  types: ["movie"],
  idPrefixes: ["archive"]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(() => {
  return Promise.resolve({
    metas: [
      {
        id: "archive:test1",
        type: "movie",
        name: "Película de prueba 1",
        poster: "https://placekitten.com/300/400"
      },
      {
        id: "archive:test2",
        type: "movie",
        name: "Película de prueba 2",
        poster: "https://placekitten.com/301/400"
      }
    ]
  });
});

const port = process.env.PORT || 7000;
builder.getInterface().serveHTTP(port);
console.log(`Addon corriendo en http://localhost:${port}`);
