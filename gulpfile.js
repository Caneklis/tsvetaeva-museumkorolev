const { src, dest, parallel, series, watch, task, gulp } = require("gulp");
const fs = require("fs");
const nunjucksRender = require("gulp-nunjucks-render");
const gulpif = require("gulp-if");
const changed = require("gulp-changed");
const prettify = require("gulp-prettify");
const frontMatter = require("gulp-front-matter");

const markdown = require("nunjucks-markdown");
const marked = require("marked");

const browserSync = require("browser-sync").create();
const del = require("del");

const plumber = require("gulp-plumber");
const csscomb = require("gulp-csscomb");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("gulp-csso");
const rename = require("gulp-rename");

const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config.js");

const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");

const manageEnvironment = function (env) {
  markdown.register(env, marked);
};

const renderHtml = (onlyChanged) => {
  nunjucksRender.nunjucks.configure({
    watch: false,
    trimBlocks: true,
    lstripBlocks: false,
  });

  return src(["src/templates/**/[^_]*.html"])
    .pipe(plumber())
    .pipe(gulpif(onlyChanged, changed("build")))
    .pipe(frontMatter({ property: "data" }))
    .pipe(
      nunjucksRender({
        //PRODUCTION: config.production,
        path: "src/templates",
        manageEnv: manageEnvironment,
        data: {
          base_path: "/",
        },
      })
    )
    .pipe(
      prettify({
        indent_size: 2,
        wrap_attributes: "auto", // 'force'
        preserve_newlines: false,
        // unformatted: [],
        end_with_newline: true,
      })
    )
    .pipe(dest("build"));
};

// exports.renderHtml = renderHtml;

const nunjucks = () => renderHtml();

exports.nunjucks = nunjucks;

const nunjucksChanged = () => renderHtml(true);

exports.nunjucksChanged = nunjucksChanged;

task("nunjucks", () => renderHtml());
task("nunjucks:changed", () => renderHtml(true));

//Styles
const styles = () => {
  return src("src/sass/style.{scss,sass}")
    .pipe(sourcemap.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(
      postcss([
        autoprefixer({
          grid: true,
        }),
      ])
    )
    .pipe(csscomb({ configPath: "./csscomb.json" }))
    .pipe(dest("build/css"))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(dest("build/css"))
    .pipe(browserSync.stream());
};

const js = () => {
  return src(["src/js/main.js"])
    .pipe(webpackStream(webpackConfig))
    .pipe(dest("build/js"));
};

// Static server
const server = () => {
  browserSync.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  watch("src/sass/**/*.{scss,sass}", series(styles));
  watch(
    "src/templates/**/*.+(html|nunjucks|md)",
    parallel("nunjucks", refresh)
  );
  watch("src/js/**/*.{js,json}", series(js, refresh));
};

const svgo = () => {
  return src("src/images/**/*.{svg}")
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [
            { removeViewBox: false },
            { removeRasterImages: true },
            { removeUselessStrokeAndFill: false },
          ],
        }),
      ])
    )
    .pipe(dest("src/images"));
};

const sprite = () => {
  return src("src/images/sprite/*.svg")
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite_auto.svg"))
    .pipe(dest("build/images"));
};

//Copy files
const copy = () => {
  return src(
    [
      "src/*.html",
      "src/images/**/*.{png,jpg,gif,svg}",
      "src/fonts/**",
      "src/favicon/**",
      "src/data/**",
      "src/file/**",
      "src/*.php",
      "src/video/**", // учтите, что иногда git искажает видеофайлы, некоторые шрифты, pdf и gif - проверяйте и если обнаруживаете баги - скидывайте тестировщику такие файлы напрямую
    ],
    {
      base: "src",
    }
  ).pipe(dest("build"));
};

const clean = () => {
  return del("build");
};

const refresh = (done) => {
  browserSync.reload();
  done();
};

const build = series(clean, styles, copy, svgo, nunjucks, js, sprite);
const start = series(build, server);

const optimizeImages = () => {
  return src("build/images/**/*.{png,jpg}")
    .pipe(
      imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
      ])
    )
    .pipe(dest("build/images"));
};

exports.build = build;
exports.start = start;
exports.sprite = sprite;
exports.imagemin = optimizeImages;
exports.default = series(build, start);
