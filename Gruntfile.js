// To use this file in WebStorm, right click on the file name in the Project Panel (normally left) and select "Open Grunt Console"

/** @namespace __dirname */
/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

module.exports = function (grunt) {

    var srcDir    = __dirname + '/';
    var dstDir    = srcDir + 'build/';
    var pkg       = grunt.file.readJSON('package.json');
    var iopackage = grunt.file.readJSON('io-package.json');

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        clean: {
            all: ['tmp/*.json', 'tmp/*.zip', 'tmp/*.jpg', 'tmp/*.jpeg', 'tmp/*.png']
        },
        replace: {
            core: {
                options: {
                    patterns: [
                        {
                            match: /var version = '[\.0-9]*';/g,
                            replacement: "var version = '" + iopackage.common.version + "';"
                        },
                        {
                            match: /"version"\: "[\.0-9]*",/g,
                            replacement: '"version": "' + iopackage.common.version + '",'
                        }
                    ]
                },
                files: [
                    {
                        expand:  true,
                        flatten: true,
                        src:     [
                                srcDir + 'controller.js',
                                srcDir + 'package.json'
                        ],
                        dest:    srcDir
                    }
                ]
            }
        },
        // Javascript code styler
        jscs:   require(__dirname + '/tasks/jscs.js'),
        // Lint
        jshint: require(__dirname + '/tasks/jshint.js'),
        http: {
            get_hjscs: {
                options: {
                    url: 'https://raw.githubusercontent.com/ioBroker/ioBroker.nodejs/master/tasks/jscs.js'
                },
                dest: 'tasks/jscs.js'
            },
            get_jshint: {
                options: {
                    url: 'https://raw.githubusercontent.com/ioBroker/ioBroker.nodejs/master/tasks/jshint.js'
                },
                dest: 'tasks/jshint.js'
            },
            get_jscsRules: {
                options: {
                    url: 'https://raw.githubusercontent.com/ioBroker/ioBroker.nodejs/master/tasks/jscsRules.js'
                },
                dest: 'tasks/jscsRules.js'
            }
        },
        compress: {
            adapter: {
                options: {
                    archive: dstDir + 'ioBroker.adapter.' + iopackage.common.name + '.zip'
                },
                files: [
                    {
                        expand: true,
                        src: ['**', '!tasks/*', '!Gruntfile.js', '!node_modules/**/*', '!build/**/*'],
                        dest: '/',
                        cwd: srcDir
                    }
                ]
            }
        }
    });

    grunt.registerTask('updateReadme', function () {
        var readme = grunt.file.read('README.md');
        if (iopackage.common && readme.indexOf(iopackage.common.version) == -1) {
            var timestamp = new Date();
            var date = timestamp.getFullYear() + '-' +
                ("0" + (timestamp.getMonth() + 1).toString(10)).slice(-2) + '-' +
                ("0" + (timestamp.getDate()).toString(10)).slice(-2);

            var news = "";
            if (iopackage.whatsNew) {
                for (var i = 0; i < iopackage.whatsNew.length; i++) {
                    if (typeof iopackage.whatsNew[i] == 'string') {
                        news += '* ' + iopackage.whatsNew[i] + '\r\n';
                    } else {
                        news += '* ' + iopackage.whatsNew[i].en + '\r\n';
                    }
                }
            }
            grunt.file.write('CHANGELOG.md', '# ' + iopackage.version + ' (' + date + ')\r\n' + news + '\r\n' + readme);
        }
    });

    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-http');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', [
//        'http',
        'clean',
        'replace',
        'updateReadme',
        'compress'
        //'jshint',
        //'jscs',
    ]);
};