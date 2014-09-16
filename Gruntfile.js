module.exports = function(grunt) {

  // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: ['dist']
        },
        concat: {
        	player: {
        		src: [
        		      // TODO: review where order of concat matters
        		      'main/src/org/korsakow/player/Polyfill.js',
        		      'main/src/org/korsakow/player/Main.js',
        		      'main/src/org/korsakow/player/model/Model.js',
        		      'main/src/org/korsakow/player/controller/Controller.js',
                      'main/src/org/korsakow/player/model/Widget.js',
                      'main/src/org/korsakow/player/controller/Widget.js',
                      'main/src/org/korsakow/player/Mapper.js',
                      'main/src/org/korsakow/player/model/Rule.js',
                      'main/src/org/korsakow/player/Storage.js',
                      'main/src/org/korsakow/player/util/Subtitles.js',
                      'main/src/org/korsakow/player/View.js',
                      /* MAPPING PLUGIN */
                      'main/src/org/korsakow/player/mappingplugin/model/Model.js',
                      'main/src/org/korsakow/player/mappingplugin/model/Widget.js',
                      'main/src/org/korsakow/player/mappingplugin/WidgetController.js',
                      'main/src/org/korsakow/player/mappingplugin/InputMapper.js',
                      'main/src/org/korsakow/player/mappingplugin/View.js',

                      'main/src/org/korsakow/player/Bootstrap.js',
                      'main/src/org/korsakow/player/Environment.js',
                      'main/src/org/korsakow/player/Main.js'],
        		      //'main/src/org/**/*.js'],
        		dest: 'dist/player/data/lib/korsakow_player.js'
        	},
        	tests: {
        		src: ['tests-unit/src/**/*.js'],
        		dest: 'dist/tests-unit/lib/korsakow-tests-unit.js'
        	}
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'main/src',
                    src: 'lib/*',
                    dest: 'dist/player/data/'
                }, {
                    expand: true,
                    cwd: 'main/src',
                    src: 'css/*',
                    dest: 'dist/player/data/'
                }, {
                    expand: true,
                    cwd: 'main/src',
                    src: 'images/*',
                    dest: 'dist/player/data/'
                }, {
                    expand: true,
                    cwd: 'main/src',
                    src: 'index.html',
                    dest: 'dist/player/'
                }]
            },
            tests: {
                files: [{
                    expand: true,
                    cwd: 'tests-unit',
                    src: 'lib/**/*',
                    dest: 'dist/tests-unit'
                }, {
                    expand: true,
                    cwd: 'tests-unit',
                    src: '*.html',
                    dest: 'dist'
                }]
            }
        },
        watch: {
            scripts: {
                files: ['main/**/*', 'tests-unit/**/*'],
                tasks: ['concat', 'copy'],
                options: {
                    interrupt: true,
                },
            },
        },
        karma: {
            unit: {
                options: {
                    files: [
                        'dist/player/data/lib/*.js',
                        'dist/player/data/js/*.js',
                        'dist/tests-unit/lib/*.js',
                        'dist/tests-unit/js/*.js'
                    ],
                    plugins: [
                        'karma-jasmine',
                        'karma-phantomjs-launcher'
                    ],
                    frameworks: [
                        'jasmine'
                    ],
                    browsers: [
                        'PhantomJS'
                    ]
                }
            },
            unit_ci: {
                options: {
                    files: [
                        'dist/player/data/lib/*.js',
                        'dist/player/data/js/*.js',
                        'dist/tests-unit/lib/*.js',
                        'dist/tests-unit/js/*.js'
                    ],
                    plugins: [
                        'karma-jasmine',
                        'karma-phantomjs-launcher'
                    ],
                    frameworks: [
                        'jasmine'
                    ],
                    browsers: [
                        'PhantomJS'
                    ]
                },
                singleRun: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');
  
    // Default task(s).
    grunt.registerTask('default', ['concat', 'copy']);
    grunt.registerTask('dist', ['clean:dist','concat', 'copy']);

};