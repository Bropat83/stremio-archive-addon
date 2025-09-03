const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");

const manifest = {
    id: "org.archive",
    version: "1.5.0",
    name: "Archive.org",
    description: "Películas y series de Archive.org con episodios, streams y subtítulos",
    resources: ["catalog", "stream", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["archive"],
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async (args) => {
    let query = "";
    if (args.type === "movie") query = "mediatype:movies";
    if (args.type === "series") query = "mediatype:tv OR subject:series";

    const res = await fetch(`https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier&fl[]=title&fl[]=image&sort[]=downloads desc&rows=20&page=1&output=json`);
    const data = await res.json();
    const metas = data.response.docs.map(item => ({
        id: `archive:${item.identifier}`,
        name: item.title,
        type: args.type,
        poster: item.image || "",
    }));
    return { metas };
});

builder.defineMetaHandler(async ({ id }) => {
    const identifier = id.split(":")[1];
    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    const data = await res.json();

    const type = (data.metadata.mediatype && data.metadata.mediatype[0] === "tv") ? "series" : "movie";
    const meta = {
        id: `archive:${identifier}`,
        name: data.metadata.title,
        type: type,
        poster: data.metadata.image ? data.metadata.image[0] : "",
        description: data.metadata.description ? data.metadata.description[0] : "",
    };

    if (type === "series" && data.files) {
        meta.videos = data.files
            .filter(file => file.format && ["MPEG4", "Ogg Video", "WebM"].includes(file.format))
            .map((file, index) => ({
                id: `archive:${identifier}:${file.name}`,
                title: `Episodio ${index + 1}`,
                season: 1,
                episode: index + 1,
            }));
    }

    return meta;
});

builder.defineStreamHandler(async ({ id }) => {
    const parts = id.split(":");
    const identifier = parts[1];
    const fileName = parts[2];

    const res = await fetch(`https://archive.org/metadata/${identifier}`);
    const data = await res.json();

    let streams = [];
    let subtitles = [];

    if (fileName) {
        streams.push({
            title: fileName,
            url: `https://archive.org/download/${identifier}/${fileName}`,
        });
    } else if (data.files && Array.isArray(data.files)) {
        data.files.forEach(file => {
            if (file.format && ["MPEG4", "Ogg Video", "WebM"].includes(file.format)) {
                streams.push({
                    title: file.name,
                    url: `https://archive.org/download/${identifier}/${file.name}`,
                });
            }
        });
    }

    if (data.files && Array.isArray(data.files)) {
        data.files.forEach(file => {
            if (file.name && file.name.match(/\.(srt|sub|vtt)$/i)) {
                subtitles.push({
                    lang: "es",
                    url: `https://archive.org/download/${identifier}/${file.name}`,
                });
            }
        });
    }

    if (streams.length === 0) {
        streams.push({
            title: "Default",
            url: `https://archive.org/download/${identifier}/${identifier}.mp4`,
        });
    }

    return { streams, subtitles };
});

const port = process.env.PORT || 7000;
builder.getInterface().serveHTTP(port);
console.log(`Stremio Archive.org Addon corriendo en http://localhost:${port}`);
