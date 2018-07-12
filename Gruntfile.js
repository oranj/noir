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
		'electron-packager': {
			macosBuild: {
				options: {
					platform: 'darwin',
					arch: 'x64',
					dir: 'src',
					out: 'build',
					icon: 'src/icons.icns',
					name: 'Noir',
					electronVersion: '2.0.4',
					overwrite: true

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
	                electronVersion: '2.0.4',
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
	grunt.loadNpmTasks('grunt-electron-packager');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['electron']);

};
