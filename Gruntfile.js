module.exports = function(grunt) {

	grunt.initConfig({
		compass: {
			dist: {
				options: {
					sassDir: "./scss",
					cssDir: "./src/css"
				}
			}
		},
		electron: {
	        macosBuild: {
	            options: {
	                name: 'Noir',
	                dir: 'src',
	                out: 'build',
	                icon: 'src/icon.icns',
	                version: '1.3.5',
	                platform: 'darwin',
	                arch: 'x64'
	            }
	        }
	    },
		watch: {
			compass: {
				files: [ './scss/**/*.scss' ],
				tasks: [ 'compass:dist' ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-electron');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['electron']);

};
