import gulp     from "gulp";
import plugins  from "gulp-load-plugins";
import browserSync  from "browser-sync";
import fs       from "fs";
import rimraf   from "rimraf";
import yargs    from "yargs";
import merge    from "merge-stream";
import htmlInjector from "bs-html-injector";

const $ = plugins();

const PRODUCTION = !!(yargs.argv.production);

console.log(PRODUCTION);
// get cor path
let path = JSON.parse(fs.readFileSync("./path.config.json"));

// build the "build" folder by running all of the above tasks
gulp.task("build",
    gulp.series(clean, pages, sass, scripts, images, fonts));

// build tempalets, run the server, and watch for file changes
gulp.task("default",
    gulp.series("build", server, watch));

// Delete the "build" folder
// This happens every time a build starts
function clean(done) {
    rimraf(path.dist.server_dist, done);
}

// server start
function server(done) {
    browserSync.use(htmlInjector, {
        files: path.dist.html + "/*.html"
    });
    browserSync.init({
        server: path.dist.server_dist,
        notify: true
    });
    done();
}

function pages() {
    return gulp.src(path.src.pug)
        .pipe($.pug({
            pretty: true
        }))
        .pipe(gulp.dest(path.dist.html))
        .on('end', function () {
            browserSync.reload({stream: true})
        });
    // .pipe(browserSync.stream({stream: true}));
    // .pipe(browserSync.stream());
}

function sass() {
    let options = [
        require("postcss-assets")({
            loadPaths: ["src/assets/img/base64/", "src/assets/img"],
            relative: true,
            cachebuster: true
        }),
        require("postcss-inline-svg")({
            path: "src/assets/img/base64/"
        }),
        require("postcss-svgo")({
            plugins: [{
                removeDoctype: true
            }, {
                removeComments: true
            }, {
                removeTitle: true
            }, {
                removeViewBox: true
            }, {
                convertTransform: true
            }, {
                cleanupNumericValues: {
                    floatPrecision: 2
                }
            }, {
                convertColors: {
                    names2hex: false,
                    rgb2hex: false
                }
            }]
        }),
        require("postcss-flexbugs-fixes")()
    ];

    let source = gulp.src(path.src.sass)
        .pipe($.plumber())
        .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
        .pipe($.sass({
            includePaths: ["node_modules/foundation-sites/scss"]
        }).on("error", $.sass.logError))
        .pipe($.postcss(options))
        .pipe($.autoprefixer({browsers: ["last 2 version"]}));


    let styleNormal = source.pipe($.clone())
        .pipe($.if(!PRODUCTION, $.sourcemaps.write()));

    let styleMinify;

    let output = styleNormal;

    if (PRODUCTION) {
        styleMinify = source.pipe($.clone())
            .pipe($.cssnano())
            .pipe($.rename({suffix: ".min"}));

        output = merge(styleNormal, styleMinify);
    }

    return output
        .pipe(gulp.dest(path.dist.css))
        .pipe(browserSync.stream());
}

// Copy and compress images
function images() {
    let templatesImages = gulp.src(path.src.img_template)
        .pipe($.if(PRODUCTION, $.imagemin()))
        .pipe(gulp.dest(path.dist.img_template));

    let inlineImages = gulp.src(path.src.img_bs64)
        .pipe(gulp.dest(path.dist.img_bs64));

    let contentImages = gulp.src(path.src.img_content)
        .pipe($.if(PRODUCTION, $.imagemin()))
        .pipe(gulp.dest(path.dist.img_content));

    return merge(templatesImages, inlineImages, contentImages)
        .pipe(browserSync.stream());
}

function fonts() {
    let fonts = gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts));

    return fonts.pipe(browserSync.stream());
}

function scripts(done) {
    let foundation = gulp.src('node_modules/foundation-sites/dist/js/foundation.min.js');

    let libs = gulp.src(path.src.js_libs)
        .pipe($.concat("libs.js")).pipe($.babel({
            presets: ["es2015"]
        }));

    let appScripts = gulp.src(path.src.js)
        .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
        .pipe($.babel({
            presets: ["es2015"]
        }))
        .pipe($.if(!PRODUCTION, $.sourcemaps.write()));

    return merge(libs, appScripts, foundation)
        .pipe(gulp.dest(path.dist.js))
        .pipe(browserSync.stream());
}

function watch() {
    gulp.watch(
        [path.watch.html.pages, path.watch.html.layout, path.watch.html.partials]
    )
        .on("all", gulp.series(pages));
    gulp.watch(path.watch.style).on("all", gulp.series(sass));
    gulp.watch(path.watch.js).on("all", gulp.series(scripts));
    gulp.watch(path.watch.img).on("all", gulp.series(images));
    gulp.watch(path.watch.fonts).on("all", gulp.series(fonts));
}
