// Sample project configuration.
module.exports = function(grunt) {

    grunt.initConfig({
        concat: {
            dist: {
                src: [
                    'js/src/vendor/jquery.min.js',
                    'js/src/vendor/swing/swing.js',
                    'js/src/vendor/js.cookie.js',
                    'js/src/app/**/*.js',
                ],
                dest: 'js/app.min.js'
            }
        },
        jshint: {
            beforeconcat: ['js/src/app/**/*.js'],
        },
        uglify: {
            my_target : {
                options : {
                    sourceMap : false,
                    sourceMapName : 'sourceMap.map'
                },
                // We'll be using a common JS for all the sites
                files : {
                    'js/app.min.js' : [
                        'js/app.min.js'
                    ]
                }
            }
        },
        compass: {
            dev: {
                dist: {
                    options: {
                        sassDir: 'css/scss',
                        cssDir: 'css',
                        outputStyle: 'nested'
                    }
                }
            },
            prod: {
                dist: {
                    options: {
                        sassDir: 'css/scss',
                        cssDir: 'css',
                        outputStyle: 'nested'
                    }
                }
            }
        },
        watch: {
            watch_js_files: {
                files : ['js/src/**/*.js'],
                tasks : ['concat']
            },
            watch_css_files: {
                files : ['css/scss/**/*.scss'],
                tasks : ['compass:dev']
            },
            watch_php_files: {
                files : ['../app/Models/**/*.php', '../app/Lib/*.php', '../app/Http/Controllers/*.php'],
                tasks : ['phpcs:scan']
            }
        },
        phpcs: {
            scan: {
                src: ['../app/Models/**/*.php', '../app/Lib/*.php', '../app/Http/Controllers/*.php'],
                options: {
                    bin: '/usr/bin/phpcs',
                    standard: '../phpcs/Majestic',
                }
            },
            fix: {
                src: ['../app/Models/**/*.php', '../app/Lib/*.php', '../app/Http/Controllers/*.php'],
                options: {
                    bin: '/usr/bin/phpcbf',
                    standard: '../phpcs/Majestic',
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-phpunit');
    grunt.loadNpmTasks('grunt-phpcs');

    // Default, to be used on development environments
    grunt.registerTask('default', ['compass:dev', 'jshint', 'concat', 'phpcs:scan', 'watch']); // First we compile, lint, concat JS/PHP and then we watch

    // Post Commit, to be executed after commit
    grunt.registerTask('deploy', ['jshint', 'phpcs:scan', 'concat', 'uglify', 'compass:prod']);

};