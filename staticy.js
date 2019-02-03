// @ts-check
const staticy = require('staticy');
const fp = staticy.fileProviders;
const trb = staticy.typescriptRollupBundle;
const site = staticy.site.createSite();

process.on("unhandledRejection", e => {
    console.error(e);
});

site.addFileProvider(fp.staticFile("./index.html", "/index.html"));
site.addFileProvider(fp.staticFile("./style.css", "/style.css"));
site.addFileProvider(trb.createTypeScriptBundle("./tsconfig.json", "app.js", "/js/app.js",
    { external: ["react", "react-dom"] },
    { globals: {"react": "React", "react-dom": "ReactDOM"} }
));

site.runDevServer();





